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
  Slider
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeIndex, setTimeIndex] = useState(null); 
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // Hàm biến đổi index (0-95) thành chuỗi thời gian (HH:mm)
  const formatTimeLabel = (value) => {
    if (value === null) return "Đang tải...";
    const safeValue = value % 96;
    const totalMinutes = safeValue * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const fetchAnomalies = async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const queryInterval = (isRefresh || timeIndex === null) ? -1 : timeIndex;
      const res = await fetch(`http://localhost:3004/api/usage/anomalies?date=${targetDate}&interval=${queryInterval}`);
      const data = await res.json();
      if (data.success) {
        setAnomalies(data.data);
        if (queryInterval === -1) {
          setTimeIndex(data.latest_interval);
        }
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
  }, [targetDate]); // Load lại khi đổi ngày

  useEffect(() => {
    if (timeIndex !== null) {
      fetchAnomalies();
    }
  }, [timeIndex]);

  const getSeverityColor = (zScore) => {
    const z = Math.abs(zScore);
    if (z >= 5) return "error";    // Bất thường cực nghiêm trọng
    if (z >= 3) return "warning";  // Bất thường
    return "info";
  };

  // Trực quan hoá biểu đồ cho đồng hồ bất thường nhất tại thời điểm đó
  const topAnomaly = anomalies.length > 0 ? anomalies[0] : null;
  const anomalyChartData = topAnomaly && topAnomaly.readings ? topAnomaly.readings.map((r, idx) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    usage: r.usage,
    isCurrent: idx === timeIndex // Đánh dấu điểm đang xem trên biểu đồ
  })) : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚠️ Phát hiện tiêu thụ điện bất thường
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'inherit'
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchAnomalies(true)}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* THANH TRƯỢT THỜI GIAN (TIME TRAVEL SLIDER) */}
      <Card sx={{ mb: 4, p: 3, bgcolor: '#fff5f5', border: '1px solid #feb2b2' }}>
        <Typography variant="h6" gutterBottom color="error.dark" fontWeight="bold">
          🕒 Xem lại lịch sử lỗi: {formatTimeLabel(timeIndex)}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Kéo thanh trượt để truy vấn danh sách các hộ bị hệ thống cảnh báo tại mốc thời gian trong quá khứ.
        </Typography>
        <Slider
          value={timeIndex || 0}
          onChange={(e, newValue) => setTimeIndex(newValue)}
          min={0}
          max={95}
          step={1}
          marks={[
            { value: 0, label: '00:00' },
            { value: 24, label: '06:00' },
            { value: 48, label: '12:00' },
            { value: 72, label: '18:00' },
            { value: 95, label: '23:45' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={formatTimeLabel}
          color="error"
          sx={{ mt: 2 }}
        />
      </Card>

      {/* BIỂU ĐỒ THEO DÕI */}
      {anomalyChartData.length > 0 && (
        <Card sx={{ mb: 4, border: '1px solid #ffcccc' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="error.main" gutterBottom fontWeight="bold">
                Phân tích biến động: {topAnomaly.meter_id} (Z-Score: {topAnomaly.z_score})
              </Typography>
              <Chip label={Math.abs(topAnomaly.z_score) >= 5 ? "RẤT NGUY HIỂM" : "BẤT THƯỜNG"} color="error" />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Dữ liệu tại mốc {formatTimeLabel(timeIndex)}: {topAnomaly.current_usage?.toFixed(2)} kWh. 
              Trung bình lịch sử (μ) = {topAnomaly.mu}.
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={anomalyChartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kWh`, 'Tiêu thụ']} />
                  <ReferenceLine y={topAnomaly.mu} label="Trung bình (μ)" stroke="#4caf50" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.isCurrent) {
                        return <circle cx={cx} cy={cy} r={8} fill="#ef4444" stroke="white" strokeWidth={2} />;
                      }
                      return <circle cx={cx} cy={cy} r={4} fill="#ef4444" />;
                    }}
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
        <Alert severity="success">Tại mốc {formatTimeLabel(timeIndex)}, không phát hiện dấu hiệu bất thường nào.</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã đồng hồ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trung bình (μ)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Độ lệch (σ)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tiêu thụ ({formatTimeLabel(timeIndex)})</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Chỉ số Z-Score</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Đánh giá</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anomalies.map((row, index) => {
                const z = Math.abs(row.z_score);
                const isCritical = z >= 5;
                return (
                  <TableRow key={index} sx={{ bgcolor: isCritical ? '#fff5f5' : 'inherit' }}>
                    <TableCell component="th" scope="row"><strong>{row.meter_id}</strong></TableCell>
                    <TableCell>{row.mu?.toFixed(2)} kWh</TableCell>
                    <TableCell align="right">{row.sigma?.toFixed(3)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color={isCritical ? "error.main" : "text.primary"}>
                        {row.current_usage?.toFixed(3)} kWh
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold" color={isCritical ? "error.main" : "warning.main"}>
                        {row.z_score}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={z >= 5 ? "NGUY HIỂM" : "BẤT THƯỜNG"} 
                        color={getSeverityColor(row.z_score)} 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                      />
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