import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "@/lib/assets";
import { Menu, X, LogIn, User, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthDialog from "@/components/AuthDialog";

const links = [
  { href: "#servicos", label: "Serviços" },
  { href: "#historia", label: "História" },
  { href: "#club", label: "Club" },
  { href: "#agendar", label: "Agendar" },
  { href: "#contato", label: "Contato" },
];

export default function Navbar({ onBook, onSubscribe }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-20">
        <a href="#top" className="flex items-center gap-3" data-testid="navbar-logo">
          <img src={LOGO_URL} alt="Espaço França" className="h-12 w-12 rounded-full object-cover" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-lg uppercase tracking-[0.2em] text-[#F5F5F5]">
              Espaço França
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3]">
              Estilo · Precisão · Atitude
            </span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className="text-sm uppercase tracking-[0.2em] text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              {user.is_admin && (
                <Link
                  to="/admin"
                  className="btn-outline text-xs !py-2"
                  data-testid="navbar-admin-link"
                >
                  <Shield size={14} /> Admin
                </Link>
              )}
              <Link
                to="/conta"
                className="flex items-center gap-2 group"
                data-testid="navbar-account-link"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-9 w-9 rounded-full border border-white/20 group-hover:border-[#B71C1C]"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-[#B71C1C]/20 flex items-center justify-center">
                    <User size={16} />
                  </div>
                )}
                <span className="text-xs uppercase tracking-[0.2em] text-[#A3A3A3] group-hover:text-[#F5F5F5]">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="btn-outline text-xs !py-2"
              data-testid="navbar-login-btn"
            >
              <LogIn size={14} /> Entrar
            </button>
          )}
          <button className="btn-red text-xs" onClick={onBook} data-testid="navbar-book-btn">
            Agendar
          </button>
        </div>

        <button
          className="lg:hidden text-[#F5F5F5]"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          data-testid="navbar-mobile-toggle"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-[#0A0A0A] border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              data-testid={`nav-mobile-link-${l.label.toLowerCase()}`}
              className="text-sm uppercase tracking-[0.25em] text-[#A3A3A3] hover:text-[#B71C1C]"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            {user ? (
              <Link
                to="/conta"
                onClick={() => setOpen(false)}
                className="btn-outline text-xs justify-center"
                data-testid="navbar-mobile-account"
              >
                <User size={14} /> Minha conta
              </Link>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  setAuthOpen(true);
                }}
                className="btn-outline text-xs justify-center"
                data-testid="navbar-mobile-login"
              >
                <LogIn size={14} /> Entrar
              </button>
            )}
            <button
              className="btn-red text-xs justify-center"
              onClick={() => {
                setOpen(false);
                onBook();
              }}
            >
              Agendar
            </button>
          </div>
        </div>
      )}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
