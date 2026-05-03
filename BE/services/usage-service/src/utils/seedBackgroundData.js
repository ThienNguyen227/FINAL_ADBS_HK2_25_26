const UsageReading = require("../models/UsageReading");

/**
 * Auto-seed dữ liệu nền (Background Neighborhood Data) cho ngày hôm nay.
 * Bao gồm tọa độ GeoJSON để hỗ trợ Geospatial Indexing.
 */
async function seedBackgroundData() {
  try {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const existing = await UsageReading.findOne({ meter_id: "METER_BG_2_KHU_VUC_MAC_DINH", day: today });
    if (existing) {
      console.log("[Seed] Dữ liệu nền ngày hôm nay đã tồn tại. Bỏ qua.");
      return;
    }

    console.log("[Seed] Đang tạo dữ liệu nền với tọa độ GeoJSON...");

    // Các khu vực mẫu tại TP.HCM với tọa độ trung tâm
    const neighborhoods = [
      { id: "KHU_VUC_MAC_DINH", lng: 106.7009, lat: 10.7769 },
      { id: "DISTRICT_1",       lng: 106.6981, lat: 10.7726 },
      { id: "DISTRICT_2",       lng: 106.7520, lat: 10.8490 },
    ];
    
    const bulkOps = [];

    for (const nb of neighborhoods) {
      for (let i = 2; i <= 11; i++) {
        const meterId = `METER_BG_${i}_${nb.id}`;
        
        const readings = [];
        for (let j = 0; j < 96; j++) {
          const ts = new Date(today);
          ts.setMinutes(j * 15);
          const normalUsage = parseFloat((Math.random() * 0.25 + 0.1).toFixed(2));
          readings.push({ timestamp: ts, usage: normalUsage });
        }
        const totalUsage = readings.reduce((sum, r) => sum + r.usage, 0);

        // Sinh tọa độ ngẫu nhiên quanh trung tâm khu vực (bán kính ~2km)
        const offsetLng = (Math.random() - 0.5) * 0.04;
        const offsetLat = (Math.random() - 0.5) * 0.04;

        bulkOps.push({
          updateOne: {
            filter: { meter_id: meterId, day: today },
            update: {
              $setOnInsert: {
                neighborhood_id: nb.id,
                readings: readings,
                total_daily_usage: parseFloat(totalUsage.toFixed(2)),
                reading_count: readings.length,
                location: {
                  type: "Point",
                  coordinates: [nb.lng + offsetLng, nb.lat + offsetLat]
                }
              }
            },
            upsert: true
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await UsageReading.bulkWrite(bulkOps);
      console.log(`[Seed] Đã tạo ${bulkOps.length} đồng hồ nền với tọa độ GeoJSON.`);
    }

  } catch (err) {
    console.error("[Seed] Lỗi khi tạo dữ liệu nền:", err.message);
  }
}

module.exports = seedBackgroundData;
