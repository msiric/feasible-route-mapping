import { createTheme } from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: [
      "Plus Jakarta Display",
      "Poppins",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Oxygen-Sans",
      "Ubuntu",
      "Cantarell",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ].join(","),
    fontSize: 14,
  },
  shape: { borderRadius: 20 },
  palette: {
    primary: { main: "#e3f2fd" },
    mode: "dark",
  },
  components: {
    MuiCardContent: {
      styleOverrides: {
        root: {
          "&:last-child": {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          position: "absolute",
          bottom: -20,
        },
      },
    },
  },
});

export default theme;
