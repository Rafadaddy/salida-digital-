import React, { useState } from 'react';
import { Users, Shield, Eye, AlertCircle, Wrench } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Login: React.FC = () => {
  const { setUsuario, error, clearError, isLoading, verificarUsuario } = useApp();
  const [nombre, setNombre] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState<'colaborador' | 'supervisor' | 'vigilante'>('colaborador');

  const roles = [
    {
      id: 'colaborador' as const,
      nombre: 'Colaborador',
      descripcion: 'Crear y gestionar mis solicitudes de salida',
      icono: Users,
      color: 'bg-blue-500',
    },
    {
      id: 'supervisor' as const,
      nombre: 'Supervisor',
      descripcion: 'Aprobar o rechazar solicitudes de pases',
      icono: Shield,
      color: 'bg-green-500',
    },
    {
      id: 'vigilante' as const,
      nombre: 'Vigilante',
      descripcion: 'Validar NIPs y autorizar salidas físicas',
      icono: Eye,
      color: 'bg-red-500',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      return;
    }

    clearError();

    try {
      // Usar la función verificarUsuario del contexto (funciona tanto en modo demo como real)
      const success = await verificarUsuario?.(nombre.trim(), rolSeleccionado);

      if (!success) {
        // El error ya fue manejado por el contexto
        return;
      }

      // El usuario se configuró automáticamente en el contexto si el login fue exitoso
    } catch (err) {
      console.error('Error de autenticación:', err);
      // El error ya se maneja en el contexto
    }
  };

  return (
    <div key="login-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span>Sistema de Pases de Salida</span>
          </h1>
          <p className="text-gray-600">
            <span>Accede con tu nombre y selecciona tu rol</span>
          </p>
        </div>

        {error && (
          <div key="login-error-alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700"><span>{error}</span></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Ej: Juan Pérez"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona tu rol
            </label>
            <div className="space-y-3">
              {roles.map((rol) => {
                const IconComponent = rol.icono;
                return (
                  <label
                    key={rol.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${rolSeleccionado === rol.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                      }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={rol.id}
                      checked={rolSeleccionado === rol.id}
                      onChange={(e) => setRolSeleccionado(e.target.value as any)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div className="flex items-start gap-3">
                      <div className={`${rol.color} p-2 rounded-lg`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{rol.nombre}</div>
                        <div className="text-sm text-gray-600">{rol.descripcion}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !nombre.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Acceder al Sistema'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Sistema desarrollado para gestión empresarial de pases de salida
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;