const Notification = require("../models/Notification");
const nodemailer = require("nodemailer");
const axios = require("axios");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Bộ nhớ đệm để chống trùng lặp thông báo diện rộng (Race Condition Lock)
const macroLock = new Set();

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      status: "DELIVERED"
    }).sort({ created_at: -1 }).limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.processEvent = async (req, res) => {
  try {
    const { meter_id, neighborhood_id, usage, z_score, is_restored, location } = req.body;
    let type = usage === 0 ? "HARD_RULE" : "Z_SCORE_ANOMALY";

    // NẾU CÓ ĐIỆN LẠI (ONLINE)
    if (is_restored) {
      const userId = Number(meter_id.split("_")[1]);
      if (!isNaN(userId)) {
        axios.post("http://localhost:3001/customer/update-online-status", { user_id: userId }).catch(() => { });
      }
      // Không cần xử lý tiếp nếu chỉ là tin báo online
      if (z_score <= 3.0) return res.status(200).json({ success: true });
    }

    // 1. XỬ LÝ WATCHLIST (Z-SCORE NHẸ: 3.0 < Z < 10.0)
    if (type === "Z_SCORE_ANOMALY" && z_score <= 10 && z_score > 3.0) {
      await Notification.create({
        meter_id, neighborhood_id, type, z_score, usage,
        status: "WATCHLIST",
        message: `🟡 Theo dõi bất thường tại ${meter_id}`
      });

      const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
      const watchlistCount = await Notification.countDocuments({
        meter_id, status: "WATCHLIST", created_at: { $gte: sixtyMinsAgo }
      });

      if (watchlistCount >= 3) {
        await Notification.updateMany({ meter_id, status: "WATCHLIST" }, { $set: { status: "ARCHIVED" } });
        await Notification.create({
          meter_id, neighborhood_id, type, z_score, usage,
          status: "DELIVERED",
          message: `⚠️ CẢNH BÁO DUY TRÌ: Đồng hồ ${meter_id} bất thường liên tục 3 chu kỳ.`
        });
      }
      return res.status(200).json({ success: true });
    }

    // 2. XỬ LÝ CÁC TRƯỜNG HỢP KHẨN CẤP (Z > 10 HOẶC USAGE = 0)
    // Dùng cơ chế PENDING để gom nhóm diện rộng
    const newNotif = await Notification.create({
      meter_id, neighborhood_id, type, z_score, usage,
      status: "PENDING",
      message: type === "HARD_RULE" ? `Mất điện tại ${meter_id}` : `Phụ tải cực cao tại ${meter_id}`
    });

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const pendingCount = await Notification.countDocuments({
      neighborhood_id,
      status: "PENDING",
      created_at: { $gte: fiveMinsAgo }
    });

    if (pendingCount >= 5) {
      // 1. Kiểm tra khóa trong bộ nhớ (Chống trùng lặp tức thì)
      const lockKey = `${neighborhood_id}_${type}`;
      if (macroLock.has(lockKey)) {
        return res.status(200).json({ success: true, message: "Suppressed by memory lock" });
      }

      // Đặt khóa
      macroLock.add(lockKey);
      setTimeout(() => macroLock.delete(lockKey), 10000); // Mở khóa sau 10 giây

      // 2. PHÁT HIỆN LỖI DIỆN RỘNG (MACRO EVENT)
      await Notification.updateMany(
        { neighborhood_id, status: "PENDING", created_at: { $gte: fiveMinsAgo } },
        { $set: { status: "SUPPRESSED" } }
      );

      // 3. Kiểm tra lại Database (Cẩn thận tối đa)
      const oneMinAgo = new Date(Date.now() - 60 * 1000);
      const existingMacro = await Notification.findOne({
        neighborhood_id,
        type: "MACRO_EVENT",
        created_at: { $gte: oneMinAgo }
      });

      if (!existingMacro) {
        await Notification.create({
          meter_id: "Toàn khu",
          neighborhood_id,
          type: "MACRO_EVENT",
          status: "DELIVERED",
          message: type === "HARD_RULE"
            ? `🚫 CẢNH BÁO: KHU VỰC ${neighborhood_id} ĐANG MẤT ĐIỆN DIỆN RỘNG!`
            : `🔥 CẢNH BÁO: KHU VỰC ${neighborhood_id} CÓ BIẾN ĐỘNG PHỤ TẢI CỰC LỚN!`
        });

        // Email khẩn cấp cho Operator
        transporter.sendMail({
          from: `"EVN System" <${process.env.EMAIL_USER}>`,
          to: "lehang.com86@gmail.com",
          subject: "[CẢNH BÁO HỆ THỐNG] Sự cố diện rộng tại " + neighborhood_id,
          text: "Phát hiện nhiều hộ có bất thường cùng lúc. Vui lòng kiểm tra trạm biến áp."
        }).catch(() => { });
      }
    } else {
      // CHỜ 3 GIÂY ĐỂ XÁC NHẬN LÀ LỖI CÁ NHÂN
      setTimeout(async () => {
        const check = await Notification.findById(newNotif._id);
        if (check && check.status === "PENDING") {
          await Notification.findByIdAndUpdate(newNotif._id, {
            status: "DELIVERED",
            message: type === "HARD_RULE"
              ? `🔴 SỰ CỐ: Mất điện tại đồng hồ ${meter_id}`
              : `🔴 KHẨN CẤP: Phụ tải cực cao (Z=${z_score}) tại ${meter_id}`
          });

          // Nếu mất điện cá nhân, gọi SQL Server và gửi mail cho thợ
          if (type === "HARD_RULE") {
            const userId = Number(meter_id.split("_")[1]);
            if (!isNaN(userId)) {
              axios.post("http://localhost:3001/customer/update-offline-status", { user_id: userId }).catch(() => { });
            }

            // GỬI MAIL CHO THỢ SỬA ĐIỆN
            const mapsUrl = location
              ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
              : "Không có tọa độ cụ thể";

            transporter.sendMail({
              from: `"EVN System" <${process.env.EMAIL_USER}>`,
              to: "phannguyenquocthang311205@gmail.com",
              subject: `[LỆNH CÔNG TÁC] Sửa chữa mất điện tại đồng hồ ${meter_id}`,
              text: `Chào thợ sửa điện,\n\nHệ thống Smart Grid phát hiện mất điện đột ngột tại đồng hồ: ${meter_id}.\nKhu vực: ${neighborhood_id}\n\nVị trí trên bản đồ:\n${mapsUrl}\n\nVui lòng đến kiểm tra và khắc phục sự cố ngay cho khách hàng.\n\nTrân trọng,\nHệ thống điều độ EVN.`
            }).catch(err => console.error("Email Error:", err));
          }
        }
      }, 3000);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.remoteDisconnect = async (req, res) => {
  try {
    const { meter_id } = req.body;
    res.status(200).json({ success: true, message: "Đã gửi lệnh ngắt điện từ xa thành công." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.status(200).json({ success: true, message: "Đã xóa toàn bộ thông báo." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteLatest = async (req, res) => {
  try {
    const { meter_id } = req.body;
    // Tìm và xóa thông báo mới nhất của đồng hồ này trong vòng 1 phút qua
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    await Notification.findOneAndDelete({
      meter_id,
      created_at: { $gte: oneMinAgo }
    }, { sort: { created_at: -1 } });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
