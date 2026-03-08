import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Shield, AlertCircle, RefreshCw, LogIn, User, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { error, clearError, isLoading, login } = useApp();
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !password.trim()) return;

    await login(nombre.trim(), password);
  };

  return (
    <div key="login-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 transform -rotate-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            <span>Sistema Digital</span>
          </h1>
          <p className="text-slate-500 font-medium"><span>Ingresa tus credenciales de acceso</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-pulse">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium"><span>{error}</span></p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              <span>Nombre de Usuario</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (error) clearError();
                }}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              <span>Contraseña</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !nombre || !password}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <LogIn className="h-6 w-6" />
            )}
            <span>{isLoading ? 'Verificando...' : 'Entrar al Sistema'}</span>
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-400 text-sm font-medium">
            <span>Si olvidaste tu acceso, contacta al Administrador</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;