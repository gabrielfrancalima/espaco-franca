import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";
import { LOGO_URL } from "@/lib/assets";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");
  const [data, setData] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      if (attempts.current >= 12) {
        setStatus("timeout");
        return;
      }
      attempts.current += 1;
      try {
        const r = await axios.get(`${API}/checkout/status/${sessionId}`);
        setData(r.data);
        if (r.data.payment_status === "paid") {
          setStatus("paid");
          return;
        }
        if (r.data.status === "expired") {
          setStatus("expired");
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 2500);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 concrete-bg" data-testid="payment-success-page">
      <div className="max-w-lg w-full bg-[#0F0F0F] border border-white/10 p-10 text-center">
        <img src={LOGO_URL} alt="Espaço França" className="h-20 w-20 mx-auto rounded-full mb-6" />

        {status === "checking" && (
          <>
            <Loader2 className="animate-spin text-[#B71C1C] mx-auto mb-4" size={44} />
            <h1 className="font-display uppercase text-3xl">Confirmando pagamento…</h1>
            <p className="text-[#A3A3A3] mt-3 text-sm">Aguarde, estamos validando com a Stripe.</p>
          </>
        )}

        {status === "paid" && (
          <>
            <CheckCircle2 className="text-[#B71C1C] mx-auto mb-4" size={54} />
            <h1 className="font-display uppercase text-4xl">Bem-vindo ao Club!</h1>
            <p className="text-[#A3A3A3] mt-3">
              Sua assinatura {data?.metadata?.plan_name ? `“${data.metadata.plan_name}”` : ""} foi
              ativada. Nos vemos na cadeira.
            </p>
            <Link to="/" className="btn-red inline-flex mt-8" data-testid="back-home-btn">
              Voltar ao site <ArrowRight size={18} />
            </Link>
          </>
        )}

        {(status === "expired" || status === "timeout" || status === "error") && (
          <>
            <XCircle className="text-[#B71C1C] mx-auto mb-4" size={54} />
            <h1 className="font-display uppercase text-3xl">Não foi possível confirmar</h1>
            <p className="text-[#A3A3A3] mt-3 text-sm">
              Se você foi cobrado, entre em contato conosco pelo WhatsApp — resolvemos rapidinho.
            </p>
            <Link to="/" className="btn-outline inline-flex mt-8">
              Voltar ao site
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
