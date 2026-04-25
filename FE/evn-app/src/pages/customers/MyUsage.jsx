import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button
} from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MyUsage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userMeterId = "METER_1";

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3004/api/usage/history/${userMeterId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      } else {
        setError("Lấy dữ liệu lịch sử thất bại");
      }
    } catch (err) {
      setError("Lỗi mạng. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const todayBucket = history.length > 0 ? history[0] : null;
  const currentCount = todayBucket ? todayBucket.reading_count : 0;
  const isMaxedOut = currentCount >= 96;

  const handleSimulateReading = async () => {
    if (isMaxedOut) return;

    try {
      // 10% cơ hội sinh ra dữ liệu bất thường (từ 5.0 đến 8.0 kWh) để test trang Anomaly
      // 90% cơ hội là tiêu thụ bình thường (từ 0.5 đến 1.5 kWh)
      const isAnomaly = Math.random() < 0.1;
      const randomUsage = isAnomaly
        ? (Math.random() * (8.0 - 5.0) + 5.0).toFixed(2)
        : (Math.random() * (1.5 - 0.5) + 0.5).toFixed(2);

      // Tính toán thời gian giả lập dựa vào số lượng reading hiện tại (currentCount)
      const simulateDate = new Date();
      simulateDate.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00:00 hôm nay
      simulateDate.setMinutes(currentCount * 15); // Mỗi lần nhấn + thêm 15 phút

      await fetch("http://localhost:3004/api/usage/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_id: userMeterId,
          neighborhood_id: "DISTRICT_1",
          usage: randomUsage,
          timestamp: simulateDate.toISOString()
        })
      });
      fetchHistory();
    } catch (err) {
      console.error("Giả lập đo lường thất bại", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format data cho biểu đồ đường
  const chartData = history.length > 0 && history[0].readings ? history[0].readings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    usage: r.usage
  })) : [];

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          📊 Lịch sử tiêu thụ điện của tôi
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSimulateReading}
          disabled={isMaxedOut}
          sx={{ fontWeight: 'bold' }}
        >
          {isMaxedOut ? "✅ Đã đạt tối đa (96/96)" : "⏱️ Giả lập đo lường 15p"}
        </Button>
      </Box>

      {/* BIỂU ĐỒ ĐƯỜNG LỊCH SỬ TIÊU THỤ (Historical Line Chart) */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 4, elevation: 3 }}>
          <CardContent>
            <Typography variant="h6" color="primary.dark" gutterBottom>
              Biểu đồ tiêu thụ ngày hôm nay
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Biểu đồ trực quan hóa mảng `readings` (mỗi 15 phút) được trích xuất từ 1 Document (Bucket Pattern).
            </Typography>
            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kWh`, 'Tiêu thụ']} />
                  <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}



      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">❌ {error}</Alert>
      ) : history.length === 0 ? (
        <Alert severity="info">Không tìm thấy lịch sử tiêu thụ cho đồng hồ của bạn.</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tổng tiêu thụ (kWh)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Số lần đo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Tối ưu hóa</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((doc, idx) => (
                <TableRow key={idx}>
                  <TableCell component="th" scope="row">
                    <strong>{new Date(doc.day).toLocaleDateString()}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="secondary.main">
                      {doc.total_daily_usage.toFixed(2)} kWh
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {doc.reading_count} / 96 (Chu kỳ)
                  </TableCell>
                  <TableCell align="center">
                    <Chip size="small" color="success" label="1 Document (Bucket)" />
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