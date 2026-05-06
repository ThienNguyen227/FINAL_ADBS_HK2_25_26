import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  IconButton, Badge, Popover, Box, Typography, Button, 
  Tabs, Tab, List, ListItem, ListItemAvatar, Avatar, 
  ListItemText, Chip, Divider, CircularProgress, Tooltip 
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import BoltIcon from "@mui/icons-material/Bolt";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";

import "../styles/Header.css";
import evnLogo from "../assets/EVN-LOGO.png";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { user, logOut, loading } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [fetching, setFetching] = useState(false);

  const isOperator = user?.user_name?.toLowerCase() === 'operator';

  useEffect(() => {
    if (isOperator) {
      fetchNotifications();
      const intervalId = setInterval(fetchNotifications, 10000); // Check every 10s
      return () => clearInterval(intervalId);
    }
  }, [isOperator]);

  const fetchNotifications = async () => {
    try {
      setFetching(true);
      const res = await fetch("http://localhost:3005/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch notifications");
    } finally {
      setFetching(false);
    }
  };

  const handleOpenNotifications = (event) => setAnchorEl(event.currentTarget);
  const handleCloseNotifications = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  const handleMarkAllRead = async () => {
    try {
      await fetch("http://localhost:3005/api/notifications/mark-read", { method: "POST" });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async (meter_id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngắt điện từ xa cho đồng hồ ${meter_id}?`)) return;
    try {
      const res = await fetch("http://localhost:3005/api/notifications/remote-disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meter_id })
      });
      const data = await res.json();
      if (data.success) alert(data.message);
    } catch (e) {
      alert("Lỗi khi gửi lệnh ngắt điện");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await logOut();
      if (!res?.error) {
        sessionStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch {
      alert("Đăng xuất thất bại");
    }
  };

  const filteredNotifications = notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="admin-header">
      <div className="header-left">
        <img src={evnLogo} alt="logo" />
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {isOperator && (
          <Box>
            <Tooltip title="Thông báo">
              <IconButton onClick={handleOpenNotifications} color="inherit">
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ fontSize: 28, color: "#1e293b" }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={handleCloseNotifications}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: { width: 400, maxHeight: 550, borderRadius: 3, mt: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Thông báo</Typography>
                <Button 
                  size="small" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleMarkAllRead}
                  sx={{ textTransform: 'none', color: '#64748b' }}
                >
                  Đánh dấu đã đọc
                </Button>
              </Box>

              {/* Tabs đã bị gỡ bỏ theo yêu cầu */}

              <List sx={{ p: 0 }}>
                {fetching && notifications.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>
                ) : filteredNotifications.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Không có thông báo nào trong mục này</Typography>
                  </Box>
                ) : (
                  filteredNotifications.map((n) => (
                    <React.Fragment key={n._id}>
                      <ListItem 
                        alignItems="flex-start"
                        sx={{ 
                          bgcolor: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                          transition: '0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: n.type === 'HARD_RULE' ? '#fee2e2' : '#fef3c7', color: n.type === 'HARD_RULE' ? '#ef4444' : '#f59e0b' }}>
                            {n.type === 'HARD_RULE' ? <BoltIcon /> : <ReportProblemIcon />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {n.type === 'HARD_RULE' ? 'Sự cố mất điện' : 'Cảnh báo phụ tải'}
                              </Typography>
                              <Chip 
                                label={n.type === 'HARD_RULE' ? 'Khẩn cấp' : 'Bất thường'} 
                                size="small" 
                                color={n.type === 'HARD_RULE' ? 'error' : 'warning'}
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.85rem' }}>
                                {n.message}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {new Date(n.created_at).toLocaleString('vi-VN')}
                              </Typography>
                              {n.z_score > 10 && (
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  startIcon={<ElectricBoltIcon />}
                                  onClick={() => handleDisconnect(n.meter_id)}
                                  sx={{ mt: 1, textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
                                >
                                  Ngắt điện từ xa
                                </Button>
                              )}
                            </Box>
                          }
                        />
                        {!n.read && <Box sx={{ width: 8, height: 8, bgcolor: '#3b82f6', borderRadius: '50%', mt: 2 }} />}
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                )}
              </List>
              
            </Popover>
          </Box>
        )}

        <div
          onClick={() => navigate("/profile")}
          style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px",
            borderRadius: "999px", cursor: "pointer", transition: "0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: "#3b82f6", fontSize: '0.9rem', fontWeight: 700 }}>
            {user?.user_name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <span style={{ fontWeight: 600, color: '#1e293b' }}>{user?.user_name}</span>
        </div>

        <button 
          disabled={loading} onClick={handleLogout}
          className="logout-btn"
        >
          {loading ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </header>
  );
}