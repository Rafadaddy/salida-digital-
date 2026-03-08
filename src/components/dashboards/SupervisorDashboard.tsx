import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Shield, CheckCircle, XCircle, Clock, Filter, RefreshCw, Users, AlertCircle, Download, LogIn } from 'lucide-react';

const SupervisorDashboard: React.FC = () => {
  const { usuario, solicitudes, autorizarSolicitud, actualizarSolicitudes, isLoading, error, exportarExcel } = useApp();
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<any[]>([]);

  useEffect(() => {
    let filtradas = solicitudes;

    if (filtroEstado !== 'todos') {
      filtradas = solicitudes.filter(s => s.Estado === filtroEstado);
    }

    // Ordenar por fecha de solicitud (más recientes primero)
    filtradas.sort((a, b) => {
      return new Date(b.Fecha_Hora_Solicitud).getTime() - new Date(a.Fecha_Hora_Solicitud).getTime();
    });

    setSolicitudesFiltradas(filtradas);
  }, [solicitudes, filtroEstado]);

  const handleAutorizar = async (id: string, decision: 'autorizar' | 'rechazar') => {
    const confirmacion = decision === 'autorizar'
      ? '¿Estás seguro de autorizar esta solicitud?'
      : '¿Estás seguro de rechazar esta solicitud?';

    if (window.confirm(confirmacion)) {
      await autorizarSolicitud(id, decision);
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${estilos[estado] || estilos.pendiente}`}>
        {etiquetas[estado] || estado.toUpperCase()}
      </span>
    );
  };

  const contarPorEstado = (estado: string) => {
    return solicitudes.filter(s => s.Estado === estado).length;
  };

  const TiempoRestante: React.FC<{ fechaExpiracion: string }> = ({ fechaExpiracion }) => {
    const [tiempoRestante, setTiempoRestante] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        const ahora = new Date().getTime();
        const expiracion = new Date(fechaExpiracion).getTime();
        const diferencia = Math.max(0, expiracion - ahora);
        setTiempoRestante(Math.ceil(diferencia / 60000));
      }, 1000);

      return () => clearInterval(interval);
    }, [fechaExpiracion]);

    if (tiempoRestante <= 0) {
      return <span className="text-red-600 text-xs">EXPIRADO</span>;
    }

    const color = tiempoRestante <= 2 ? 'text-red-600' : tiempoRestante <= 5 ? 'text-yellow-600' : 'text-green-600';

    return (
      <span className={`text-xs font-medium ${color}`}>
        {tiempoRestante} min
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Panel de Supervisor</h1>
              <p className="text-gray-600">Gestiona las solicitudes de pases de salida</p>
            </div>
          </div>
          <button
            onClick={actualizarSolicitudes}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              if (exportarExcel) {
                exportarExcel(solicitudes, 'reporte_todos_pases');
              }
            }}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
            title="Exportar a Excel"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">Exportar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-900">{contarPorEstado('pendiente')}</p>
              <p className="text-sm text-yellow-700">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{contarPorEstado('autorizada')}</p>
              <p className="text-sm text-green-700">Autorizadas</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-900">{contarPorEstado('en_salida')}</p>
              <p className="text-sm text-orange-700">En Salida</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <LogIn className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{contarPorEstado('regresada')}</p>
              <p className="text-sm text-blue-700">Regresadas</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-900">{contarPorEstado('rechazada')}</p>
              <p className="text-sm text-red-700">Rechazadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Panel de Colaboradores Fuera */}
      {contarPorEstado('en_salida') > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-orange-600" />
            <h2 className="text-lg font-bold text-orange-900">
              Colaboradores Actualmente Fuera ({contarPorEstado('en_salida')})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {solicitudes
              .filter(s => s.Estado === 'en_salida')
              .map(sol => (
                <div key={sol.ID} className="bg-white border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{sol.Nombre}</span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      EN SALIDA
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1"><strong>Motivo:</strong> {sol.Motivo}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Salida:</strong> {formatearFecha(sol.Fecha_Hora_Aprobacion)}</p>
                  <p className="text-sm text-gray-600"><strong>Vigilante:</strong> {sol.Salida_Autorizada_Por_Vigilante}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="todos">Todas</option>
            <option value="pendiente">Solo Pendientes</option>
            <option value="autorizada">Solo Autorizadas</option>
            <option value="en_salida">Solo En Salida</option>
            <option value="regresada">Solo Regresadas</option>
            <option value="rechazada">Solo Rechazadas</option>
            <option value="expirada">Solo Expiradas</option>
          </select>
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Solicitudes ({solicitudesFiltradas.length})
          </h2>
        </div>

        {solicitudesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay solicitudes que coincidan con el filtro seleccionado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {solicitudesFiltradas.map((solicitud) => (
              <div key={solicitud.ID} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">{solicitud.Nombre}</h3>
                          {getEstadoBadge(solicitud.Estado)}
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Motivo:</strong> {solicitud.Motivo}</p>
                          <p><strong>Solicitado:</strong> {formatearFecha(solicitud.Fecha_Hora_Solicitud)}</p>

                          {solicitud.Estado === 'autorizada' && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-green-800 font-medium">NIP: {solicitud.NIP}</p>
                                  <p className="text-green-700 text-xs">
                                    Autorizado: {formatearFecha(solicitud.Fecha_Hora_Aprobacion)}
                                  </p>
                                </div>
                                {solicitud.Fecha_Expiracion && (
                                  <TiempoRestante fechaExpiracion={solicitud.Fecha_Expiracion} />
                                )}
                              </div>
                              {solicitud.Salida_Autorizada_Por_Vigilante && (
                                <p className="text-green-700 text-xs mt-2">
                                  ✓ Salida autorizada por: {solicitud.Salida_Autorizada_Por_Vigilante}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Estado En Salida */}
                          {solicitud.Estado === 'en_salida' && (
                            <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                                  EN SALIDA
                                </span>
                              </div>
                              <p className="text-orange-800 font-medium">NIP: {solicitud.NIP}</p>
                              <p className="text-orange-700 text-xs">
                                Salida autorizada por: {solicitud.Salida_Autorizada_Por_Vigilante}
                              </p>
                            </div>
                          )}

                          {/* Estado Regresada */}
                          {solicitud.Estado === 'regresada' && solicitud.Fecha_Hora_Regreso && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                                  REGRESADO
                                </span>
                              </div>
                              <p className="text-blue-800 font-medium">NIP: {solicitud.NIP}</p>
                              <p className="text-blue-700 text-xs">
                                Salida autorizada por: {solicitud.Salida_Autorizada_Por_Vigilante}
                              </p>
                              <p className="text-blue-700 text-xs mt-1">
                                ✈ Regreso registrado: {formatearFecha(solicitud.Fecha_Hora_Regreso)}
                              </p>
                              {solicitud.Duracion_Fuera && (
                                <p className="text-blue-900 font-bold text-sm mt-2">
                                  ⏱ Tiempo fuera: {solicitud.Duracion_Fuera}
                                </p>
                              )}
                            </div>
                          )}

                          {solicitud.Estado === 'rechazada' && solicitud.Supervisor_Aprobador && (
                            <div className="mt-2 p-2 bg-red-50 rounded">
                              <p className="text-red-700 text-xs">
                                Rechazado por: {solicitud.Supervisor_Aprobador} - {formatearFecha(solicitud.Fecha_Hora_Aprobacion)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  {solicitud.Estado === 'pendiente' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleAutorizar(solicitud.ID, 'autorizar')}
                        disabled={isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Autorizar
                      </button>
                      <button
                        onClick={() => handleAutorizar(solicitud.ID, 'rechazar')}
                        disabled={isLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;