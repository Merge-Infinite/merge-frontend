"use client";

import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.scss";
import "./utils/setup-buffer-shim";
export default function WalletApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
