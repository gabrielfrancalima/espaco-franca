import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { LogOut, Calendar, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LOGO_URL } from "@/lib/assets";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Account() {
  const { user, loading, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [subs, setSubs] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      axios.get(`${API}/me/bookings`).then((r) => setBookings(r.data)).catch(() => {}),
      axios.get(`${API}/me/subscriptions`).then((r) => setSubs(r.data)).catch(() => {}),
    ]).finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#B71C1C]" size={40} />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const activeSub = subs.find((s) => s.payment_status === "paid");

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="account-page">
      <header className="border-b border-white/10 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-30">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Espaço França" className="h-10 w-10 rounded-full" />
            <div className="hidden sm:block">
              <div className="font-display uppercase tracking-widest text-sm">Espaço França</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">Minha conta</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full" />
            ) : null}
            <div className="hidden md:block text-right">
              <div className="text-sm">{user.name}</div>
              <div className="text-xs text-[#A3A3A3]">{user.email}</div>
            </div>
            {user.is_admin && (
              <Link
                to="/admin"
                data-testid="account-admin-link"
                className="btn-outline text-xs !py-2"
              >
                Painel Admin
              </Link>
            )}
            <button
              onClick={logout}
              className="btn-outline text-xs !py-2"
              data-testid="account-logout-btn"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#A3A3A3] mb-8 hover:text-[#F5F5F5]"
        >
          <ArrowLeft size={14} /> Voltar ao site
        </Link>

        <h1 className="font-display uppercase text-5xl mb-2">
          Olá, <span className="text-[#B71C1C]">{user.name.split(" ")[0]}</span>
        </h1>
        <p className="text-[#A3A3A3] mb-12">Seus agendamentos e sua assinatura em um só lugar.</p>

        {/* Subscription */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <CreditCard size={18} className="text-[#B71C1C]" />
            <h2 className="font-display uppercase text-2xl tracking-wider">Sua assinatura</h2>
          </div>
          {activeSub ? (
            <div className="bg-[#141414] border border-[#B71C1C] p-6 flex flex-wrap gap-6 items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-[#B71C1C]">Plano ativo</div>
                <div className="font-display text-3xl mt-1">{activeSub.plan_name}</div>
                <div className="text-sm text-[#A3A3A3] mt-1">
                  R$ {activeSub.amount.toFixed(2).replace(".", ",")} · {activeSub.currency.toUpperCase()}
                </div>
              </div>
              <Link to="/#club" className="btn-outline text-xs">Ver planos</Link>
            </div>
          ) : (
            <div className="bg-[#141414] border border-white/10 p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-display text-xl">Você ainda não tem assinatura ativa.</div>
                <div className="text-sm text-[#A3A3A3] mt-1">
                  Assine o Club e economize todo mês.
                </div>
              </div>
              <Link to="/#club" className="btn-red text-xs" data-testid="account-subscribe-cta">
                Ver planos
              </Link>
            </div>
          )}
        </section>

        {/* Bookings */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Calendar size={18} className="text-[#B71C1C]" />
            <h2 className="font-display uppercase text-2xl tracking-wider">Meus agendamentos</h2>
          </div>

          {fetching ? (
            <Loader2 className="animate-spin text-[#B71C1C]" />
          ) : bookings.length === 0 ? (
            <div className="bg-[#141414] border border-white/10 p-6 text-[#A3A3A3]">
              Nenhum agendamento por aqui ainda.{" "}
              <Link to="/#agendar" className="text-[#B71C1C] hover:underline">
                Agendar agora
              </Link>
              .
            </div>
          ) : (
            <div className="border border-white/10 divide-y divide-white/10">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-2 md:grid-cols-5 gap-3 p-5 bg-[#0F0F0F] items-center"
                  data-testid={`account-booking-${b.id}`}
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">Data</div>
                    <div className="font-display text-lg">{b.date}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">Horário</div>
                    <div className="font-display text-lg">{b.time}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">Serviço</div>
                    <div className="text-sm">{b.service}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">Telefone</div>
                    <div className="text-sm">{b.phone}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">Status</div>
                    <span className="inline-block px-2 py-1 text-[10px] uppercase tracking-[0.2em] border border-[#B71C1C] text-[#B71C1C]">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
