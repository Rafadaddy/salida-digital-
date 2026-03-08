import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Clock, User, FileText, Plus, RefreshCw, AlertCircle, LogIn, Download } from 'lucide-react';

const ColaboradorDashboard: React.FC = () => {
  const { usuario, solicitudes, crearSolicitud, actualizarSolicitudes, isLoading, error, registrarRegreso, exportarExcel } = useApp();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [solicitudActiva, setSolicitudActiva] = useState<any>(null);
  const [solicitudEnSalida, setSolicitudEnSalida] = useState<any>(null);
  const [mensajeRegreso, setMensajeRegreso] = useState('');
  const [tipoMensajeRegreso, setTipoMensajeRegreso] = useState<'exito' | 'error'>('exito');

  const motivosComunes = [
    'Cita médica',
    'Trámite personal',
    'Emergencia familiar',
    'Diligencia bancaria',
    'Otro',
  ];

  // Buscar solicitud autorizada activa y en salida
  useEffect(() => {
    // Ver solo solicitudes activas (ocultar historial de regresadas/rechazadas/expiradas)
    const solicitudesActivas = solicitudes.filter(s =>
      ['pendiente', 'autorizada', 'en_salida'].includes(s.Estado)
    );

    const solicitudAutorizada = solicitudesActivas.find(
      (s) => s.Estado === 'autorizada' && s.Nombre === usuario?.nombre
    );
    const solicitudEnSalida = solicitudesActivas.find(
      (s) => s.Estado === 'en_salida' && s.Nombre === usuario?.nombre
    );
    setSolicitudActiva(solicitudAutorizada || null);
    setSolicitudEnSalida(solicitudEnSalida || null);
  }, [solicitudes, usuario]);

  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoMotivo) return;

    const exito = await crearSolicitud(nuevoMotivo);
    if (exito) {
      setNuevoMotivo('');
      setMostrarFormulario(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Función para calcular tiempo de ausencia
  const calcularTiempoAusencia = (fechaSalida: string, fechaRegreso: string): string => {
    const salida = new Date(fechaSalida).getTime();
    const regreso = new Date(fechaRegreso).getTime();
    const diferenciaMs = regreso - salida;
    const minutos = Math.floor(diferenciaMs / 60000);
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas > 0) {
      return `${horas}h ${minutosRestantes}min`;
    }
    return `${minutos} minutos`;
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      autorizada: 'bg-green-100 text-green-800 border-green-200',
      en_salida: 'bg-orange-100 text-orange-800 border-orange-200',
      regresada: 'bg-blue-100 text-blue-800 border-blue-200',
      rechazada: 'bg-red-100 text-red-800 border-red-200',
      expirada: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const etiquetas: Record<string, string> = {
      pendiente: 'PENDIENTE',
      autorizada: 'AUTORIZADA',
      en_salida: 'EN SALIDA',
      regresada: 'REGRESADO',
      rechazada: 'RECHAZADA',
      expirada: 'EXPIRADA',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${estilos[estado] || estilos.pendiente}`}>
        {etiquetas[estado] || estado.toUpperCase()}
      </span>
    );
  };

  const TiempoRestante: React.FC<{ fechaExpiracion: string }> = ({ fechaExpiracion }) => {
    const [tiempoRestante, setTiempoRestante] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        const ahora = new Date().getTime();
        const expiracion = new Date(fechaExpiracion).getTime();
        const diferencia = Math.max(0, expiracion - ahora);
        setTiempoRestante(Math.ceil(diferencia / 60000)); // Minutos
      }, 1000);

      return () => clearInterval(interval);
    }, [fechaExpiracion]);

    if (tiempoRestante <= 0) {
      return <span className="text-red-600 font-bold">EXPIRADO</span>;
    }

    const color = tiempoRestante <= 2 ? 'text-red-600' : tiempoRestante <= 5 ? 'text-yellow-600' : 'text-green-600';

    return (
      <span className={`font-bold ${color}`}>
        {tiempoRestante} min restantes
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">¡Hola, {usuario?.nombre}!</h1>
              <p className="text-gray-600">Gestiona tus solicitudes de pase de salida</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Badge de estado actual */}
            {solicitudEnSalida ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-200 rounded-full">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-orange-800">EN SALIDA</span>
              </div>
            ) : solicitudActiva ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-800">PASE AUTORIZADO</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                <span className="text-sm font-medium text-gray-600">EN LA EMPRESA</span>
              </div>
            )}
            <button
              onClick={actualizarSolicitudes}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Solicitud Activa */}
      {solicitudActiva && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-2">Pase Autorizado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-green-700">NIP de Salida:</p>
                  <p className="text-3xl font-bold text-green-900 font-mono">
                    {solicitudActiva.NIP}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Tiempo Restante:</p>
                  <p className="text-lg">
                    <TiempoRestante fechaExpiracion={solicitudActiva.Fecha_Expiracion} />
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-800">
                <p><strong>Motivo:</strong> {solicitudActiva.Motivo}</p>
                <p><strong>Aprobado por:</strong> {solicitudActiva.Supervisor_Aprobador}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de EN SALIDA - Registrar Regreso */}
      {solicitudEnSalida && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-orange-900">Estás en Salida</h3>
                <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                  EN SALIDA
                </span>
              </div>
              <div className="mb-4">
                <div className="text-sm text-orange-800">
                  <p><strong>Motivo:</strong> {solicitudEnSalida.Motivo}</p>
                  <p><strong>Salida autorizada por:</strong> {solicitudEnSalida.Salida_Autorizada_Por_Vigilante}</p>
                </div>
              </div>

              {/* Mensaje de resultado */}
              {mensajeRegreso && (
                <div className={`mb-4 p-3 rounded-lg ${tipoMensajeRegreso === 'exito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {mensajeRegreso}
                </div>
              )}

              {/* Botón de Regresar */}
              <button
                onClick={async () => {
                  if (!solicitudEnSalida.NIP) return;

                  const confirmacion = window.confirm(
                    '¿Confirmas tu regreso a la empresa?'
                  );

                  if (confirmacion) {
                    const exito = await registrarRegreso(solicitudEnSalida.NIP);
                    if (exito) {
                      setMensajeRegreso('¡Registro de regreso exitoso! Has regresado a la empresa.');
                      setTipoMensajeRegreso('exito');
                    } else {
                      setMensajeRegreso(error || 'Error al registrar regreso');
                      setTipoMensajeRegreso('error');
                    }
                  }
                }}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <LogIn className="h-5 w-5" />
                {isLoading ? 'Registrando...' : 'Registrar Mi Regreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Crear Nueva Solicitud */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Nueva Solicitud</h2>
          {!mostrarFormulario && (
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Solicitar Pase
            </button>
          )}
        </div>

        {mostrarFormulario && (
          <form onSubmit={handleCrearSolicitud} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la salida
              </label>
              <select
                value={nuevoMotivo}
                onChange={(e) => setNuevoMotivo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona un motivo</option>
                {motivosComunes.map((motivo) => (
                  <option key={motivo} value={motivo}>
                    {motivo}
                  </option>
                ))}
              </select>
              {nuevoMotivo === 'Otro' && (
                <input
                  type="text"
                  placeholder="Especifica el motivo..."
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setNuevoMotivo(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading || !nuevoMotivo}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creando...' : 'Crear Solicitud'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setNuevoMotivo('');
                }}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historial de Solicitudes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Mis Solicitudes</h2>
          {solicitudes.length > 0 && (
            <button
              onClick={() => {
                if (exportarExcel) {
                  exportarExcel(solicitudes, `mis_pases_${usuario?.nombre.replace(' ', '_')}`);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          )}
        </div>

        {solicitudes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tienes solicitudes aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.filter(s => ['pendiente', 'autorizada', 'en_salida'].includes(s.Estado)).map((solicitud) => (
              <div
                key={solicitud.ID}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{solicitud.Motivo}</p>
                    <p className="text-sm text-gray-600">
                      Solicitado: {formatearFecha(solicitud.Fecha_Hora_Solicitud)}
                    </p>
                  </div>
                  {getEstadoBadge(solicitud.Estado)}
                </div>

                {solicitud.Estado === 'autorizada' && solicitud.NIP && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">NIP:</span>
                      <span className="text-lg font-bold text-green-900 font-mono">
                        {solicitud.NIP}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColaboradorDashboard;