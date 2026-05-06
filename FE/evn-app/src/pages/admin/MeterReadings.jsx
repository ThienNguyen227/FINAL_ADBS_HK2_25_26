import React, { useState, useEffect } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Button,
  Slider, Card
} from "@mui/material";

export default function MeterReadings() {
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeIndex, setTimeIndex] = useState(null); 
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const formatTimeLabel = (value) => {
    if (value === null) return "Đang tải...";
    // Đảm bảo index luôn nằm trong khoảng 0-95 để hiển thị đúng 24h
    const safeValue = value % 96; 
    const totalMinutes = safeValue * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const fetchMeters = async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const queryInterval = (isRefresh || timeIndex === null) ? -1 : timeIndex;
      const res = await fetch(`http://localhost:3004/api/usage/all-status?date=${targetDate}&interval=${queryInterval}`);
      const data = await res.json();
      if (data.success) {
        setMeters(data.data);
        if (queryInterval === -1) {
          setTimeIndex(data.latest_interval);
        }
      } else {
        setError(data.message || "Lấy dữ liệu thất bại");
      }
    } catch (err) {
      setError("Lỗi mạng. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, [targetDate]); // Tự động load khi đổi ngày

  useEffect(() => {
    if (timeIndex !== null) {
      fetchMeters();
    }
  }, [timeIndex]);

  const getSeverityColor = (row) => {
    if (row.current_usage === 0) return "error";
    const z = Math.abs(row.z_score);
    if (z >= 5) return "error";
    if (z >= 3) return "warning";
    return "success";
  };

  const getStatusLabel = (row) => {
    if (row.current_usage === 0) return "MẤT ĐIỆN";
    const z = Math.abs(row.z_score);
    if (z >= 5) return "RẤT NGUY HIỂM";
    if (z >= 3) return "BẤT THƯỜNG";
    return "BÌNH THƯỜNG";
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          📈 Giám sát thông số toàn bộ đồng hồ
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
          <Button variant="contained" color="primary" onClick={() => fetchMeters(true)} disabled={loading}>
            Làm mới
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4, p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" gutterBottom color="primary.dark" fontWeight="bold">
          🕒Thời gian: {formatTimeLabel(timeIndex)}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Kéo thanh trượt để xem trạng thái và chỉ số Z-Score của toàn bộ lưới điện tại mốc thời gian cụ thể.
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
          sx={{ mt: 2 }}
        />
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Alert severity="error">❌ {error}</Alert>
      ) : meters.length === 0 ? (
        <Alert severity="info">Chưa có dữ liệu đồng hồ nào trong hệ thống tại mốc {formatTimeLabel(timeIndex)}.</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã đồng hồ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Khu vực</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tiêu thụ ({formatTimeLabel(timeIndex)})</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Trung bình (μ)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Độ lệch (σ)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Z-Score</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meters.map((row, index) => {
                const isOffline = row.current_usage === 0;
                const z = Math.abs(row.z_score);
                const isCritical = isOffline || z >= 5;
                const isWarning = !isOffline && z >= 3 && z < 5;

                let rowBgColor = 'inherit';
                if (isCritical) rowBgColor = '#fff5f5';
                else if (isWarning) rowBgColor = '#fffdf5';

                return (
                  <TableRow key={index} sx={{ bgcolor: rowBgColor, '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row"><strong>{row.meter_id}</strong></TableCell>
                    <TableCell>{row.neighborhood_id}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color={isCritical ? "error.main" : "text.primary"}>
                        {row.current_usage !== undefined ? row.current_usage.toFixed(2) : '--'} kWh
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{row.mu ? row.mu.toFixed(2) : '0.00'} kWh</TableCell>
                    <TableCell align="right">{row.sigma ? row.sigma.toFixed(3) : '0.00'}</TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold" color={getSeverityColor(row) + ".main"}>
                        {isOffline ? "--" : (row.z_score !== null && row.current_usage !== undefined ? row.z_score.toFixed(2) : '0.00')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(row)}
                        color={getSeverityColor(row)}
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