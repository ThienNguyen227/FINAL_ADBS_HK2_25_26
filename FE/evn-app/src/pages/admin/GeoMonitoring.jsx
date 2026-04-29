import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Paper, Button, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Chip, Select, MenuItem, FormControl, InputLabel,
  Slider, Grid
} from "@mui/material";

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

      {/* KẾT QUẢ */}
      {results && (
        <>
          {/* SUMMARY CARDS */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
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
