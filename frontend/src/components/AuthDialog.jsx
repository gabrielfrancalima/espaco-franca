import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Smartphone, Lock, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { LOGO_URL } from "@/lib/assets";

// Brazil-friendly phone mask (dd) 9nnnn-nnnn / (dd) nnnn-nnnn
function maskPhone(v) {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function extractError(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d))
    return d.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  return err?.message || "Erro inesperado. Tente novamente.";
}

export default function AuthDialog({ open, onOpenChange }) {
  const { loginWithGoogle, loginWithPhone, registerWithPhone } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setMode("login");
    setName("");
    setPhone("");
    setPassword("");
  };

  const close = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await loginWithPhone(phone, password);
      } else {
        if (!name.trim()) throw new Error("Informe seu nome.");
        user = await registerWithPhone(name.trim(), phone, password);
      }
      toast.success(mode === "login" ? "Bem-vindo de volta!" : "Conta criada!");
      close(false);
      navigate(user?.is_admin ? "/admin" : "/conta");
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        data-testid="auth-dialog"
        className="bg-[#0F0F0F] border border-white/10 text-[#F5F5F5] p-0 max-w-md rounded-none"
      >
        <div className="relative p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <img src={LOGO_URL} alt="Espaço França" className="h-10 w-10 rounded-full" />
            <DialogHeader className="text-left">
              <DialogTitle className="font-display uppercase tracking-widest text-lg">
                Entrar no Espaço França
              </DialogTitle>
              <DialogDescription className="text-[#A3A3A3] text-xs uppercase tracking-[0.2em]">
                Estilo · Precisão · Atitude
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-8">
          <Tabs defaultValue="phone" className="w-full">
            <TabsList
              className="grid grid-cols-2 w-full bg-[#141414] border border-white/10 rounded-none h-auto p-1"
              data-testid="auth-dialog-tabs"
            >
              <TabsTrigger
                value="phone"
                data-testid="auth-tab-phone"
                className="rounded-none uppercase tracking-[0.2em] text-xs data-[state=active]:bg-[#B71C1C] data-[state=active]:text-white"
              >
                Celular
              </TabsTrigger>
              <TabsTrigger
                value="google"
                data-testid="auth-tab-google"
                className="rounded-none uppercase tracking-[0.2em] text-xs data-[state=active]:bg-[#B71C1C] data-[state=active]:text-white"
              >
                Google
              </TabsTrigger>
            </TabsList>

            {/* Phone */}
            <TabsContent value="phone" className="mt-6 space-y-4">
              <div className="flex gap-2 text-xs uppercase tracking-[0.3em] text-[#A3A3A3]">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  data-testid="auth-mode-login"
                  className={`pb-1 border-b-2 transition-colors ${
                    mode === "login" ? "border-[#B71C1C] text-[#F5F5F5]" : "border-transparent"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  data-testid="auth-mode-register"
                  className={`pb-1 border-b-2 transition-colors ${
                    mode === "register" ? "border-[#B71C1C] text-[#F5F5F5]" : "border-transparent"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              <form className="space-y-4" onSubmit={submit}>
                {mode === "register" && (
                  <Field
                    icon={<User size={14} />}
                    label="Nome"
                    testid="auth-name-input"
                    value={name}
                    onChange={setName}
                    placeholder="Seu nome"
                    autoFocus
                  />
                )}
                <Field
                  icon={<Smartphone size={14} />}
                  label="Celular"
                  testid="auth-phone-input"
                  value={phone}
                  onChange={(v) => setPhone(maskPhone(v))}
                  placeholder="(11) 99999-9999"
                  inputMode="numeric"
                />
                <Field
                  icon={<Lock size={14} />}
                  label="Senha"
                  testid="auth-password-input"
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                  type="password"
                />

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="auth-submit-btn"
                  className="btn-red w-full justify-center disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />{" "}
                      {mode === "login" ? "Entrando…" : "Criando…"}
                    </>
                  ) : mode === "login" ? (
                    "Entrar"
                  ) : (
                    "Criar conta"
                  )}
                </button>
              </form>

              <p className="text-xs text-[#5A5A5A] text-center">
                Ao continuar, você concorda com nossos termos de uso.
              </p>
            </TabsContent>

            {/* Google */}
            <TabsContent value="google" className="mt-6">
              <p className="text-sm text-[#A3A3A3] mb-6">
                Use sua conta do Google para entrar em um clique.
              </p>
              <button
                onClick={loginWithGoogle}
                data-testid="auth-google-btn"
                className="btn-outline w-full justify-center"
              >
                <GoogleIcon /> Continuar com Google
              </button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, testid, icon, type = "text", inputMode, autoFocus }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[#A3A3A3] mb-2">
        {icon} {label}
      </label>
      <input
        className="w-full bg-[#141414] border border-white/10 focus:border-[#B71C1C] outline-none text-[#F5F5F5] p-3 text-sm placeholder:text-[#5A5A5A] transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        data-testid={testid}
        autoFocus={autoFocus}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
