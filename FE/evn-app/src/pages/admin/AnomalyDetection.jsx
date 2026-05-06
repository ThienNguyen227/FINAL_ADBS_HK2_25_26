import React, { useState, useEffect } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, Card, CardContent, Slider
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeIndex, setTimeIndex] = useState(null); 
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeterId, setSelectedMeterId] = useState(null);

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
        // LỌC: Chỉ lấy các đồng hồ có tiêu thụ > 0 (Bất thường về phụ tải, không phải mất điện)
        const filteredData = data.data.filter(item => item.current_usage > 0);
        setAnomalies(filteredData);
        
        if (queryInterval === -1) {
          setTimeIndex(data.latest_interval);
        }
        
        if (filteredData.length > 0 && (!selectedMeterId || !filteredData.find(m => m.meter_id === selectedMeterId))) {
           setSelectedMeterId(filteredData[0].meter_id);
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
  }, [targetDate]);

  useEffect(() => {
    if (timeIndex !== null) {
      fetchAnomalies();
    }
  }, [timeIndex]);

  const activeAnomaly = anomalies.find(m => m.meter_id === selectedMeterId) || anomalies[0];
  const anomalyChartData = activeAnomaly && activeAnomaly.readings ? activeAnomaly.readings.map((r, idx) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    usage: r.usage,
    isCurrent: idx === timeIndex
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
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <Button variant="contained" color="primary" onClick={() => fetchAnomalies(true)} disabled={loading}>
            Làm mới
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4, p: 3, bgcolor: '#fff5f5', border: '1px solid #feb2b2' }}>
        <Typography variant="h6" gutterBottom color="error.dark" fontWeight="bold">
          🕒 Xem lại lịch sử lỗi: {formatTimeLabel(timeIndex)}
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

      {activeAnomaly && (
        <Card sx={{ mb: 4, border: '1px solid #ffcccc', boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="error.main" gutterBottom fontWeight="bold">
                Phân tích biến động: {activeAnomaly.meter_id} (Z-Score: {activeAnomaly.z_score?.toFixed(2)})
              </Typography>
              <Chip label={Math.abs(activeAnomaly.z_score) >= 5 ? "RẤT NGUY HIỂM" : "BẤT THƯỜNG"} color="error" />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Đang theo dõi đồng hồ: <strong>{activeAnomaly.meter_id}</strong>. Tiêu thụ hiện tại: {activeAnomaly.current_usage?.toFixed(2)} kWh.
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={anomalyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kWh`, 'Tiêu thụ']} />
                  <ReferenceLine y={activeAnomaly.mu} label="Trung bình (μ)" stroke="#4caf50" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="usage" stroke="#ef4444" strokeWidth={3} dot={(props) => {
                    const { cx, cy, payload } = props;
                    return payload.isCurrent ? <circle cx={cx} cy={cy} r={8} fill="#ef4444" stroke="white" strokeWidth={2} /> : <circle cx={cx} cy={cy} r={4} fill="#ef4444" />;
                  }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}><CircularProgress size={60} /></Box>
      ) : error ? (
        <Alert severity="error">❌ {error}</Alert>
      ) : anomalies.length === 0 ? (
        <Alert severity="success">Không phát hiện dấu hiệu bất thường về phụ tải.</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mã đồng hồ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Trung bình (μ)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tiêu thụ</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Z-Score</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anomalies.map((row, index) => (
                <TableRow 
                  key={index} 
                  hover
                  onClick={() => setSelectedMeterId(row.meter_id)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: selectedMeterId === row.meter_id ? '#eff6ff' : (Math.abs(row.z_score) >= 5 ? '#fff5f5' : 'inherit'),
                    borderLeft: selectedMeterId === row.meter_id ? '5px solid #3b82f6' : 'none'
                  }}
                >
                  <TableCell><strong>{row.meter_id}</strong></TableCell>
                  <TableCell>{row.mu?.toFixed(2)} kWh</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.current_usage?.toFixed(2)} kWh</TableCell>
                  <TableCell align="center" sx={{ color: 'error.main', fontWeight: 'bold' }}>{row.z_score?.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Button size="small" variant={selectedMeterId === row.meter_id ? "contained" : "outlined"}>
                      Xem biểu đồ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}