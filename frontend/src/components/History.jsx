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
    title: "Do Aluno ao Instrutor",
    testId: "history-timeline-item-2016",
    body: `A dedicação foi tão intensa que Danilo não foi apenas um bom aluno — ele foi o destaque. De aluno, rapidamente foi convidado a se tornar instrutor do curso. Ensinar reafirmou seu dom e abriu portas para trabalhar em algumas das maiores e mais renomadas barbearias da capital.`,
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
    <section
      id="historia"
      className="relative py-24 lg:py-32 bg-[#0A0A0A] overflow-hidden"
      data-testid="history-section"
    >
      {/* Big background number */}
      <div className="absolute -top-10 -left-10 font-display text-[24rem] leading-none text-white/[0.02] select-none pointer-events-none">
        DF
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="lg:sticky lg:top-32">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-10 bg-[#B71C1C]" />
              <span className="text-[11px] uppercase tracking-[0.4em] text-[#B71C1C]">
                Nossa história
              </span>
            </div>
            <h2 className="font-display uppercase text-5xl lg:text-7xl leading-[0.9]">
              Muito além
              <br />
              da cadeira
              <br />
              <span className="text-[#B71C1C]">e da navalha</span>
            </h2>

            <div className="relative mt-10 diagonal-cut overflow-hidden">
              <img
                src="/images/foto2.jpeg"
                alt="Danilo França e o Espaço França"
                className="w-full h-[380px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Fundador</p>
                <p className="font-display text-3xl uppercase mt-1">Danilo França</p>
              </div>
            </div>
<div className="grid grid-cols-2 gap-4 mt-6">

  <img
    src="/images/foto1.jpeg"
    alt="Espaço França"
    className="w-full h-48 object-cover rounded-lg"
  />

  <img
    src="/images/foto2.jpeg"
    alt="Espaço França"
    className="w-full h-48 object-cover rounded-lg"
  />

  <img
    src="/images/foto3.jpeg"
    alt="Espaço França"
    className="w-full h-48 object-cover rounded-lg"
  />

  <img
    src="/images/foto4.jpeg"
    alt="Espaço França"
    className="w-full h-48 object-cover rounded-lg"
  />

</div>
            <blockquote
              data-testid="history-founder-quote"
              className="mt-10 border-l-2 border-[#B71C1C] pl-6 font-serif-story italic text-2xl md:text-3xl text-[#F5F5F5] leading-snug"
            >
              “A profissão de barbeiro salvou a minha vida.”
              <footer className="mt-3 text-xs not-italic uppercase tracking-[0.3em] text-[#A3A3A3] font-body">
                — Danilo França, fundador
              </footer>
            </blockquote>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[14px] top-2 bottom-2 w-[1px] bg-white/10" />
            <div className="space-y-14">
              {chapters.map((c) => (
                <div key={c.year} data-testid={c.testId} className="relative pl-14">
                  <div className="absolute left-0 top-1 h-8 w-8 border border-[#B71C1C] bg-[#0A0A0A] flex items-center justify-center">
                    <span className="h-2 w-2 bg-[#B71C1C]" />
                  </div>
                  <div className="font-display text-6xl text-[#B71C1C] leading-none">{c.year}</div>
                  <h3 className="font-display uppercase tracking-wider text-2xl mt-3 text-[#F5F5F5]">
                    {c.title}
                  </h3>
                  <p className="mt-4 font-serif-story text-xl md:text-2xl text-[#D4D4D4] leading-relaxed">
                    {c.body}
                  </p>
                </div>
              ))}

              <div className="pl-14">
                <p className="font-serif-story italic text-xl md:text-2xl text-[#A3A3A3] leading-relaxed">
                  E é essa vida, essa paixão e esse cuidado incondicional que entregamos a você
                  em cada atendimento. Bem-vindo ao Espaço França. Sente-se, sinta-se em casa e
                  faça parte da nossa história.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
