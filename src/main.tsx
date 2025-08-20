import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { Toaster } from "@/components/ui/sonner";
import { WalletProvider } from "@/contexts/WalletProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </WalletProvider>
  </StrictMode>
);
