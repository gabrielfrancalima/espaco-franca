import { INTERIOR_URL, LOGO_URL } from "@/lib/assets";
import { Scissors, Calendar } from "lucide-react";

export default function Hero({ onBook, onSubscribe }) {
  return (
    <section
      id="top"
      className="relative min-h-screen w-full overflow-hidden grain"
      data-testid="hero-section"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={INTERIOR_URL}
          alt="Interior da Espaço França"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/40" />
      </div>

      {/* Red accent line */}
      <div className="absolute top-1/2 left-0 h-[2px] w-24 bg-[#B71C1C] hidden md:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-40 pb-24 min-h-screen flex flex-col justify-center">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
          {/* Left column */}
          <div className="fade-in-up">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-[1px] w-10 bg-[#B71C1C]" />
              <span
                data-testid="hero-slogan"
                className="text-[11px] uppercase tracking-[0.4em] text-[#B71C1C] font-semibold"
              >
                Desde 2020 · Estilo · Precisão · Atitude
              </span>
            </div>

            <h1 className="font-display uppercase leading-[0.9] text-[#F5F5F5] text-6xl sm:text-7xl lg:text-[8rem]">
              Espaço
              <br />
              <span className="text-[#B71C1C]">França</span>
            </h1>

            <p
              className="mt-8 max-w-xl text-lg md:text-xl text-[#A3A3A3] leading-relaxed"
              data-testid="hero-subtitle"
            >
              Uma barbearia construída no suor, na técnica e no respeito. Sente-se,
              sinta-se em casa e faça parte da nossa história.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="btn-red" onClick={onBook} data-testid="hero-book-btn">
                <Calendar size={18} /> Agendar Horário
              </button>
              <button
                className="btn-outline"
                onClick={onSubscribe}
                data-testid="hero-club-btn"
              >
                <Scissors size={18} /> Assinar Club
              </button>
            </div>

            <div className="mt-14 flex items-center gap-10 text-xs uppercase tracking-[0.3em] text-[#A3A3A3]">
              <div>
                <div className="font-display text-3xl text-[#F5F5F5]">05+</div>
                Anos de estrada
              </div>
              <div className="h-10 w-[1px] bg-white/10" />
              <div>
                <div className="font-display text-3xl text-[#F5F5F5]">2K+</div>
                Cortes feitos
              </div>
              <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />
              <div className="hidden sm:block">
                <div className="font-display text-3xl text-[#F5F5F5]">100%</div>
                Confiança
              </div>
            </div>
          </div>

          {/* Right column - Logo showcase */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 bg-[#B71C1C]/15 blur-[80px] rounded-full" />
            <img
              src={LOGO_URL}
              alt="Espaço França Logo"
              className="relative z-10 w-[380px] h-[380px] object-contain drop-shadow-[0_20px_60px_rgba(183,28,28,0.35)]"
              data-testid="hero-logo"
            />
          </div>
        </div>
      </div>

      {/* Bottom marquee */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/70 backdrop-blur-md py-4 overflow-hidden">
        <div className="marquee font-display text-2xl uppercase tracking-[0.3em] text-[#A3A3A3]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12 shrink-0">
              <span>Corte</span>
              <span className="text-[#B71C1C]">✕</span>
              <span>Barba</span>
              <span className="text-[#B71C1C]">✕</span>
              <span>Platinado</span>
              <span className="text-[#B71C1C]">✕</span>
              <span>Pigmentação</span>
              <span className="text-[#B71C1C]">✕</span>
              <span>Sobrancelha</span>
              <span className="text-[#B71C1C]">✕</span>
              <span>Estilo</span>
              <span className="text-[#B71C1C]">✕</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
