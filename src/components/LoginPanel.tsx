"use client";

import GoogleIcon from "@mui/icons-material/Google";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { signIn } from "next-auth/react";

export function LoginPanel() {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 3, sm: 5 },
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={1}>
              <Typography component="h1" variant="h3">
                Filer
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Manage files directly in your Google Drive.
              </Typography>
            </Stack>

            <Button
              fullWidth
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              size="large"
              startIcon={<GoogleIcon />}
              variant="contained"
            >
              Sign in with Google
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
