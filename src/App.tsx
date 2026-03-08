import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './components/Login';
import ColaboradorDashboard from './components/dashboards/ColaboradorDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';
import VigilanteDashboard from './components/dashboards/VigilanteDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import { LogOut, User, Key, X } from 'lucide-react';

function AppContent() {
  const { usuario, setUsuario, actualizarPassword } = useApp();
  const [mostrarCambioPass, setMostrarCambioPass] = React.useState(false);
  const [nuevaPass, setNuevaPass] = React.useState('');

  const handleLogout = () => {
    setUsuario(null);
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id || !nuevaPass) return;
    const exito = await actualizarPassword(usuario.id, nuevaPass);
    if (exito) {
      alert('Contraseña actualizada correctamente');
      setMostrarCambioPass(false);
      setNuevaPass('');
    }
  };

  if (!usuario) {
    return <Login />;
  }

  const renderDashboard = () => {
    switch (usuario.rol) {
      case 'colaborador':
        return <ColaboradorDashboard key="dashboard-colaborador" />;
      case 'supervisor':
        return <SupervisorDashboard key="dashboard-supervisor" />;
      case 'vigilante':
        return <VigilanteDashboard key="dashboard-vigilante" />;
      case 'admin':
        return <AdminDashboard key="dashboard-admin" />;
      default:
        return <div key="dashboard-unknown" className="text-red-500"><span>Rol no reconocido</span></div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header key="app-header" className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  <span>Sistema de Pases de Salida</span>
                </h1>
                <p className="text-sm text-gray-600">
                  <span>{usuario.nombre} - {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarCambioPass(true)}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium text-sm"
              >
                <Key className="h-4 w-4" />
                <span>Seguridad</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Cambio de Pass */}
      {mostrarCambioPass && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Actualizar Clave</h3>
              <button onClick={() => setMostrarCambioPass(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleChangePass} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={nuevaPass}
                  onChange={e => setNuevaPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-black"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-400">
            <p className="font-bold">
              Sistema de Gestión de Pases de Salida Personal © 2026
            </p>
            <p className="mt-1 font-medium">
              Desarrollado por RHR.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;