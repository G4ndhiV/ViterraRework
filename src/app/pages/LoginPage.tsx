import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Reveal } from "../components/Reveal";
import { SocialFollowStrip } from "../components/SocialFollowStrip";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        navigate("/admin");
      } else {
        setError("Credenciales incorrectas. Verifica email y contraseña.");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="viterra-page flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 items-center justify-center p-6">
        <Reveal className="w-full max-w-md" y={24}>
        {/* Logo y Título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-6 bg-primary">
            <Building2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading text-3xl font-semibold text-brand-navy mb-2 tracking-tight">VITERRA</h1>
          <p className="text-slate-500 text-sm uppercase tracking-widest" style={{ letterSpacing: '0.1em', fontWeight: 500 }}>Grupo Inmobiliario</p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontWeight: 600 }}>Bienvenido</h2>
            <p className="text-sm text-slate-600" style={{ fontWeight: 500 }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide" style={{ letterSpacing: '0.05em', fontWeight: 600 }}>
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-400" strokeWidth={1.5} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all text-sm text-brand-navy placeholder-slate-400 font-medium"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide" style={{ letterSpacing: '0.05em', fontWeight: 600 }}>
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-400" strokeWidth={1.5} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-ring/40 transition-all text-sm text-brand-navy placeholder-slate-400 font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:bg-slate-50 rounded-r-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-slate-400 hover:text-slate-600" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-slate-400 hover:text-slate-600" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ fontWeight: 500, backgroundColor: '#fef2f2', borderWidth: '1px', borderColor: '#fecaca', color: '#991b1b' }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-brand-red-hover text-primary-foreground py-3 px-4 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4.5 h-4.5" strokeWidth={2} />
                </>
              )}
            </button>
          </form>

          {/* Credenciales de Demo */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide" style={{ letterSpacing: '0.05em', fontWeight: 600 }}>
              Credenciales de Demo:
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Administrador (todos los leads):</p>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-900">
                  admin@viterra.com / admin123
                </code>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Líder de grupo (todos los leads):</p>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-900">
                  lider@viterra.com / lider123
                </code>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1" style={{ fontWeight: 500 }}>Asesor (solo leads asignados):</p>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-900">
                  asesor@viterra.com / asesor123
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Volver al Sitio */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors inline-flex items-center gap-2"
            style={{ fontWeight: 500 }}
          >
            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={1.5} />
            Volver al sitio web
          </button>
        </div>
        </Reveal>
      </div>
      <SocialFollowStrip theme="light" />
    </div>
  );
}
