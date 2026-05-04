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
import { useAuth } from "../../hooks/useAuth";

export default function MyUsage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [neighborhoodId, setNeighborhoodId] = useState(null);
  const [unitPrice, setUnitPrice] = useState(1500);
  const [simulationDate, setSimulationDate] = useState(new Date().toISOString().split('T')[0]); // Mặc định là hôm nay
  const [simulationMode, setSimulationMode] = useState(1); // 1: Bình thường, 2: Lỗi cá nhân, 3: Lỗi khu vực
  const [hasContract, setHasContract] = useState(false);
  const [checkingContract, setCheckingContract] = useState(true);



  // Sinh meter_id từ user_id thực tế đang đăng nhập
  const userMeterId = user ? `METER_${user.user_id}` : null;

  // Lấy thông tin customer (customer_address) từ SQL Server qua customer-service
  useEffect(() => {
    if (!user) return;
    const token = sessionStorage.getItem("token");
    fetch(`http://localhost:3001/customer/get-more-information?user_id=${user.user_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.customer) {
          if (data.customer.customer_address) {
            setNeighborhoodId(data.customer.customer_address);
          } else {
            setNeighborhoodId("KHU_VUC_MAC_DINH");
          }
          // Lấy giá tiền từ hợp đồng trong SQL
          if (data.customer.contract_rate) {
            setUnitPrice(data.customer.contract_rate);
          }
        } else {
          setNeighborhoodId("KHU_VUC_MAC_DINH");
        }
      })
      .catch(() => setNeighborhoodId("KHU_VUC_MAC_DINH"));
  }, [user]);

  const fetchHistory = async () => {
    if (!userMeterId) return;
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

  useEffect(() => {
    if (!user) return;

    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:3001/customer/check-contract?user_id=${user.user_id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setHasContract(data.hasContract);
      })
      .catch(() => {
        setHasContract(false);
      })
      .finally(() => {
        setCheckingContract(false);
      });

  }, [user]);

  // Tìm dữ liệu của ngày đang chọn trong danh sách lịch sử (So sánh theo local date)
  const selectedDayBucket = history.find(h => {
    const d = new Date(h.day);
    const bucketDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return bucketDate === simulationDate;
  });

  const currentCount = selectedDayBucket ? selectedDayBucket.reading_count : 0;
  const isMaxedOut = currentCount >= 96;

  const handleSimulateReading = async () => {
    if (!userMeterId || !neighborhoodId || isMaxedOut) return;

    // Tính toán thời gian giả lập dựa trên simulationDate
    // Nếu là ngày hôm nay, lấy giờ hiện tại. Nếu là ngày khác, giả lập giờ ngẫu nhiên.
    // Logic mới: Bắt đầu từ 00:00 và tăng 15 phút cho mỗi lần bấm (dựa trên currentCount)
    const targetTimestamp = new Date(simulationDate);
    targetTimestamp.setHours(0, 0, 0, 0); // Reset về 00:00

    // Cộng thêm (currentCount * 15) phút
    const totalMinutesToAdd = currentCount * 15;
    const hoursToAdd = Math.floor(totalMinutesToAdd / 60);
    const minutesToAdd = totalMinutesToAdd % 60;

    targetTimestamp.setHours(hoursToAdd, minutesToAdd);



    try {
      // Xác định usage ban đầu cho đồng hồ gốc (Sẽ được xử lý lại tại Backend dựa trên Mode)
      // Mặc định cứ gửi giá trị bình thường, BE sẽ quyết định ghi đè nếu mode = 2 hoặc 3
      const baseUsage = (Math.random() * (1.5 - 0.5) + 0.5).toFixed(2);

      await fetch("http://localhost:3004/api/usage/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_id: userMeterId,
          neighborhood_id: neighborhoodId,
          usage: baseUsage,
          timestamp: targetTimestamp.toISOString(), // Sử dụng ngày người dùng đã chọn
          longitude: 106.7009 + (Math.random() - 0.5) * 0.03,
          latitude: 10.7769 + (Math.random() - 0.5) * 0.03,
          simulation_mode: simulationMode // Gửi chế độ giả lập xuống Backend
        })
      });
      fetchHistory();
    } catch (err) {
      console.error("Giả lập đo lường thất bại", err);
    }
  };

  useEffect(() => {
    if (userMeterId) {
      fetchHistory();
    }
  }, [userMeterId]);

  // Format data cho biểu đồ dựa trên ngày đang chọn (selectedDayBucket)
  const chartData = selectedDayBucket && selectedDayBucket.readings ? selectedDayBucket.readings.map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    usage: r.usage
  })) : [];

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography mt={2}>Đang tải thông tin người dùng...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          📊 Lịch sử tiêu thụ điện của tôi
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input
            type="date"
            value={simulationDate}
            onChange={(e) => setSimulationDate(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'inherit'
            }}
          />
          <select
            value={simulationMode}
            onChange={(e) => setSimulationMode(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={1}>🟢 Chế độ 1: Bình thường</option>
            <option value={2}>🟠 Chế độ 2: Lỗi vi mô (Cá nhân - Dưới 5 hộ)</option>
            <option value={3}>🔴 Chế độ 3: Lỗi vĩ mô (Cúp điện trạm - Trên 5 hộ)</option>
            <option value={4}>⚫ Chế độ 4: Mất điện cá nhân (Tiêu thụ = 0)</option>
            <option value={5}>🚫 Chế độ 5: Mất điện toàn khu (Tất cả = 0)</option>
          </select>
          {/* <Button
            variant="contained"
            color="secondary"
            onClick={handleSimulateReading}
            disabled={!neighborhoodId || isMaxedOut}
            sx={{ fontWeight: 'bold' }}
          >
            {isMaxedOut ? "✅ Đã xong 24h" : "Giả lập 15p"}
          </Button> */}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSimulateReading}
            disabled={
              !neighborhoodId ||
              isMaxedOut ||
              !hasContract ||
              checkingContract
            }
            sx={{ fontWeight: "bold" }}
          >
            {checkingContract
              ? "Đang kiểm tra..."
              : !hasContract
              ? "Chưa có hợp đồng"
              : isMaxedOut
              ? "✅ Đã xong 24h"
              : "Giả lập 15p"}
          </Button>
        </Box>

      </Box>

      {/* Thông tin đồng hồ hiện tại */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Mã đồng hồ:</strong> {userMeterId} &nbsp;|&nbsp;
        <strong>Khu vực:</strong> {neighborhoodId || "Đang tải..."} &nbsp;|&nbsp;
        <strong>Tài khoản:</strong> {user.user_name} (ID: {user.user_id})
      </Alert>

      {/* BIỂU ĐỒ ĐƯỜNG LỊCH SỬ TIÊU THỤ (Historical Line Chart) */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 4, elevation: 3 }}>
          <CardContent>
            <Typography variant="h6" color="primary.dark" gutterBottom>
              Biểu đồ tiêu thụ theo ngày
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
        <Alert severity="info">Không tìm thấy lịch sử tiêu thụ cho đồng hồ của bạn. Hãy bấm nút "Giả lập đo lường 15p" để bắt đầu.</Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ngày</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Tổng tiêu thụ (kWh)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Số lần đo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Ước tính chi phí</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((doc, idx) => {
                const estimatedCost = doc.total_daily_usage * unitPrice;

                return (
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
                    <TableCell align="right">
                      <Typography
                        fontWeight="bold"
                        color={estimatedCost > 50000 ? "error.main" : "primary.main"}
                      >
                        {estimatedCost.toLocaleString()} VNĐ
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Giá: {unitPrice}đ/kWh)
                      </Typography>
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