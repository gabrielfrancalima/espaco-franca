import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICONS = {
  corte: "✂",
  barba: "✦",
  "corte-barba": "★",
  pezinho: "◆",
  sobrancelha: "◈",
  platinado: "❖",
  pigmentacao: "▲",
};

export default function Services({ onBook }) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/services`)
      .then((r) => setServices(r.data))
      .catch(() => setServices([]));
  }, []);

  return (
    <section id="servicos" className="relative py-24 lg:py-32 concrete-bg" data-testid="services-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 mb-16 items-end">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-10 bg-[#B71C1C]" />
              <span className="text-[11px] uppercase tracking-[0.4em] text-[#B71C1C]">
                O que fazemos
              </span>
            </div>
            <h2 className="font-display uppercase text-5xl lg:text-6xl leading-none">
              Serviços
              <br />
              <span className="text-[#B71C1C]">e valores</span>
            </h2>
          </div>
          <p className="text-[#A3A3A3] text-base md:text-lg leading-relaxed max-w-xl lg:justify-self-end">
            Cada corte pensado, cada barba desenhada. Combinamos técnica de alto padrão
            com o respeito pelo estilo de cada cliente. Aqui você não é apenas mais um.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/10">
          {services.map((s, idx) => (
            <div
              key={s.id}
              data-testid={`service-card-${s.id}`}
              className={`group relative bg-[#0F0F0F] p-8 lg:p-10 hover-lift border border-transparent ${
                idx === 0 ? "lg:col-span-1" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-8">
                <span className="text-4xl text-[#B71C1C]">{ICONS[s.id] || "◆"}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="font-display uppercase text-3xl mb-3 text-[#F5F5F5]">{s.name}</h3>
              <p className="text-sm text-[#A3A3A3] mb-8">
                {s.duration} min · atendimento sob agendamento
              </p>

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs uppercase tracking-[0.3em] text-[#A3A3A3]">A partir de</span>
                  <div
                    className="font-display text-5xl text-[#F5F5F5] mt-1"
                    data-testid={`service-price-${s.id}`}
                  >
                    R$ {s.price.toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={onBook}
                  data-testid={`service-book-${s.id}`}
                  className="opacity-70 group-hover:opacity-100 group-hover:text-[#B71C1C] transition-all p-3"
                  aria-label={`Agendar ${s.name}`}
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          ))}

          {/* CTA tile */}
          <div className="bg-[#B71C1C] p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">Pronto?</span>
              <h3 className="font-display uppercase text-4xl mt-4 text-white leading-none">
                Reserve
                <br />
                seu horário
              </h3>
            </div>
            <button
              onClick={onBook}
              data-testid="services-cta-book"
              className="mt-8 inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] font-bold text-white border-b border-white/50 pb-2 self-start hover:border-white"
            >
              Agendar agora <ArrowRight size={18} />
            </button>
            <div className="absolute -bottom-6 -right-6 text-[10rem] font-display text-white/10 leading-none select-none">
              EF
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
