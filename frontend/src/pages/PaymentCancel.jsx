import { Link } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { LOGO_URL } from "@/lib/assets";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 concrete-bg" data-testid="payment-cancel-page">
      <div className="max-w-lg w-full bg-[#0F0F0F] border border-white/10 p-10 text-center">
        <img src={LOGO_URL} alt="Espaço França" className="h-20 w-20 mx-auto rounded-full mb-6" />
        <XCircle className="text-[#B71C1C] mx-auto mb-4" size={54} />
        <h1 className="font-display uppercase text-3xl">Pagamento cancelado</h1>
        <p className="text-[#A3A3A3] mt-3 text-sm">
          Sem problema. Você pode voltar e escolher outro plano quando quiser.
        </p>
        <Link to="/#club" className="btn-red inline-flex mt-8" data-testid="try-again-btn">
          <ArrowLeft size={18} /> Voltar aos planos
        </Link>
      </div>
    </div>
  );
}
