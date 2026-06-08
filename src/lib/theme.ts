import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f7f8f6",
      paper: "#ffffff",
    },
    primary: {
      main: "#256f73",
      dark: "#184f52",
      light: "#6db0b1",
    },
    secondary: {
      main: "#c56f1a",
    },
    text: {
      primary: "#1c2424",
      secondary: "#65716f",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      "var(--font-geist-sans), Geist, ui-sans-serif, system-ui, sans-serif",
    button: {
      letterSpacing: 0,
      textTransform: "none",
    },
    h1: { letterSpacing: 0 },
    h2: { letterSpacing: 0 },
    h3: { letterSpacing: 0 },
    h4: { letterSpacing: 0 },
    h5: { letterSpacing: 0 },
    h6: { letterSpacing: 0 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
