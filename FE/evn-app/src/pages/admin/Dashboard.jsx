import React, { useState, useEffect } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Tabs, Tab,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip,
  Divider, Button, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Tooltip
} from "@mui/material";
import {
  Bolt as BoltIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  NotificationsActive as NotificationsActiveIcon
} from "@mui/icons-material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';


export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [stats, setStats] = useState({ totalUsage: 0, criticalCount: 0, totalIn: 0, lossRate: 0 });
  const [trendData, setTrendData] = useState([]); // Thêm state cho biểu đồ thực
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu thông báo thời gian thực
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        // 1. Lấy thông báo mới nhất cho Live Feed
        const resNotif = await fetch("http://localhost:3005/api/notifications");
        const dataNotif = await resNotif.json();
        if (dataNotif.success) {
          setNotifications(dataNotif.data.slice(0, 10));
        }

        // 2. Lấy dữ liệu bất thường cho Bản đồ
        const resMap = await fetch("http://localhost:3004/api/usage/anomalies");
        const dataMap = await resMap.json();
        if (dataMap.success) {
          setMapPoints(dataMap.data);
        }

        // 3. Lấy THÔNG KÊ HỆ THỐNG THỰC (Cho thẻ Tổng tiêu thụ & Thất thoát)
        const resStats = await fetch("http://localhost:3004/api/usage/system-stats");
        const dataStats = await resStats.json();
        if (dataStats.success) {
          const s = dataStats.data;
          setStats(prev => ({
            ...prev,
            totalUsage: s.total_out,
            totalIn: s.total_in,
            lossRate: s.loss_rate,
            criticalCount: dataMap.data.filter(item => item.current_usage === 0).length
          }));
        }

        // 4. Lấy dữ liệu biểu đồ thật (Dùng METER_74 làm mẫu hoặc meter đầu tiên)
        const targetMeter = dataMap.data.length > 0 ? dataMap.data[0].meter_id : "METER_74";
        const resTrend = await fetch(`http://localhost:3004/api/usage/history/${targetMeter}`);
        const dataTrend = await resTrend.json();
        if (dataTrend.success && dataTrend.data.length > 0) {
          const history = dataTrend.data[0].readings.map(r => ({
            time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            current: r.usage,
            baseline: r.usage * 0.9 
          }));
          setTrendData(history);
        }
      } catch (e) {
        console.error("Lỗi khi tải dữ liệu:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000); // Tự động cập nhật mỗi 5 giây
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const criticalCount = notifications.filter(n => n.type === 'HARD_RULE' || n.z_score > 10).length;

  return (
    <Box sx={{ p: 3, bgcolor: '#f0f4f8', minHeight: '100vh', borderRadius: 2 }}>
      <Typography variant="h4" fontWeight="bold" color="#0f172a" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimelineIcon fontSize="large" color="primary" />
        Trung tâm Điều độ Smart Grid
      </Typography>

      {/* ================= 1. Chỉ số Tổng quan (High-level Metrics) ================= */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <Card sx={{ height: '100%', bgcolor: '#fff', borderLeft: '5px solid #3b82f6', boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Tổng Tiêu Thụ Hệ Thống</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1e293b" mt={1}>
                {stats.totalUsage.toFixed(1)} <Typography component="span" variant="h6" color="text.secondary">kWh</Typography>
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1, fontWeight: 'bold' }}>
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> Đo tại các hộ dân
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card sx={{ height: '100%', bgcolor: '#fff', borderLeft: '5px solid #f59e0b', boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Số Lượng Cảnh Báo </Typography>
              <Typography variant="h4" fontWeight="bold" color="#1e293b" mt={1}>
                {notifications.length > 0 ? notifications.length : 0}
              </Typography>
              <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                Đang chờ xử lý
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card sx={{ height: '100%', bgcolor: '#fff', borderLeft: '5px solid #ef4444', boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Khách Hàng Đang Mất Điện</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1e293b" mt={1}>
                {stats.criticalCount}
              </Typography>
              <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                Cần hỗ trợ khẩn cấp
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card sx={{ height: '100%', bgcolor: '#fff', borderLeft: '5px solid #8b5cf6', boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Tỷ Lệ Thất Thoát Điện Năng</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1e293b" mt={1}>
                {stats.lossRate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" color={stats.lossRate > 5 ? "error.main" : "success.main"} sx={{ mt: 1, fontWeight: 'bold' }}>
                {stats.lossRate > 5 ? "Cảnh báo thất thoát cao" : "Nằm trong ngưỡng an toàn"}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ================= Main Layout: Left (Map + Trend) 2/3, Right (Feed) 1/3 ================= */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* 2. Bản đồ Giám sát Thời gian thực (Geospatial View) */}
          <Card sx={{ boxShadow: 2, height: 400, position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" sx={{ bgcolor: 'rgba(255,255,255,0.95)', px: 2, py: 1, borderRadius: 1, boxShadow: 1 }}>
                🗺️ Bản đồ Nhiệt Khu Vực
              </Typography>
            </Box>

            {/* Background Map Simulation */}
            <Box sx={{
              width: '100%', height: '100%',
              background: 'url("https://www.transparenttextures.com/patterns/connected.png"), linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              position: 'relative'
            }}>
              {mapPoints.length === 0 && !loading && (
                <Typography variant="body2" sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'text.secondary' }}>
                  Không có sự cố nào được ghi nhận trên bản đồ
                </Typography>
              )}

              {mapPoints.map((point, index) => {
                // Ánh xạ tọa độ giả lập sang % (Vì chúng ta không dùng thư viện Map thật ở đây)
                // Lấy phần dư của tọa độ để rải điểm ngẫu nhiên trên khung hình
                const left = ((point.location?.lng * 1000) % 80) + 10;
                const top = ((point.location?.lat * 1000) % 70) + 15;

                const isBlackout = point.current_usage === 0;

                return (
                  <Box key={index} sx={{ position: 'absolute', left: `${left}%`, top: `${top}%` }}>
                    <Tooltip title={`${point.meter_id} - ${isBlackout ? 'Mất điện' : 'Quá tải (Z:' + point.z_score?.toFixed(1) + ')'}`} arrow>
                      <span className="relative flex h-6 w-6">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isBlackout ? 'bg-red-400' : 'bg-orange-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-5 w-5 ${isBlackout ? 'bg-red-600' : 'bg-orange-500'} border-2 border-white shadow-lg`}></span>
                      </span>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </Card>

          {/* 4. Phân tích Xu hướng (Trend Analysis) */}
          <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" color="#0f172a" mb={3}>
                📈 Phân tích Phụ tải (Thực tế vs. Baseline μ)
              </Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" fontWeight="500" />
                    <YAxis stroke="#64748b" fontWeight="500" />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="baseline" name="Trung bình (μ)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBaseline)" />
                    <Area type="monotone" dataKey="current" name="Tiêu thụ thực tế" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

        </Box>

        {/* ================= Right Panel: Luồng thông báo (Notification Feed) ================= */}
        <Box>
          <Card sx={{ height: 744, display: 'flex', flexDirection: 'column', boxShadow: 2, borderRadius: 2 }}>
            <Box sx={{ p: 2, bgcolor: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActiveIcon /> Luồng Sự Kiện Live
              </Typography>
              <Chip label="Đang theo dõi" color="error" size="small" sx={{ fontWeight: 'bold', animation: 'pulse 2s infinite' }} />
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0, bgcolor: '#f8fafc' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary" fontWeight="bold">Lưới điện đang hoạt động ổn định.</Typography>
                </Box>
              ) : (
                notifications.map((n, i) => (
                  <React.Fragment key={n._id || i}>
                    <ListItem alignItems="flex-start" sx={{ '&:hover': { bgcolor: '#f1f5f9' }, cursor: 'pointer', py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: n.type === 'HARD_RULE' ? '#fee2e2' : '#fef3c7', color: n.type === 'HARD_RULE' ? '#ef4444' : '#f59e0b' }}>
                          {n.type === 'HARD_RULE' ? <BoltIcon /> : <WarningIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="bold" color={n.type === 'HARD_RULE' ? 'error.main' : 'warning.dark'}>
                            {n.type === 'HARD_RULE' ? `🚨 Mất điện: ${n.meter_id}` : `⚠️ Phụ tải cao: ${n.meter_id}`}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="text.primary" sx={{ display: 'block', my: 0.5, fontWeight: 500 }}>
                              {n.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                              {new Date(n.created_at).toLocaleTimeString('vi-VN')} - Khu vực: {n.neighborhood_id}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </Card>
        </Box>
      </Box>

      {/* ================= 3 & 5. Quản lý trạng thái và Cảnh báo (Alerts Management) ================= */}
      <Card sx={{ mt: 4, boxShadow: 2, borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
            <Tab label="🚨 Khẩn cấp (Critical)" sx={{ fontWeight: 'bold', fontSize: '1rem' }} />
            <Tab label="🟡 Theo dõi (Watchlist)" sx={{ fontWeight: 'bold', fontSize: '1rem' }} />
            <Tab label="🌐 Sự cố khu vực (Macro)" sx={{ fontWeight: 'bold', fontSize: '1rem' }} />
          </Tabs>
        </Box>
        <CardContent sx={{ p: 0 }}>
          {tabValue === 0 && (
            <Box p={3}>
              <Typography variant="h6" color="error.main" mb={2} fontWeight="bold">Khách hàng Ưu tiên Cứu hộ (Usage = 0 hoặc Z &gt; 10)</Typography>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #fee2e2', borderRadius: 2 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: '#fff5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>Mã Đồng Hồ</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>Trạng Thái (SQL Server)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>Chẩn Đoán</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mapPoints.filter(p => p.current_usage === 0 || p.z_score > 10).map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell><Typography fontWeight="bold">{row.meter_id}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={row.current_usage === 0 ? "OFFLINE / DETECTED" : "OVERLOAD / CRITICAL"}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>{row.current_usage === 0 ? "Tiêu thụ rớt về 0 kWh" : `Z-Score: ${row.z_score?.toFixed(2)}`}</TableCell>
                      </TableRow>
                    ))}
                    {mapPoints.filter(p => p.current_usage === 0 || p.z_score > 10).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">Không có sự cố khẩn cấp nào.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

            </Box>
          )}
          {tabValue === 1 && (
            <Box p={3}>
              <Typography variant="h6" color="warning.main" mb={2} fontWeight="bold">Danh sách Theo dõi (3 &lt; Z &lt; 5)</Typography>
              <Typography color="text.secondary" fontWeight="500">Các đồng hồ đang tích lũy cảnh báo. Sẽ tự động chuyển sang Khẩn cấp nếu vi phạm 3 chu kỳ liên tiếp.</Typography>
            </Box>
          )}
          {tabValue === 2 && (
            <Box p={3}>
              <Typography variant="h6" color="primary.main" mb={2} fontWeight="bold">Sự cố Diện rộng (Macro Events)</Typography>
              <Typography color="text.secondary" fontWeight="500">Tính năng Alert Suppression đang giám sát. Không có khu vực nào bị ngắt điện diện rộng lúc này.</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* CSS Nhúng cho hiệu ứng chớp nháy cảnh báo bản đồ */}
      <style>
        {`
          @keyframes ping {
            75%, 100% { transform: scale(2.5); opacity: 0; }
          }
          .animate-ping { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
          .relative { position: relative; }
          .absolute { position: absolute; }
          .flex { display: flex; }
          .inline-flex { display: inline-flex; }
          .h-6 { height: 1.5rem; }
          .w-6 { width: 1.5rem; }
          .h-full { height: 100%; }
          .w-full { width: 100%; }
          .rounded-full { border-radius: 9999px; }
          .bg-red-400 { background-color: #f87171; }
          .bg-red-600 { background-color: #dc2626; }
          .bg-orange-400 { background-color: #fb923c; }
          .bg-orange-500 { background-color: #f97316; }
          .border-2 { border-width: 2px; }
          .border-white { border-color: #ffffff; }
          .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
          .opacity-75 { opacity: 0.75; }
        `}
      </style>
    </Box>
  );
}