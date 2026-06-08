"use client";

import GoogleIcon from "@mui/icons-material/Google";
import SecurityIcon from "@mui/icons-material/Security";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { FilerLogo } from "@/components/FilerLogo";

export function LoginPanel() {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",
        py: { xs: 4, sm: 6 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 4.5 },
          }}
        >
          <Stack spacing={3.5}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <FilerLogo size={56} />
              <Box>
                <Typography component="h1" sx={{ fontWeight: 750 }} variant="h4">
                  Filer
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Google Drive file manager
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.25}>
              <Typography sx={{ fontWeight: 650 }} variant="h6">
                Access your files securely.
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Upload, browse, organize, and share files stored directly in your
                own Google Drive.
              </Typography>
            </Stack>

            <Button
              component="a"
              fullWidth
              href="/api/auth/connect/google?callbackUrl=%2Fdashboard"
              size="large"
              startIcon={<GoogleIcon />}
              variant="contained"
            >
              Sign in with Google
            </Button>

            <Divider />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ alignItems: { sm: "center" } }}
            >
              <Chip
                icon={<SecurityIcon />}
                label="OAuth protected"
                size="small"
                variant="outlined"
              />
              <Typography color="text.secondary" variant="caption">
                Files remain in your Drive. Filer only requests access after you
                approve Google sign-in.
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
