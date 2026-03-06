import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Eye, Hash, CheckCircle, XCircle, Clock, User, RefreshCw, AlertCircle, LogIn } from 'lucide-react';

const VigilanteDashboard: React.FC = () => {
  const { usuario, validarNIP, autorizarSalidaFisica, registrarRegreso, actualizarSolicitudes, isLoading, error } = useApp();
  const [nip, setNip] = useState('');
  const [nipValidado, setNipValidado] = useState<any>(null);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error' | 'info'>('info');
  const [modoRegistro, setModoRegistro] = useState<'salida' | 'regreso'>('salida');

  const handleDigitoPress = (digito: string) => {
    if (nip.length < 4) {
      setNip(prev => prev + digito);
    }
  };

  const handleLimpiar = () => {
    setNip('');
    setNipValidado(null);
    setMensaje('');
  };

  const handleBorrar = () => {
    setNip(prev => prev.slice(0, -1));
  };

  const handleValidarNIP = async () => {
    if (nip.length !== 4) {
      setMensaje('El NIP debe tener 4 dígitos');
      setTipoMensaje('error');
      return;
    }

    try {
      const resultado = await validarNIP(nip);
      
      // Si estamos en modo regreso y el resultado indica que está en salida
      if (modoRegistro === 'regreso') {
        if (resultado.enSalida) {
          setNipValidado(resultado);
          setMensaje('Colaborador encontrado. Puede registrar su regreso.');
          setTipoMensaje('exito');
        } else if (resultado.estado === 'regresada') {
          setMensaje('Este colaborador ya ha regresado anteriormente');
          setTipoMensaje('error');
          setNipValidado(null);
        } else {
          setMensaje(resultado.error || 'NIP no corresponde a una salida activa');
          setTipoMensaje('error');
          setNipValidado(null);
        }
        return;
      }
      
      // Modo salida original
      if (resultado.valido) {
        setNipValidado(resultado);
        setMensaje('NIP válido. Puede autorizar la salida.');
        setTipoMensaje('exito');
      } else {
        setMensaje(resultado.error || 'NIP no válido');
        setTipoMensaje('error');
        setNipValidado(null);
      }
    } catch (err) {
      setMensaje('Error al validar NIP');
      setTipoMensaje('error');
      setNipValidado(null);
    }
  };

  const handleAutorizarSalida = async () => {
    if (!nipValidado || nip.length !== 4) return;

    const confirmacion = window.confirm(
      `¿Autorizar salida para ${nipValidado.empleado}?\n\nMotivo: ${nipValidado.motivo}`
    );

    if (confirmacion) {
      try {
        const exito = await autorizarSalidaFisica(nip);
        if (exito) {
          setMensaje(`Salida autorizada exitosamente para ${nipValidado.empleado}`);
          setTipoMensaje('exito');
          handleLimpiar();
        }
      } catch (err) {
        setMensaje('Error al autorizar salida');
        setTipoMensaje('error');
      }
    }
  };

  const handleRegistrarRegreso = async () => {
    if (!nipValidado || nip.length !== 4) return;

    const confirmacion = window.confirm(
      `¿Registrar regreso de ${nipValidado.empleado}?\n\nMotivo de salida: ${nipValidado.motivo}`
    );

    if (confirmacion) {
      try {
        const exito = await registrarRegreso(nip);
        if (exito) {
          setMensaje(`Regreso registrado exitosamente para ${nipValidado.empleado}`);
          setTipoMensaje('exito');
          handleLimpiar();
          await actualizarSolicitudes();
        }
      } catch (err) {
        setMensaje('Error al registrar regreso');
        setTipoMensaje('error');
      }
    }
  };

  const TiempoRestante: React.FC<{ tiempoMinutos: number }> = ({ tiempoMinutos }) => {
    const [tiempo, setTiempo] = useState(tiempoMinutos);

    useEffect(() => {
      setTiempo(tiempoMinutos);
      
      const interval = setInterval(() => {
        setTiempo(prev => Math.max(0, prev - 1/60)); // Actualizar cada segundo
      }, 1000);

      return () => clearInterval(interval);
    }, [tiempoMinutos]);

    const minutos = Math.floor(tiempo);
    const segundos = Math.floor((tiempo % 1) * 60);

    if (tiempo <= 0) {
      return (
        <div className="text-red-600 font-bold text-center">
          <div className="text-2xl">EXPIRADO</div>
        </div>
      );
    }

    const color = tiempo <= 2 ? 'text-red-600' : tiempo <= 5 ? 'text-yellow-600' : 'text-green-600';

    return (
      <div className={`font-bold text-center ${color}`}>
        <div className="text-3xl">
          {minutos}:{segundos.toString().padStart(2, '0')}
        </div>
        <div className="text-sm opacity-75">minutos restantes</div>
      </div>
    );
  };

  const digitos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Control de Acceso</h1>
            <p className="text-gray-600">Validación de pases de salida - {usuario?.nombre}</p>
          </div>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Selector de Modo */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm font-medium text-gray-700">Modo de operación:</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModoRegistro('salida');
                handleLimpiar();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                modoRegistro === 'salida'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Autorizar Salida
            </button>
            <button
              onClick={() => {
                setModoRegistro('regreso');
                handleLimpiar();
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                modoRegistro === 'regreso'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <LogIn className="h-4 w-4" />
              Registrar Regreso
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Ingreso de NIP */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center mb-6">
            <Hash className={`h-12 w-12 mx-auto mb-3 ${modoRegistro === 'regreso' ? 'text-orange-600' : 'text-gray-600'}`} />
            <h2 className="text-lg font-bold text-gray-900">
              {modoRegistro === 'salida' ? 'Autorizar Salida' : 'Registrar Regreso'}
            </h2>
            <p className="text-gray-600">
              {modoRegistro === 'salida' 
                ? 'Ingresa el NIP del empleado que sale' 
                : 'Ingresa el NIP del empleado que regresa'}
            </p>
          </div>

          {/* Display del NIP */}
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-16 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-2xl font-bold"
                >
                  {nip[index] ? '•' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {digitos.map((digito) => (
              <button
                key={digito}
                onClick={() => handleDigitoPress(digito)}
                disabled={nip.length >= 4}
                className="h-14 bg-gray-200 hover:bg-gray-300 text-xl font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {digito}
              </button>
            ))}
          </div>

          {/* Botones de Control */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleBorrar}
              className="h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
            >
              Borrar
            </button>
            <button
              onClick={handleLimpiar}
              className="h-12 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </div>

          {/* Botón Validar */}
          <button
            onClick={handleValidarNIP}
            disabled={nip.length !== 4 || isLoading}
            className={`w-full h-14 text-white font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              modoRegistro === 'regreso' 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : modoRegistro === 'regreso' ? (
              <LogIn className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {isLoading ? 'Validando...' : modoRegistro === 'regreso' ? 'Buscar Colaborador' : 'Validar NIP'}
          </button>
        </div>

        {/* Panel de Información y Resultado */}
        <div className="space-y-6">
          {/* Mensaje de Estado */}
          {mensaje && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${
              tipoMensaje === 'exito' ? 'bg-green-50 border border-green-200' :
              tipoMensaje === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              {tipoMensaje === 'exito' ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : tipoMensaje === 'error' ? (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={`font-medium ${
                tipoMensaje === 'exito' ? 'text-green-800' :
                tipoMensaje === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {mensaje}
              </p>
            </div>
          )}

          {/* Información del Pase Validado */}
          {nipValidado && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pase Válido</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Empleado:</div>
                  <div className="text-lg font-bold text-gray-900">{nipValidado.empleado}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Motivo:</div>
                  <div className="text-gray-900">{nipValidado.motivo}</div>
                </div>

                {nipValidado.tiempoRestante > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-3">Tiempo Restante:</div>
                    <TiempoRestante tiempoMinutos={nipValidado.tiempoRestante} />
                  </div>
                )}
              </div>

              {/* Botón de Acción según modo */}
              {modoRegistro === 'salida' ? (
                nipValidado.tiempoRestante > 0 && (
                  <button
                    onClick={handleAutorizarSalida}
                    disabled={isLoading}
                    className="w-full mt-6 h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    {isLoading ? 'Autorizando...' : 'Autorizar Salida Física'}
                  </button>
                )
              ) : (
                nipValidado && (
                  <button
                    onClick={handleRegistrarRegreso}
                    disabled={isLoading}
                    className="w-full mt-6 h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}
                    {isLoading ? 'Registrando...' : 'Registrar Regreso'}
                  </button>
                )
              )}
            </div>
          )}

          {/* Instrucciones */}
          {!nipValidado && !mensaje && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-3">Instrucciones:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                <li>Solicita al empleado su NIP de 4 dígitos</li>
                <li>Ingresa el NIP usando el teclado numérico</li>
                <li>Presiona "Validar NIP" para verificar</li>
                <li>Si es válido, autoriza la salida física</li>
                <li>El sistema registrará automáticamente la salida</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VigilanteDashboard;