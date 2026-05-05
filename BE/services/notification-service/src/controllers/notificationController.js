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

exports.processEvent = async (req, res) => {
  try {
    const { meter_id, neighborhood_id, usage, z_score } = req.body;

    // SCENARIO 1: Hard Rule (usage === 0)
    if (usage === 0) {
      // 1. Create PENDING notification
      await Notification.create({
        meter_id,
        neighborhood_id,
        type: "HARD_RULE",
        status: "PENDING",
        usage: 0,
        message: `Mất điện (0 kWh) tại đồng hồ ${meter_id}`,
      });

      // 2. Count PENDING in last 5 mins
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const pendingCount = await Notification.countDocuments({
        neighborhood_id,
        status: "PENDING",
        type: "HARD_RULE",
        created_at: { $gte: fiveMinsAgo }
      });

      // Macro Event threshold (e.g., > 5 households)
      if (pendingCount > 5) {
        // Suppress individual alerts
        await Notification.updateMany(
          { neighborhood_id, status: "PENDING", type: "HARD_RULE" },
          { $set: { status: "SUPPRESSED" } }
        );

        // Create 1 Macro Event
        const existingMacro = await Notification.findOne({
          neighborhood_id,
          type: "MACRO_EVENT",
          created_at: { $gte: fiveMinsAgo }
        });

        if (!existingMacro) {
          await Notification.create({
            meter_id: "ALL",
            neighborhood_id,
            type: "MACRO_EVENT",
            status: "DELIVERED",
            message: `Khu vực ${neighborhood_id} đang mất điện diện rộng`,
          });
          // Send email to Operator
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "lehang.com86@gmail.com",
            subject: "[CẢNH BÁO MẤT ĐIỆN DIỆN RỘNG]",
            text: `Khu vực ${neighborhood_id} đang mất điện diện rộng. Số hộ ảnh hưởng: ${pendingCount}`,
          }).catch(console.error);
        }
      } else {
        // Assume individual for now, mark as DELIVERED after a short delay or immediately.
        // For simplicity, we just mark DELIVERED and send email.
        await Notification.updateOne(
          { meter_id, status: "PENDING", type: "HARD_RULE" },
          { $set: { status: "DELIVERED" } }
        );

        // Call Customer Service to update SQL Server
        const userId = Number(meter_id.split("_")[1]);
        try {
          await axios.post("http://localhost:3001/customer/update-offline-status", { user_id: userId });
        } catch (err) {
          console.error("Error updating SQL status:", err.message);
        }

        // Send email to Electrician
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: "phannguyenquocthang311205@gmail.com",
          subject: "[YÊU CẦU SỬA CHỮA] Hỏng đồng hồ / Mất điện cá nhân",
          text: `Đồng hồ ${meter_id} tại khu ${neighborhood_id} báo 0 kWh. Vui lòng kiểm tra.`,
        }).catch(console.error);
      }

      return res.status(200).json({ success: true, message: "Processed Hard Rule" });
    }

    // SCENARIO 2: Z-Score Anomaly
    if (z_score > 10) {
      await Notification.create({
        meter_id,
        neighborhood_id,
        type: "Z_SCORE_ANOMALY",
        status: "DELIVERED",
        z_score,
        usage,
        message: `Bất thường NGIÊM TRỌNG (Z = ${z_score}) tại ${meter_id}. Cần ngắt điện từ xa!`,
      });

      // Email Operator
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: "lehang.com86@gmail.com",
        subject: "[CẢNH BÁO Z-SCORE > 10] Cần can thiệp gấp!",
        text: `Đồng hồ ${meter_id} có Z-Score = ${z_score}. Mức tiêu thụ: ${usage} kWh. Vui lòng vào hệ thống để ngắt điện từ xa.`,
      }).catch(console.error);

      return res.status(200).json({ success: true, message: "Processed Z > 10" });
    } 
    
    if (z_score > 3.0 && z_score <= 5.0) {
      // Add to Watchlist
      await Notification.create({
        meter_id,
        neighborhood_id,
        type: "Z_SCORE_ANOMALY",
        status: "WATCHLIST",
        z_score,
        usage,
        message: `Theo dõi bất thường (Z = ${z_score}) tại ${meter_id}`,
      });

      // Check Watchlist count in last 60 mins
      const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
      const watchlistCount = await Notification.countDocuments({
        meter_id,
        status: "WATCHLIST",
        created_at: { $gte: sixtyMinsAgo }
      });

      if (watchlistCount >= 3) {
        // Upgrade to DELIVERED
        await Notification.updateMany(
          { meter_id, status: "WATCHLIST" },
          { $set: { status: "DELIVERED", message: `Bất thường DUY TRÌ (Z > 3.0) tại ${meter_id}` } }
        );

        // Fetch Customer Email
        const userId = Number(meter_id.split("_")[1]);
        try {
          const userRes = await axios.get(`http://localhost:3000/auth/user/${userId}`);
          const customerEmail = userRes.data?.data?.user_email;
          if (customerEmail) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: customerEmail,
              subject: "[CẢNH BÁO TIÊU THỤ ĐIỆN BẤT THƯỜNG]",
              text: `Gia đình bạn đang có mức tiêu thụ điện cao bất thường liên tục trong 1 giờ qua. Vui lòng kiểm tra các thiết bị điện (bàn ủi, rò rỉ điện,...).`,
            }).catch(console.error);
          }
        } catch (err) {
          console.error("Error fetching customer email:", err.message);
        }
      }

      return res.status(200).json({ success: true, message: "Processed Watchlist Z-Score" });
    }

    res.status(200).json({ success: true, message: "No action needed" });

  } catch (error) {
    console.error("Notification Process Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.clearWatchlist = async (req, res) => {
  try {
    const { meter_id } = req.body;
    await Notification.updateMany(
      { meter_id, status: "WATCHLIST" },
      { $set: { status: "RESOLVED" } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ status: "DELIVERED" }).sort({ created_at: -1 }).limit(50);
    res.status(200).json({ success: true, data: notifications });
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
    // Simulate remote disconnect logic here
    console.log(`[ACTION] Thực hiện ngắt điện từ xa cho đồng hồ ${meter_id}`);
    res.status(200).json({ success: true, message: "Đã gửi lệnh ngắt điện từ xa thành công." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
