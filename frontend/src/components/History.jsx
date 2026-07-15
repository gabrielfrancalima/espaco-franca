import { INTERIOR_URL } from "@/lib/assets";

const chapters = [
  { year: "2015", title: "O Quintal e o Sonho", body: `Nascido e criado com orgulho nas periferias de São Paulo, Danilo França aprendeu desde cedo que a vida exige coragem...` },
  { year: "2016", title: "De Aluno a Instrutor", body: `A dedicação foi tão intensa que Danilo não foi apenas um bom aluno — ele foi o destaque...` },
  { year: "2018", title: "A Queda e a Perseverança", body: `Com o conhecimento de um professor e a experiência das grandes barbearias, Danilo deu seu primeiro salto...` },
  { year: "2020", title: "O Renascimento — Espaço França", body: `A recompensa pela resiliência chegou. Com mais maturidade, técnica refinada e a mesma vontade de vencer daquele quintal, Danilo inaugurou o Espaço França.` },
];

export default function History() {
  return (
    <section id="historia" className="relative py-24 bg-[#0A0A0A] overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* COLUNA ESQUERDA: Fundador + Imagens secundárias */}
          <div className="lg:sticky lg:top-32 space-y-6">
            <h2 className="font-display uppercase text-5xl lg:text-7xl leading-[0.9]">
              Muito além <br /> da cadeira <br /> <span className="text-[#B71C1C]">e da navalha</span>
            </h2>

            {/* Imagem do Fundador */}
            <div className="relative overflow-hidden rounded-lg cursor-pointer group">
              <img src="/images/foto2.jpeg" alt="Danilo França" className="w-full h-[450px] object-cover object-top transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs uppercase tracking-widest text-[#B71C1C]">Fundador</p>
                <h3 className="text-4xl font-bold uppercase">Danilo França</h3>
              </div>
            </div>

            {/* Imagens secundárias movidas para cá */}
            <div className="grid grid-cols-2 gap-4">
              <img src="/images/foto1.jpeg" className="h-40 w-full object-cover rounded-lg hover:scale-[1.02] transition-transform" alt="Corte 1" />
              <img src="/images/foto3.jpeg" className="h-40 w-full object-cover rounded-lg hover:scale-[1.02] transition-transform" alt="Corte 2" />
            </div>
          </div>

          {/* COLUNA DIREITA: Timeline + Foto da barbearia em destaque no final */}
          <div className="relative">
            <div className="space-y-20">
              {chapters.map((c) => (
                <div key={c.year} className="relative pl-14 border-l border-white/10">
                  <div className="font-display text-6xl text-[#B71C1C]">{c.year}</div>
                  <h3 className="text-2xl uppercase mt-3">{c.title}</h3>
                  <p className="mt-4 text-xl text-[#D4D4D4] leading-relaxed">{c.body}</p>
                  
                  {/* Foto da barbearia em destaque APENAS após o ano 2020 */}
                  {c.year === "2020" && (
                    <div className="mt-10 overflow-hidden rounded-lg cursor-pointer">
                      <img src={INTERIOR_URL} alt="Barbearia" className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
