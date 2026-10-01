import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeModeContext';
import { navConfig } from '../routes/navConfig';

const DRAWER_WIDTH = 264;

const ICONS = {
  Dashboard: DashboardIcon,
  People: PeopleIcon,
  LocalShipping: LocalShippingIcon,
  Business: BusinessIcon,
  Badge: BadgeIcon,
  FactCheck: FactCheckIcon,
  LocationOn: LocationOnIcon,
  WorkHistory: WorkHistoryIcon,
  GpsFixed: GpsFixedIcon,
  Receipt: ReceiptIcon,
};

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DRIVER: 'Driver',
};

export default function DashboardLayout() {
  const { user, logout, hasPermission } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const visibleNavItems = navConfig.filter((item) => !item.permission || hasPermission(item.permission));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const brand = (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        display: 'flex',
        alignItems: 'center',
        minHeight: { xs: 56, sm: 64 }, // match AppBar Toolbar height so tops align
        color: 'common.white',
        background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 55%, #1E3A8A 100%)',
      }}
    >
      <Box sx={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.25)',
            flexShrink: 0,
          }}
        >
          <LocalShippingRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.15 }} noWrap>
            Anuradha Transport
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.75)' }}
            noWrap
          >
            Transport Management System
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {brand}
      <Divider />
      <Typography
        variant="overline"
        sx={{ px: 3, pt: 2, pb: 0.5, color: 'text.secondary', letterSpacing: 1, fontWeight: 700 }}
      >
        Menu
      </Typography>
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {visibleNavItems.map((item) => {
          const Icon = ICONS[item.icon] || DashboardIcon;
          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              sx={{
                py: 1.05,
                mb: 0.5,
                borderRadius: 2,
                color: 'text.secondary',
                transition: 'all .15s ease',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                '&.active': {
                  color: 'common.white',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 8px 18px -8px rgba(37,99,235,0.7)',
                  '& .MuiListItemIcon-root': { color: 'common.white' },
                  '&:hover': { background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      {/* Sidebar footer */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            p: 1.25,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
            {user?.firstName?.[0] || <PersonIcon fontSize="small" />}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {ROLE_LABEL[user?.role] || user?.role}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} aria-label="Logout" sx={{ color: 'text.secondary' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.9)'),
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          {!isDesktop && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LocalShippingRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }} noWrap>
                Anuradha
              </Typography>
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            onClick={toggleMode}
            aria-label="Toggle dark mode"
            sx={{ color: 'text.secondary', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
          >
            {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              pl: 0.75,
              pr: { xs: 0.75, sm: 1.25 },
              py: 0.5,
              ml: 1,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all .15s ease',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
              {user?.firstName?.[0] || <PersonIcon fontSize="small" />}
            </Avatar>
            {isDesktop && (
              <Box sx={{ textAlign: 'left', lineHeight: 1.2, maxWidth: 160, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }} noWrap>
                  {ROLE_LABEL[user?.role] || user?.role}
                </Typography>
              </Box>
            )}
            {isDesktop && <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                elevation: 3,
                sx: { mt: 1.25, minWidth: 240, borderRadius: 2, overflow: 'visible' },
              },
            }}
          >
            <Box sx={{ px: 2, pt: 1.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 15, fontWeight: 700 }}>
                {user?.firstName?.[0] || <PersonIcon fontSize="small" />}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ px: 2, pb: 1 }}>
              <Chip size="small" label={ROLE_LABEL[user?.role] || user?.role} color="primary" variant="outlined" />
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 }, width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` }, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
