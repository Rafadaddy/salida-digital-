import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './components/Login';
import ColaboradorDashboard from './components/dashboards/ColaboradorDashboard';
import SupervisorDashboard from './components/dashboards/SupervisorDashboard';
import VigilanteDashboard from './components/dashboards/VigilanteDashboard';
import { LogOut, User } from 'lucide-react';

function AppContent() {
  const { usuario, setUsuario } = useApp();

  const handleLogout = () => {
    setUsuario(null);
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

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              Sistema de Gestión de Pases de Salida Personal © 2025
            </p>
            <p className="mt-1">
              Desarrollado con React + TypeScript + Google Sheets API
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