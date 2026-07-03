import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { buildWhatsappLink } from "@/lib/assets";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIME_SLOTS = [
  "09:00", "09:40", "10:20", "11:00", "11:40",
  "13:00", "13:40", "14:20", "15:00", "15:40",
  "16:20", "17:00", "17:40", "18:20", "19:00",
];

const toISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function BookingSection() {
  const [services, setServices] = useState([]);
  const [date, setDate] = useState(new Date());
  const [taken, setTaken] = useState([]);
  const [time, setTime] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    axios.get(`${API}/services`).then((r) => setServices(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!date) return;
    const iso = toISO(date);
    axios
      .get(`${API}/bookings/taken`, { params: { date: iso } })
      .then((r) => setTaken(r.data.taken || []))
      .catch(() => setTaken([]));
  }, [date]);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const submit = async () => {
    if (!name || !phone || !serviceId || !date || !time) {
      toast.error("Preencha nome, telefone, serviço, data e horário.");
      return;
    }
    try {
      setLoading(true);
      const iso = toISO(date);
      const res = await axios.post(`${API}/bookings`, {
        name,
        phone,
        service: service?.name || serviceId,
        date: iso,
        time,
        notes,
      });
      setDone(res.data);
      toast.success("Agendamento registrado!");
    } catch (e) {
      toast.error("Não foi possível registrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = () => {
    if (!done) return "";
    return `Olá! Acabei de agendar pelo site do Espaço França.

Nome: ${done.name}
Serviço: ${done.service}
Data: ${done.date}
Horário: ${done.time}
${done.notes ? "Obs: " + done.notes : ""}`;
  };

  if (done) {
    return (
      <section id="agendar" className="py-24 lg:py-32 bg-[#0A0A0A]" data-testid="booking-section">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <CheckCircle2 size={64} className="mx-auto text-[#B71C1C] mb-6" />
          <h2 className="font-display uppercase text-5xl mb-4">Horário reservado</h2>
          <p className="text-[#A3A3A3] mb-8">
            Enviamos os detalhes abaixo. Confirme com o Danilo pelo WhatsApp para garantir sua vaga.
          </p>
          <div className="bg-[#141414] border border-white/10 p-8 text-left space-y-3 mb-8">
            <Row label="Nome" value={done.name} />
            <Row label="Serviço" value={done.service} />
            <Row label="Data" value={done.date} />
            <Row label="Horário" value={done.time} />
            {done.notes && <Row label="Observações" value={done.notes} />}
          </div>
          <a
            href={buildWhatsappLink(whatsappMessage())}
            target="_blank"
            rel="noreferrer"
            className="btn-red inline-flex"
            data-testid="booking-whatsapp-btn"
          >
            Confirmar no WhatsApp <ArrowRight size={18} />
          </a>
          <button
            onClick={() => {
              setDone(null);
              setName("");
              setPhone("");
              setNotes("");
              setTime("");
              setServiceId("");
            }}
            className="block mx-auto mt-6 text-xs uppercase tracking-[0.3em] text-[#A3A3A3] hover:text-[#F5F5F5]"
            data-testid="booking-new-btn"
          >
            Fazer novo agendamento
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="agendar" className="py-24 lg:py-32 concrete-bg" data-testid="booking-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-14 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-[1px] w-10 bg-[#B71C1C]" />
            <span className="text-[11px] uppercase tracking-[0.4em] text-[#B71C1C]">
              Agendamento
            </span>
          </div>
          <h2 className="font-display uppercase text-5xl lg:text-6xl leading-[0.9]">
            Reserve seu
            <br />
            <span className="text-[#B71C1C]">horário</span>
          </h2>
          <p className="mt-4 text-[#A3A3A3]">
            Escolha o dia, o serviço e o horário. Confirmamos com você pelo WhatsApp.
          </p>
        </div>

        <div className="grid lg:grid-cols-[auto_1fr] gap-10 bg-[#0F0F0F] border border-white/10 p-6 lg:p-10">
          {/* Calendar */}
          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-[#A3A3A3] mb-3">
              1. Escolha a data
            </label>
            <div className="bg-[#141414] border border-white/10 p-3" data-testid="booking-calendar">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                className="text-[#F5F5F5]"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-8">
            {/* Service */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.3em] text-[#A3A3A3] mb-3">
                2. Serviço
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="booking-services">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    data-testid={`booking-service-${s.id}`}
                    className={`p-3 text-left border transition-all ${
                      serviceId === s.id
                        ? "border-[#B71C1C] bg-[#B71C1C]/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-[#A3A3A3]">
                      R$ {s.price.toFixed(0)} · {s.duration}min
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.3em] text-[#A3A3A3] mb-3">
                3. Horário
              </label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2" data-testid="booking-times">
                {TIME_SLOTS.map((t) => {
                  const isTaken = taken.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={isTaken}
                      onClick={() => setTime(t)}
                      data-testid={`booking-time-${t}`}
                      className={`py-2 text-sm border transition-all ${
                        time === t
                          ? "border-[#B71C1C] bg-[#B71C1C] text-white"
                          : isTaken
                          ? "border-white/5 text-[#4A4A4A] line-through cursor-not-allowed"
                          : "border-white/10 hover:border-white/40 text-[#F5F5F5]"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="4. Nome"
                testid="booking-name-input"
                value={name}
                onChange={setName}
                placeholder="Seu nome"
              />
              <Field
                label="5. Telefone / WhatsApp"
                testid="booking-phone-input"
                value={phone}
                onChange={setPhone}
                placeholder="(11) 99999-9999"
              />
            </div>

            <Field
              label="Observações (opcional)"
              testid="booking-notes-input"
              value={notes}
              onChange={setNotes}
              placeholder="Estilo desejado, referência, etc."
              textarea
            />

            <button
              onClick={submit}
              disabled={loading}
              className="btn-red w-full justify-center disabled:opacity-60"
              data-testid="booking-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Reservando…
                </>
              ) : (
                <>Confirmar agendamento</>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, testid, textarea }) {
  const cls =
    "w-full bg-[#141414] border border-white/10 focus:border-[#B71C1C] outline-none text-[#F5F5F5] p-3 text-sm placeholder:text-[#5A5A5A] transition-colors";
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.3em] text-[#A3A3A3] mb-2">
        {label}
      </label>
      {textarea ? (
        <textarea
          className={cls + " min-h-[90px] resize-y"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testid}
        />
      ) : (
        <input
          className={cls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testid}
        />
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-[11px] uppercase tracking-[0.3em] text-[#A3A3A3]">{label}</span>
      <span className="text-[#F5F5F5] text-right">{value}</span>
    </div>
  );
}
