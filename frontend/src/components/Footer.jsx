import { LOGO_URL, WHATSAPP_NUMBER, buildWhatsappLink } from "@/lib/assets";
import { Instagram, MessageCircle, MapPin, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contato" className="relative bg-[#0A0A0A] border-t border-white/10 pt-20 pb-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <img src={LOGO_URL} alt="Espaço França" className="h-16 w-16 rounded-full" />
            <div>
              <div className="font-display uppercase text-2xl tracking-wider">Espaço França</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B71C1C]">
                Estilo · Precisão · Atitude
              </div>
            </div>
          </div>
          <p className="text-[#A3A3A3] max-w-md text-sm leading-relaxed">
            Uma barbearia construída com suor, técnica e respeito. Desde 2020, somos o espaço
            onde o seu estilo encontra atitude.
          </p>
          <blockquote className="mt-6 font-serif-story italic text-lg text-[#F5F5F5] border-l-2 border-[#B71C1C] pl-4">
            “A profissão de barbeiro salvou a minha vida.” — Danilo França
          </blockquote>
        </div>

        <div>
          <h4 className="font-display uppercase tracking-widest text-sm mb-4 text-[#B71C1C]">
            Horário
          </h4>
          <ul className="text-sm text-[#A3A3A3] space-y-2">
            <li className="flex items-center gap-2">
              <Clock size={14} /> Ter — Sex: 09h às 20h
            </li>
            <li className="flex items-center gap-2">
              <Clock size={14} /> Sábado: 08h às 18h
            </li>
            <li className="flex items-center gap-2">
              <Clock size={14} /> Dom · Seg: Fechado
            </li>
          </ul>

          <h4 className="font-display uppercase tracking-widest text-sm mt-8 mb-4 text-[#B71C1C]">
            Endereço
          </h4>
          <p className="text-sm text-[#A3A3A3] flex items-start gap-2">
  <MapPin size={14} className="mt-1 shrink-0" />
  <>
    R. Juraraterê, 07
    <br />
    Itaim Paulista
    <br />
    São Paulo - SP
    <br />
    CEP 08140-040
  </>
</p>
        </div>

        <div>
          <h4 className="font-display uppercase tracking-widest text-sm mb-4 text-[#B71C1C]">
            Contato
          </h4>
          <div className="space-y-3">
            <a
              href={buildWhatsappLink("Salve! Vim pelo site do Espaço França.")}
              target="_blank"
              rel="noreferrer"
              data-testid="footer-whatsapp"
              className="flex items-center gap-2 text-sm text-[#F5F5F5] hover:text-[#B71C1C] transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a
              href="https://www.instagram.com/espacofranca.ofc"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-instagram"
              className="flex items-center gap-2 text-sm text-[#F5F5F5] hover:text-[#B71C1C] transition-colors"
            >
              <Instagram size={16} /> @espacofranca.ofc
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[#5A5A5A]">
          © {new Date().getFullYear()} Espaço França Barbearia · Desde 2020
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-[#5A5A5A]">
          Estilo · Precisão · Atitude
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#B71C1C] to-transparent opacity-60" />
    </footer>
  );
}
