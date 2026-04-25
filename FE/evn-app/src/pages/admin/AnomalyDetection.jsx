import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3004/api/usage/anomalies?threshold=150");
      const data = await res.json();
      if (data.success) {
        setAnomalies(data.data);
      } else {
        setError(data.message || "Lấy dữ liệu bất thường thất bại");
      }
    } catch (err) {
      setError("Lỗi mạng. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const getSeverityColor = (ratio) => {
    if (ratio >= 300) return "error";
    if (ratio >= 200) return "warning";
    return "info";
  };

  // Trực quan hoá biểu đồ thời gian thực cho đồng hồ bất thường nghiêm trọng nhất
  const topAnomaly = anomalies.length > 0 ? anomalies[0] : null;
  const anomalyChartData = topAnomaly && topAnomaly.readings ? topAnomaly.readings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    usage: r.usage
  })) : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚠️ Phát hiện tiêu thụ điện bất thường
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchAnomalies}
          disabled={loading}
        >
          Làm mới dữ liệu
        </Button>
      </Box>

      {/* BIỂU ĐỒ THEO DÕI THỜI GIAN THỰC */}
      {anomalyChartData.length > 0 && (
        <Card sx={{ mb: 4, border: '1px solid #ffcccc' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="error.main" gutterBottom fontWeight="bold">
                Bảng theo dõi bất thường theo thời gian thực (Đồng hồ: {topAnomaly.meter_id})
              </Typography>
              <Chip label="NGUY HIỂM" color="error" />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Biểu đồ đường thời gian thực theo dõi mức tiêu thụ mỗi 15 phút. Hệ thống tự động kích hoạt mức cảnh báo đỏ khi phát hiện dữ liệu vượt ngưỡng đột biến.
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={anomalyChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kWh`, 'Tiêu thụ']} />
                  <ReferenceLine y={2.0} label="Ngưỡng Cảnh Báo" stroke="red" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#ef4444' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Alert severity="error">❌ {error}</Alert>
      ) : anomalies.length === 0 ? (
        <Alert severity="success">Không phát hiện dấu hiệu bất thường nào. Tất cả các khu vực lưới điện đang hoạt động bình thường.</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã đồng hồ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Khu vực</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">TB khu vực</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tổng tiêu thụ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Tỷ lệ bất thường</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anomalies.map((row, index) => {
                const isCritical = row.usage_ratio_percent >= 300;
                return (
                  <TableRow key={index} sx={{ bgcolor: isCritical ? '#fff5f5' : 'inherit' }}>
                    <TableCell component="th" scope="row"><strong>{row.meter_id}</strong></TableCell>
                    <TableCell>{row.neighborhood_id}</TableCell>
                    <TableCell align="right">{row.avg_neighborhood_usage} kWh</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color={isCritical ? "error.main" : "text.primary"}>
                        {row.total_usage} kWh
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold" color={isCritical ? "error.main" : "warning.main"}>
                        {row.usage_ratio_percent}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={isCritical ? "NGUY HIỂM" : "NGHI VẤN"} color={getSeverityColor(row.usage_ratio_percent)} size="small" sx={{ fontWeight: 'bold' }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}