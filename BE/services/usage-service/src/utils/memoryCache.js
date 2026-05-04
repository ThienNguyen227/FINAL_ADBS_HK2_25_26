/**
 * File này đóng vai trò thay thế cho Redis trong mô hình 2-Tier Architecture
 * phục vụ cho việc Demo trên lớp khi mạng kém không thể sử dụng Redis thật.
 * Dữ liệu được lưu trữ trực tiếp vào RAM của Node.js (In-Memory).
 */

// 1. LỚP CACHE (Tương đương Redis KEY-VALUE)
// Lưu trữ { mu, sigma } cho từng meter_id
const baselineCache = new Map();

// 2. LỚP BUFFER (Tương đương Redis SORTED SET hoặc LIST)
// Lưu trữ danh sách các meter_id bị lỗi Micro Anomaly theo từng neighborhood_id
// Cấu trúc: alertBuffer.get('neighborhood_id') = [{ meter_id, timestamp }, ...]
const alertBuffer = new Map();

module.exports = {
  baselineCache,
  alertBuffer
};
