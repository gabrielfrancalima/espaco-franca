import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { LogOut, ArrowLeft, Loader2, Calendar, DollarSign, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LOGO_URL } from "@/lib/assets";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Admin() {
  const { user, loading, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [txs, setTxs] = useState([]);
  const [stats, setStats] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) return;
    Promise.all([
      axios.get(`${API}/admin/bookings`).then((r) => setBookings(r.data)),
      axios.get(`${API}/admin/transactions`).then((r) => setTxs(r.data)),
      axios.get(`${API}/admin/stats`).then((r) => setStats(r.data)),
    ])
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#B71C1C]" size={40} />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!user.is_admin) return <Navigate to="/conta" replace />;

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="admin-page">
      <header className="border-b border-white/10 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Espaço França" className="h-10 w-10 rounded-full" />
            <div className="hidden sm:block">
              <div className="font-display uppercase tracking-widest text-sm">
                Espaço França
              </div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B71C1C]">
                Painel Admin
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/conta" className="btn-outline text-xs !py-2">
              Minha conta
            </Link>
            <button
              onClick={logout}
              className="btn-outline text-xs !py-2"
              data-testid="admin-logout-btn"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#A3A3A3] mb-8 hover:text-[#F5F5F5]"
        >
          <ArrowLeft size={14} /> Voltar ao site
        </Link>

        <h1 className="font-display uppercase text-5xl mb-10">
          <span className="text-[#B71C1C]">Danilo</span>, aqui está a casa.
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          <StatCard
            icon={<Calendar size={22} />}
            label="Agendamentos"
            value={stats?.total_bookings ?? "—"}
            testid="admin-stat-bookings"
          />
          <StatCard
            icon={<Users size={22} />}
            label="Clientes cadastrados"
            value={stats?.total_users ?? "—"}
            testid="admin-stat-users"
          />
          <StatCard
            icon={<DollarSign size={22} />}
            label="Pagamentos pagos"
            value={stats?.paid_transactions ?? "—"}
            testid="admin-stat-paid"
          />
        </div>

        {fetching && <Loader2 className="animate-spin text-[#B71C1C]" />}

        {/* Bookings */}
        <section className="mb-16">
          <h2 className="font-display uppercase text-2xl tracking-wider mb-5">
            Todos os agendamentos
          </h2>
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#141414] text-[#A3A3A3] uppercase tracking-[0.2em] text-[10px]">
                <tr>
                  <Th>Data</Th>
                  <Th>Hora</Th>
                  <Th>Cliente</Th>
                  <Th>Telefone</Th>
                  <Th>Serviço</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.length === 0 && !fetching ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-[#A3A3A3]">
                      Nenhum agendamento.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="bg-[#0F0F0F] hover:bg-[#141414]"
                      data-testid={`admin-booking-${b.id}`}
                    >
                      <Td>{b.date}</Td>
                      <Td className="font-display text-base">{b.time}</Td>
                      <Td>{b.name}</Td>
                      <Td>{b.phone}</Td>
                      <Td>{b.service}</Td>
                      <Td>
                        <span className="inline-block px-2 py-1 text-[10px] uppercase tracking-[0.2em] border border-[#B71C1C] text-[#B71C1C]">
                          {b.status}
                        </span>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Transactions */}
        <section>
          <h2 className="font-display uppercase text-2xl tracking-wider mb-5">
            Transações Club
          </h2>
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#141414] text-[#A3A3A3] uppercase tracking-[0.2em] text-[10px]">
                <tr>
                  <Th>Criado em</Th>
                  <Th>Cliente</Th>
                  <Th>Plano</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {txs.length === 0 && !fetching ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-[#A3A3A3]">
                      Nenhuma transação.
                    </td>
                  </tr>
                ) : (
                  txs.map((t) => (
                    <tr
                      key={t.session_id}
                      className="bg-[#0F0F0F] hover:bg-[#141414]"
                      data-testid={`admin-tx-${t.session_id}`}
                    >
                      <Td>{new Date(t.created_at).toLocaleString("pt-BR")}</Td>
                      <Td>{t.customer_name || t.customer_email || "—"}</Td>
                      <Td>{t.plan_name}</Td>
                      <Td>
                        R$ {Number(t.amount).toFixed(2).replace(".", ",")}
                      </Td>
                      <Td>
                        <span
                          className={`inline-block px-2 py-1 text-[10px] uppercase tracking-[0.2em] border ${
                            t.payment_status === "paid"
                              ? "border-emerald-500 text-emerald-400"
                              : "border-[#B71C1C] text-[#B71C1C]"
                          }`}
                        >
                          {t.payment_status}
                        </span>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, testid }) {
  return (
    <div
      className="bg-[#141414] border border-white/10 p-6 flex items-center gap-4"
      data-testid={testid}
    >
      <div className="h-12 w-12 flex items-center justify-center bg-[#B71C1C]/10 text-[#B71C1C] border border-[#B71C1C]/40">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">{label}</div>
        <div className="font-display text-3xl mt-1">{value}</div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
