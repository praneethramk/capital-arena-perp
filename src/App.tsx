import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  mainnet: { url: "https://fullnode.mainnet.sui.io:443" },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
);

export default App;
