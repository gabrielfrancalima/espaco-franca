import { INTERIOR_URL } from "@/lib/assets";

const chapters = [
  {
    year: "2015",
    title: "O Quintal e o Sonho",
    testId: "history-timeline-item-2015",
    body: `Nascido e criado com orgulho nas periferias de São Paulo, Danilo França aprendeu desde cedo que a vida exige coragem. Os primeiros cortes aconteceram no quintal de casa, atendendo os amigos da vizinhança. Cada trocado guardado tinha um propósito sagrado: financiar seus estudos em um curso profissionalizante de barbearia.`,
  },
  {
    year: "2016",
    title: "De Aluno a Instrutor",
    testId: "history-timeline-item-2016",
    body: `A dedicação foi tão intensa que Danilo não foi apenas um bom aluno — ele foi o destaque. De aluno, rapidamente foi convidado a se tornar instrutor do curso. Ensinar reafirmou seu dom e abriu portas para trabalhar em algumas das maiores barbearias da cidade.`,
  },
  {
    year: "2018",
    title: "A Queda e a Perseverança",
    testId: "history-timeline-item-2018",
    body: `Com o conhecimento de um professor e a experiência das grandes barbearias, Danilo deu seu primeiro salto como empreendedor. Mas o mundo dos negócios é implacável: sua primeira barbearia faliu. O tombo foi duro. Para quem cresceu tendo que lutar pelo dobro para conquistar a metade, desistir nunca foi opção.`,
  },
  {
    year: "2020",
    title: "O Renascimento — Espaço França",
    testId: "history-timeline-item-2020",
    body: `A recompensa pela resiliência chegou. Com mais maturidade, técnica refinada e a mesma vontade de vencer daquele quintal, Danilo inaugurou o Espaço França. Mais que uma barbearia de excelência, é a materialização de um sonho que sobreviveu às tempestades.`,
  },
];

export default function History() {
  return (
    <section id="historia" className="relative py-24 bg-[#0A0A0A] overflow-hidden" data-testid="history-section">
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* COLUNA ESQUERDA: Fundador + Imagens secundárias aumentadas */}
          <div className="lg:sticky lg:top-32 space-y-6">
            <h2 className="font-display uppercase text-5xl lg:text-7xl leading-[0.9]">
              Muito além <br /> da cadeira <br /> <span className="text-[#B71C1C]">e da navalha</span>
            </h2>

            <div className="relative overflow-hidden rounded-lg cursor-pointer group">
              <img src="/images/foto2.jpeg" alt="Danilo França" className="w-full h-[450px] object-cover object-top transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs uppercase tracking-widest text-[#B71C1C]">Fundador</p>
                <h3 className="text-4xl font-bold uppercase">Danilo França</h3>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 h-64 overflow-hidden rounded-lg cursor-pointer">
                <img src="/images/foto1.jpeg" className="w-full h-full object-cover object-[center_20%] hover:scale-105 transition-transform duration-500" alt="Corte 1" />
              </div>
              <div className="flex-1 h-64 overflow-hidden rounded-lg cursor-pointer">
                <img src="/images/foto3.jpeg" className="w-full h-full object-cover object-[center_30%] hover:scale-105 transition-transform duration-500" alt="Corte 2" />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Timeline + Foto da barbearia */}
          <div className="relative">
            <div className="space-y-20">
              {chapters.map((c) => (
                <div key={c.year} data-testid={c.testId} className="relative pl-14 border-l border-white/10">
                  <div className="font-display text-6xl text-[#B71C1C]">{c.year}</div>
                  <h3 className="text-2xl uppercase mt-3 text-[#F5F5F5]">{c.title}</h3>
                  <p className="mt-4 text-xl text-[#D4D4D4] leading-relaxed">{c.body}</p>
                  
                  {c.year === "2020" && (
                    <div className="mt-10 overflow-hidden rounded-lg cursor-pointer shadow-lg shadow-black/50">
                      <img src={INTERIOR_URL} alt="Barbearia" className="w-full h-80 object-cover object-center transition-transform duration-500 hover:scale-[1.02]" />
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
