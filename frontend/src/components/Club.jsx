import { useEffect, useState } from "react";
import axios from "axios";
import { Check, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const highlight = "prata"; // destaque visual

export default function Club() {
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    axios.get(`${API}/plans`).then((r) => setPlans(r.data)).catch(() => setPlans([]));
  }, []);

  const subscribe = async (planId) => {
    try {
      setLoadingPlan(planId);
      const origin = window.location.origin;
      const res = await axios.post(`${API}/checkout/session`, {
        plan_id: planId,
        origin_url: origin,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Não foi possível iniciar o pagamento.");
      }
    } catch (e) {
      toast.error("Erro ao criar sessão de pagamento. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="club" className="relative py-24 lg:py-32 bg-[#0A0A0A]" data-testid="club-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-[1px] w-10 bg-[#B71C1C]" />
            <span className="text-[11px] uppercase tracking-[0.4em] text-[#B71C1C]">
              Club de Assinatura
            </span>
            <span className="h-[1px] w-10 bg-[#B71C1C]" />
          </div>
          <h2 className="font-display uppercase text-5xl lg:text-6xl leading-[0.9]">
            Sempre no <span className="text-[#B71C1C]">estilo</span>.
            <br />
            Sempre em <span className="text-[#B71C1C]">dia</span>.
          </h2>
          <p className="mt-6 text-[#A3A3A3] text-base md:text-lg">
            Cortes e barba todo mês por um valor fixo. Pague uma vez, viva no estilo o mês inteiro.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isHighlight = p.id === highlight;
            return (
              <div
                key={p.id}
                data-testid={`plan-card-${p.id}`}
                className={`relative bg-[#141414] border p-8 lg:p-10 flex flex-col hover-lift ${
                  isHighlight ? "border-[#B71C1C]" : "border-white/10"
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-8 bg-[#B71C1C] text-white text-[10px] uppercase tracking-[0.3em] px-3 py-1 flex items-center gap-1">
                    <Crown size={12} /> Mais escolhido
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display uppercase text-3xl">{p.name}</h3>
                  {isHighlight && <span className="text-[#B71C1C] text-3xl">★</span>}
                </div>

                <p className="text-sm text-[#A3A3A3] mb-8 min-h-[3rem]">{p.description}</p>

                <div className="mb-8 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg text-[#A3A3A3]">R$</span>
                    <span
                      className="font-display text-6xl leading-none"
                      data-testid={`plan-price-${p.id}`}
                    >
                      {p.amount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#A3A3A3] mt-2">por mês</p>
                </div>

                <ul className="space-y-3 mb-10 flex-1">
                  {p.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#D4D4D4]">
                      <Check size={16} className="text-[#B71C1C] shrink-0 mt-[3px]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribe(p.id)}
                  disabled={loadingPlan === p.id}
                  data-testid={`subscribe-btn-${p.id}`}
                  className={`${
                    isHighlight ? "btn-red" : "btn-outline"
                  } w-full justify-center disabled:opacity-60`}
                >
                  {loadingPlan === p.id ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Redirecionando…
                    </>
                  ) : (
                    <>Assinar {p.name.replace("Club ", "")}</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-[#A3A3A3] mt-10 uppercase tracking-[0.3em]">
          Pagamento seguro via Stripe · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
