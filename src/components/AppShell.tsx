"use client";

import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FilerLogo } from "@/components/FilerLogo";

const drawerWidth = 248;

const navItems = [
  { href: "/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
  { href: "/files", icon: <InsertDriveFileIcon />, label: "Files" },
  { href: "/folders", icon: <FolderIcon />, label: "Folders" },
  { href: "/settings", icon: <SettingsIcon />, label: "Settings" },
];

function Navigation() {
  const pathname = usePathname();

  return (
    <List sx={{ px: 1.5 }}>
      {navItems.map((item) => (
        <ListItemButton
          component={Link}
          href={item.href}
          key={item.href}
          selected={pathname === item.href}
          sx={{ borderRadius: 1, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Toolbar sx={{ px: 3 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <FilerLogo size={34} />
          <Typography component="div" sx={{ fontWeight: 700 }} variant="h6">
            Filer
          </Typography>
        </Stack>
      </Toolbar>
      <Navigation />
      <Box sx={{ flex: 1 }} />
      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 2 }}>
        <Avatar
          alt={session?.user?.name ?? "User"}
          src={session?.user?.image ?? undefined}
          sx={{ height: 36, width: 36 }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap variant="body2">
            {session?.user?.name ?? "Google user"}
          </Typography>
          <Typography color="text.secondary" noWrap variant="caption">
            {session?.user?.email}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <Tooltip title="Open navigation">
              <IconButton
                aria-label="Open navigation"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}
          <Typography component="div" sx={{ flex: 1 }} variant="h6">
            Google Drive Manager
          </Typography>
          <Tooltip title="Sign out">
            <IconButton
              aria-label="Sign out"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}
      >
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          variant="temporary"
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              borderRight: "1px solid",
              borderColor: "divider",
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          variant="permanent"
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          ml: { md: `${drawerWidth}px` },
          pt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
