import React from "react";
import ReactDOM from "react-dom";
import "leaflet/dist/leaflet.css";
import "./index.css";
import { App } from "./App";
import { SnackbarProvider } from "notistack";

ReactDOM.render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3}>
      <App />
    </SnackbarProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
