import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { LOGO_URL } from "@/lib/assets";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const sessionId = params.get("session_id");

    const finish = async () => {
      if (!sessionId) {
        navigate("/", { replace: true });
        return;
      }
      try {
        const r = await axios.post(`${API}/auth/session`, { session_id: sessionId });
        setUser(r.data);
        // Clean URL and redirect
        window.history.replaceState({}, document.title, "/conta");
        navigate(r.data.is_admin ? "/admin" : "/conta", {
          replace: true,
          state: { user: r.data },
        });
      } catch {
        navigate("/", { replace: true });
      }
    };
    finish();
  }, [navigate, setUser]);

  return (
    <div
      className="min-h-screen flex items-center justify-center concrete-bg"
      data-testid="auth-callback"
    >
      <div className="text-center">
        <img src={LOGO_URL} alt="Espaço França" className="h-20 w-20 mx-auto rounded-full mb-6" />
        <Loader2 className="animate-spin text-[#B71C1C] mx-auto mb-4" size={38} />
        <p className="text-[#A3A3A3] uppercase tracking-[0.3em] text-xs">
          Entrando…
        </p>
      </div>
    </div>
  );
}
