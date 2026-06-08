"use client";

import {
  Avatar,
  Box,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

type Activity = {
  id: string;
  action: string;
  fileName: string | null;
  createdAt: string;
};

type SettingsPanelProps = {
  activity: Activity[];
  appFolderMode: boolean;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SettingsPanel({
  activity,
  appFolderMode,
  user,
}: SettingsPanelProps) {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">
          Settings
        </Typography>

        <Paper
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", p: 3 }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" } }}
          >
            <Avatar
              alt={user.name ?? "User"}
              src={user.image ?? undefined}
              sx={{ height: 56, width: 56 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6">{user.name ?? "Google user"}</Typography>
              <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {user.email}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Stack spacing={1.5}>
            <FormControlLabel
              control={<Switch checked={appFolderMode} disabled />}
              label="App-specific folder mode"
            />
            <Chip
              color={appFolderMode ? "primary" : "default"}
              label={appFolderMode ? "Preferred for SaaS" : "Full Drive access"}
              sx={{ alignSelf: "flex-start" }}
            />
          </Stack>
        </Paper>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>File</TableCell>
                <TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activity.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.action.replaceAll("_", " ")}</TableCell>
                  <TableCell>{item.fileName ?? "-"}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!activity.length && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No activity yet.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}
