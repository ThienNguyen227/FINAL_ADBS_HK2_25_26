import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Paper, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Select, MenuItem, FormControl, InputLabel,
  Slider, Grid
} from "@mui/material";

// ================== COMPONENT BẢN ĐỒ GIẢ LẬP (SVG BASED) ==================
function SimulatedMap({ center, radiusKm, meters, avgUsage }) {
  const width = 800; // Tăng kích thước bản đồ
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  // Tỷ lệ Zoom
  const scale = (height / 2 - 50) / radiusKm;

  // Chuyển đổi GPS sang Pixel
  const getCoords = (lng, lat) => {
    const dLng = lng - center.longitude;
    const dLat = lat - center.latitude;
    const dy = dLat * 111.32;
    const dx = dLng * (40075 * Math.cos((center.latitude * Math.PI) / 180) / 360);
    return { x: centerX + dx * scale, y: centerY - dy * scale };
  };

  const getSeverityColor = (usage) => {
    if (usage > avgUsage * 3) return "#f44336"; // Đỏ
    if (usage > avgUsage * 2) return "#ff9800"; // Vàng
    return "#4caf50"; // Xanh
  };

  return (
    <Card sx={{ mb: 4, overflow: "hidden", border: "1px solid #e0e0e0", boxShadow: 4, borderRadius: 3 }}>
      <Box sx={{ p: 2, bgcolor: "#1a237e", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" fontWeight="bold">🗺️ Bản đồ tải điện (Bán kính {radiusKm}km)</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Chip label="Bình thường" size="small" sx={{ bgcolor: "#4caf50", color: "white" }} />
          <Chip label="Cảnh báo" size="small" sx={{ bgcolor: "#ff9800", color: "white" }} />
          <Chip label="Quá tải" size="small" sx={{ bgcolor: "#f44336", color: "white" }} />
        </Box>
      </Box>

      <Box sx={{ bgcolor: "#f5f5f5", display: "flex", justifyContent: "center", p: 3 }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ backgroundColor: "#e3f2fd", borderRadius: "12px", border: "2px solid #90caf9" }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cfd8dc" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="radarGradient">
              <stop offset="0%" stopColor="#2196f3" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2196f3" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Radar Circles */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
            <circle key={p} cx={centerX} cy={centerY} r={radiusKm * scale * p} fill="none" stroke="#bbdefb" strokeWidth="1" strokeDasharray="4" />
          ))}

          {/* Vùng quét */}
          <circle cx={centerX} cy={centerY} r={radiusKm * scale} fill="url(#radarGradient)" stroke="#2196f3" strokeWidth="2" />

          {/* Meters */}
          {meters.map((meter, i) => {
            const pos = getCoords(meter.location.coordinates[0], meter.location.coordinates[1]);
            const color = getSeverityColor(meter.total_daily_usage);
            const isCritical = color === "#f44336";
            return (
              <g key={i}>
                <circle cx={pos.x} cy={pos.y} r={isCritical ? 8 : 6} fill={color} stroke="white" strokeWidth="2">
                  <title>{`${meter.meter_id}\nTiêu thụ: ${meter.total_daily_usage.toFixed(2)}kWh`}</title>
                </circle>
                {isCritical && (
                  <circle cx={pos.x} cy={pos.y} r={8} fill="none" stroke="#f44336" strokeWidth="2">
                    <animate attributeName="r" from="8" to="20" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Trạm biến áp (Icon Trung tâm) */}
          <g>
            <rect x={centerX - 15} y={centerY - 15} width={30} height={30} rx={4} fill="#c62828" stroke="white" strokeWidth="2" />
            <text x={centerX} y={centerY + 4} textAnchor="middle" fontSize="18" fill="white" fontWeight="bold">⚡</text>
            <text x={centerX} y={centerY + 35} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a237e">
              {center.name}
            </text>
          </g>
        </svg>
      </Box>
    </Card>
  );
}

export default function GeoMonitoring() {
  const [substations, setSubstations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy danh sách trạm biến áp
  useEffect(() => {
    fetch("http://localhost:3004/api/usage/substations")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSubstations(data.data);
          if (data.data.length > 0) setSelectedStation(data.data[0]);
        }
      })
      .catch(() => setError("Không thể tải danh sách trạm biến áp"));
  }, []);

  const handleSearch = async () => {
    if (!selectedStation) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3004/api/usage/geo-search?longitude=${selectedStation.longitude}&latitude=${selectedStation.latitude}&radiusKm=${radiusKm}`
      );
      const data = await res.json();
      if (data.success) {
        setResults(data);
      } else {
        setError(data.message || "Truy vấn thất bại");
      }
    } catch (err) {
      setError("Lỗi mạng. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (usage, avg) => {
    if (usage > avg * 3) return { label: "QUÁ TẢI", color: "error" };
    if (usage > avg * 2) return { label: "CẢNH BÁO", color: "warning" };
    return { label: "BÌNH THƯỜNG", color: "success" };
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        🌐 Giám sát lưới điện theo vị trí địa lý
      </Typography>


      {/* BẢNG ĐIỀU KHIỂN */}
      <Card sx={{ mb: 4, bgcolor: "#f0f7ff", border: "1px solid #bbdefb" }}>
        <CardContent>
          <Typography variant="h6" color="primary.dark" gutterBottom fontWeight="bold">
            📍 Chọn trạm biến áp & bán kính khoanh vùng
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel>Trạm biến áp</InputLabel>
                <Select
                  value={selectedStation?.id || ""}
                  label="Trạm biến áp"
                  onChange={(e) => {
                    const s = substations.find(s => s.id === e.target.value);
                    setSelectedStation(s);
                  }}
                >
                  {substations.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.area})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Bán kính: <strong>{radiusKm} km</strong>
              </Typography>
              <Slider
                value={radiusKm}
                onChange={(_, val) => setRadiusKm(val)}
                min={0.5} max={10} step={0.5}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v} km`}
                color="primary"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSearch}
                disabled={loading || !selectedStation}
                sx={{ height: 50, fontWeight: "bold", fontSize: "1rem" }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "🔍 Quét lưới điện"}
              </Button>
            </Grid>
          </Grid>

          {selectedStation && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Tọa độ trạm:</strong> ({selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}) &nbsp;|&nbsp;
              <strong>Khu vực:</strong> {selectedStation.area} &nbsp;|&nbsp;
              <strong>Bán kính quét:</strong> {radiusKm} km
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>❌ {error}</Alert>}

      {results && (
        <>
          {/* BẢN ĐỒ GIẢ LẬP - TRỰC QUAN HÓA KHÔNG GIAN */}
          <SimulatedMap
            center={selectedStation}
            radiusKm={radiusKm}
            meters={results.all_meters}
            avgUsage={results.summary.avg_usage_kwh}
          />

          {/* TỔNG QUAN KẾT QUẢ */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ textAlign: "center", bgcolor: "#e3f2fd", border: "1px solid #90caf9" }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {results.summary.total_meters}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Đồng hồ trong vùng</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ textAlign: "center", bgcolor: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="success.main">
                    {results.summary.total_usage_kwh}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Tổng tiêu thụ (kWh)</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ textAlign: "center", bgcolor: "#fff3e0", border: "1px solid #ffcc80" }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {results.summary.avg_usage_kwh}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">TB mỗi đồng hồ (kWh)</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card sx={{ textAlign: "center", bgcolor: results.summary.stress_meter_count > 0 ? "#ffebee" : "#e8f5e9", border: `1px solid ${results.summary.stress_meter_count > 0 ? "#ef9a9a" : "#a5d6a7"}` }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color={results.summary.stress_meter_count > 0 ? "error" : "success.main"}>
                    {results.summary.stress_meter_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Điểm quá tải</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* BẢNG CHI TIẾT */}
          {results.all_meters.length === 0 ? (
            <Alert severity="info">Không tìm thấy đồng hồ nào trong bán kính {radiusKm} km quanh trạm biến áp này.</Alert>
          ) : (
            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: "primary.main" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Mã đồng hồ</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Khu vực</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Khoảng cách</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Tọa độ</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Tiêu thụ (kWh)</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }} align="center">Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.all_meters.map((meter, idx) => {
                    const severity = getSeverity(meter.total_daily_usage, results.summary.avg_usage_kwh);
                    return (
                      <TableRow key={idx} sx={{
                        bgcolor: severity.color === "error" ? "#fff5f5" : severity.color === "warning" ? "#fff8e1" : "inherit",
                        "&:hover": { bgcolor: "#f5f5f5" }
                      }}>
                        <TableCell><strong>{meter.meter_id}</strong></TableCell>
                        <TableCell>{meter.neighborhood_id}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${meter.distance_km} km`}
                            size="small"
                            color={meter.distance_km < 1 ? "error" : "default"}
                            variant={meter.distance_km < 1 ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {meter.location?.coordinates?.[1]?.toFixed(4)}, {meter.location?.coordinates?.[0]?.toFixed(4)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color={severity.color === "error" ? "error.main" : "text.primary"}>
                            {meter.total_daily_usage?.toFixed(2) || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={severity.label} color={severity.color} size="small" sx={{ fontWeight: "bold" }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* THÔNG TIN KỸ THUẬT */}
          {/* <Card sx={{ mt: 4, bgcolor: "#fafafa", border: "1px solid #e0e0e0" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="primary.dark">
                🔧 Chi tiết kỹ thuật truy vấn
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", bgcolor: "#263238", color: "#76ff03", p: 2, borderRadius: 1 }}>
                {`// MongoDB Aggregation Pipeline - Geospatial Query
db.usagereadings.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [${selectedStation?.longitude}, ${selectedStation?.latitude}] },
      distanceField: "distance_meters",
      maxDistance: ${radiusKm * 1000},  // ${radiusKm} km → ${radiusKm * 1000} mét
      spherical: true,
      query: { day: ISODate("${new Date().toISOString().split('T')[0]}") }
    }
  },
  { $sort: { distance_meters: 1 } }
])

// Index được sử dụng: 2dsphere trên trường "location"
// Kết quả: ${results.summary.total_meters} đồng hồ trong bán kính ${radiusKm}km`}
              </Typography>
            </CardContent>
          </Card> */}
        </>
      )}
    </Box>
  );
}
