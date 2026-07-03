import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import AuthCallback from "@/pages/AuthCallback";
import { AuthProvider } from "@/context/AuthContext";

function AppRoutes() {
  const location = useLocation();
  // Detect Emergent OAuth return synchronously (before other routes render)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
      <Route path="/pagamento/cancelado" element={<PaymentCancel />} />
      <Route path="/conta" element={<Account />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#141414",
            color: "#F5F5F5",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
    </div>
  );
}

export default App;
