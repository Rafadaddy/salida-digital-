import React, { createContext, useContext, useState, useEffect } from 'react';

// Tipos TypeScript
export interface Usuario {
  nombre: string;
  rol: 'colaborador' | 'supervisor' | 'vigilante';
  activo: boolean;
  email?: string;
}

export interface Solicitud {
  ID: string;
  Nombre: string;
  Motivo: string;
  Fecha_Hora_Solicitud: string;
  Estado: 'pendiente' | 'autorizada' | 'en_salida' | 'regresada' | 'expirada' | 'rechazada';
  Supervisor_Aprobador?: string;
  Fecha_Hora_Aprobacion?: string;
  NIP?: string;
  Fecha_Expiracion?: string;
  Salida_Autorizada_Por_Vigilante?: string;
  Fecha_Hora_Regreso?: string;
}

export interface AppContextType {
  usuario: Usuario | null;
  solicitudes: Solicitud[];
  isLoading: boolean;
  error: string | null;
  demoMode?: boolean;
  setUsuario: (usuario: Usuario | null) => void;
  actualizarSolicitudes: () => Promise<void>;
  crearSolicitud: (motivo: string) => Promise<boolean>;
  autorizarSolicitud: (id: string, decision: 'autorizar' | 'rechazar') => Promise<boolean>;
  validarNIP: (nip: string) => Promise<any>;
  autorizarSalidaFisica: (nip: string) => Promise<boolean>;
  clearError: () => void;
  verificarUsuario?: (nombre: string, rol: string) => Promise<boolean>;
  registrarRegreso: (nip: string) => Promise<boolean>;
  exportarExcel?: (solicitudes: Solicitud[], nombreArchivo?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

// DATOS DEMO INCORPORADOS PARA FUNCIONAMIENTO INMEDIATO
const DEMO_USUARIOS = [
  { nombre: 'Juan Pérez', rol: 'colaborador' as const, activo: true, email: 'juan.perez@empresa.com' },
  { nombre: 'María González', rol: 'colaborador' as const, activo: true, email: 'maria.gonzalez@empresa.com' },
  { nombre: 'Carlos Supervisor', rol: 'supervisor' as const, activo: true, email: 'carlos.supervisor@empresa.com' },
  { nombre: 'Ana Supervisora', rol: 'supervisor' as const, activo: true, email: 'ana.supervisora@empresa.com' },
  { nombre: 'Pedro Vigilante', rol: 'vigilante' as const, activo: true, email: 'pedro.vigilante@empresa.com' },
  { nombre: 'Luis Seguridad', rol: 'vigilante' as const, activo: true, email: 'luis.seguridad@empresa.com' }
];

// Función para detectar si estamos en modo demo
const isDemoMode = () => {
  return !API_URL || 
         API_URL.trim() === '' || 
         API_URL.includes('CONFIGURAR_SCRIPT_ID_AQUI') || 
         API_URL.includes('AKfycbzYwQlzfF8VcjxFg5yFZt8J7VYGv8N9XvT9QhxUzN2F7M9KwP8L3Q6R4S5T1U2') ||
         API_URL.includes('localhost') ||
         API_URL.includes('ejemplo.com');
};

// Almacenamiento local para modo demo
const getDemoSolicitudes = (): Solicitud[] => {
  const stored = localStorage.getItem('demo_solicitudes');
  if (stored) {
    return JSON.parse(stored);
  }
  // Crear solicitudes de ejemplo si no hay datos
  const solicitudesEjemplo: Solicitud[] = [
    {
      ID: 'PS001',
      Nombre: 'Juan Pérez',
      Motivo: 'Cita médica',
      Fecha_Hora_Solicitud: new Date(Date.now() - 3600000).toISOString(),
      Estado: 'pendiente',
      Supervisor_Aprobador: '',
      Fecha_Hora_Aprobacion: '',
      NIP: '',
      Fecha_Expiracion: '',
      Salida_Autorizada_Por_Vigilante: ''
    },
    {
      ID: 'PS002',
      Nombre: 'María González',
      Motivo: 'Trámite personal',
      Fecha_Hora_Solicitud: new Date(Date.now() - 7200000).toISOString(),
      Estado: 'pendiente',
      Supervisor_Aprobador: '',
      Fecha_Hora_Aprobacion: '',
      NIP: '',
      Fecha_Expiracion: '',
      Salida_Autorizada_Por_Vigilante: ''
    }
  ];
  localStorage.setItem('demo_solicitudes', JSON.stringify(solicitudesEjemplo));
  localStorage.setItem('demo_nextId', '3');
  localStorage.setItem('demo_nextNip', '1002');
  return solicitudesEjemplo;
};

const setDemoSolicitudes = (solicitudes: Solicitud[]) => {
  localStorage.setItem('demo_solicitudes', JSON.stringify(solicitudes));
};

// Función para exportar a Excel
export const exportarExcel = (solicitudes: Solicitud[], nombreArchivo: string = 'reporte_pases_salida') => {
  // Encabezados del CSV
  const encabezados = [
    'ID',
    'Nombre',
    'Motivo',
    'Fecha_Hora_Solicitud',
    'Estado',
    'Supervisor_Aprobador',
    'Fecha_Hora_Aprobacion',
    'NIP',
    'Fecha_Expiracion',
    'Salida_Autorizada_Por_Vigilante',
    'Fecha_Hora_Regreso'
  ];

  // Convertir datos a formato CSV
  const filas = solicitudes.map(s => [
    s.ID,
    s.Nombre,
    s.Motivo,
    s.Fecha_Hora_Solicitud,
    s.Estado,
    s.Supervisor_Aprobador || '',
    s.Fecha_Hora_Aprobacion || '',
    s.NIP || '',
    s.Fecha_Expiracion || '',
    s.Salida_Autorizada_Por_Vigilante || '',
    s.Fecha_Hora_Regreso || ''
  ]);

  // Crear contenido CSV
  const contenidoCSV = [
    encabezados.join(','),
    ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))
  ].join('\n');

  // Crear y descargar archivo
  const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getDemoNextId = (): number => {
  return parseInt(localStorage.getItem('demo_nextId') || '1');
};

const setDemoNextId = (id: number) => {
  localStorage.setItem('demo_nextId', id.toString());
};

// Función para generar NIP aleatorio de 4 dígitos
const generarNIPAleatorio = (): number => {
  // Obtener todos los NIPs existentes
  const solicitudes = getDemoSolicitudes();
  const nipExistentes = new Set(solicitudes.map(s => s.NIP).filter(nip => nip));
  
  // Generar NIP aleatorio entre 1000 y 9999
  let nuevoNIP: number;
  let intentos = 0;
  const maxIntentos = 100; // Evitar bucle infinito
  
  do {
    nuevoNIP = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    intentos++;
  } while (nipExistentes.has(nuevoNIP.toString()) && intentos < maxIntentos);
  
  // Si no se encontró uno único después de muchos intentos, usar timestamp
  if (nipExistentes.has(nuevoNIP.toString())) {
    nuevoNIP = (Date.now() % 9000) + 1000;
  }
  
  return nuevoNIP;
};

const getDemoNextNip = (): number => {
  return parseInt(localStorage.getItem('demo_nextNip') || '1000');
};

const setDemoNextNip = (nip: number) => {
  localStorage.setItem('demo_nextNip', nip.toString());
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode] = useState(isDemoMode());

  // Mostrar modo demo en consola
  useEffect(() => {
    if (demoMode) {
      console.log('%c🔧 MODO DEMO ACTIVADO', 'background: #007acc; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;');
      console.log('%cLa aplicación funciona completamente en modo demo con datos locales.', 'color: #007acc; font-weight: bold;');
      console.log('%cUsuarios disponibles:', 'color: #007acc; font-weight: bold;');
      DEMO_USUARIOS.forEach(u => {
        console.log(`  • ${u.nombre} (${u.rol})`);
      });
    }
  }, [demoMode]);

  // Funciones DEMO
  const verificarUsuarioDemo = async (nombre: string, rol: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay
    
    const usuario = DEMO_USUARIOS.find(u => u.nombre === nombre && u.activo);
    
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    if (usuario.rol !== rol) {
      throw new Error('Rol no autorizado');
    }
    
    return {
      status: 200,
      data: { 
        valido: true, 
        usuario: {
          nombre: usuario.nombre,
          rol: usuario.rol,
          activo: usuario.activo,
          email: usuario.email
        }
      }
    };
  };

  const crearSolicitudDemo = async (nombre: string, motivo: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const usuario = DEMO_USUARIOS.find(u => u.nombre === nombre && u.activo);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    const solicitudes = getDemoSolicitudes();
    const nextId = getDemoNextId();
    
    const nuevaSolicitud: Solicitud = {
      ID: `PS${Date.now()}${nextId}`,
      Nombre: nombre,
      Motivo: motivo,
      Fecha_Hora_Solicitud: new Date().toISOString(),
      Estado: 'pendiente',
      Supervisor_Aprobador: '',
      Fecha_Hora_Aprobacion: '',
      NIP: '',
      Fecha_Expiracion: '',
      Salida_Autorizada_Por_Vigilante: ''
    };
    
    solicitudes.push(nuevaSolicitud);
    setDemoSolicitudes(solicitudes);
    setDemoNextId(nextId + 1);
    
    return {
      status: 200,
      data: {
        exito: true,
        id: nuevaSolicitud.ID,
        mensaje: 'Solicitud creada exitosamente (MODO DEMO)'
      }
    };
  };

  const autorizarSolicitudDemo = async (id: string, supervisor: string, decision: 'autorizar' | 'rechazar'): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const solicitudes = getDemoSolicitudes();
    const solicitud = solicitudes.find(s => s.ID === id);
    
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }
    
    const timestamp = new Date();
    
    if (decision === 'autorizar') {
      const nipAleatorio = generarNIPAleatorio();
      const nip = nipAleatorio.toString();
      const fechaExpiracion = new Date(timestamp.getTime() + 10 * 60000); // 10 minutos
      
      solicitud.Estado = 'autorizada';
      solicitud.Supervisor_Aprobador = supervisor;
      solicitud.Fecha_Hora_Aprobacion = timestamp.toISOString();
      solicitud.NIP = nip;
      solicitud.Fecha_Expiracion = fechaExpiracion.toISOString();
      
      setDemoSolicitudes(solicitudes);
      
      return {
        status: 200,
        data: {
          exito: true,
          nip: nip,
          fechaExpiracion: fechaExpiracion.toISOString(),
          mensaje: 'Solicitud autorizada exitosamente (MODO DEMO)'
        }
      };
    } else {
      solicitud.Estado = 'rechazada';
      solicitud.Supervisor_Aprobador = supervisor;
      solicitud.Fecha_Hora_Aprobacion = timestamp.toISOString();
      
      setDemoSolicitudes(solicitudes);
      
      return {
        status: 200,
        data: {
          exito: true,
          mensaje: 'Solicitud rechazada (MODO DEMO)'
        }
      };
    }
  };

  const validarNIPDemo = async (nip: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const solicitudes = getDemoSolicitudes();
    const solicitud = solicitudes.find(s => s.NIP === nip);
    
    if (!solicitud) {
      return { valido: false, error: 'NIP no encontrado' };
    }
    
    const ahora = new Date();
    const fechaExpiracion = new Date(solicitud.Fecha_Expiracion!);
    
    if (ahora > fechaExpiracion) {
      solicitud.Estado = 'expirada';
      setDemoSolicitudes(solicitudes);
      return { 
        valido: false, 
        error: 'NIP expirado',
        tiempoRestante: 0
      };
    }
    
    if (solicitud.Estado === 'regresada') {
      return { 
        valido: false, 
        error: 'NIP ya utilizado - Colaborador ya ha regresado',
        estado: 'regresada'
      };
    }
    
    if (solicitud.Estado === 'en_salida') {
      return {
        valido: true,
        enSalida: true,
        empleado: solicitud.Nombre,
        motivo: solicitud.Motivo,
        tiempoRestante: 0,
        mensaje: 'Colaborador está en salida - puede registrar regreso'
      };
    }
    
    if (solicitud.Salida_Autorizada_Por_Vigilante) {
      return { 
        valido: false, 
        error: 'NIP ya utilizado'
      };
    }
    
    const tiempoRestante = Math.ceil((fechaExpiracion.getTime() - ahora.getTime()) / 60000);
    
    return {
      valido: true,
      empleado: solicitud.Nombre,
      motivo: solicitud.Motivo,
      tiempoRestante: tiempoRestante
    };
  };

  const autorizarSalidaFisicaDemo = async (nip: string, vigilante: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const solicitudes = getDemoSolicitudes();
    const solicitud = solicitudes.find(s => s.NIP === nip);
    
    if (!solicitud) {
      throw new Error('NIP no válido');
    }
    
    const ahora = new Date();
    const fechaExpiracion = new Date(solicitud.Fecha_Expiracion!);
    
    if (ahora > fechaExpiracion) {
      solicitud.Estado = 'expirada';
      setDemoSolicitudes(solicitudes);
      throw new Error('NIP expirado');
    }
    
    if (solicitud.Salida_Autorizada_Por_Vigilante) {
      throw new Error('NIP ya fue utilizado');
    }
    
    solicitud.Salida_Autorizada_Por_Vigilante = vigilante;
    solicitud.Estado = 'en_salida';
    const tiempoRestante = Math.ceil((fechaExpiracion.getTime() - ahora.getTime()) / 60000);
    setDemoSolicitudes(solicitudes);
    
    return {
      status: 200,
      data: {
        exito: true,
        empleado: solicitud.Nombre,
        motivo: solicitud.Motivo,
        tiempoRestante: tiempoRestante,
        mensaje: 'Salida autorizada exitosamente (MODO DEMO)'
      }
    };
  };

  const registrarRegresoDemo = async (nip: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const solicitudes = getDemoSolicitudes();
    const solicitud = solicitudes.find(s => s.NIP === nip);
    
    if (!solicitud) {
      throw new Error('NIP no válido');
    }
    
    // Verificar que la persona está en salida (tiene salida autorizada pero no ha regresado)
    if (!solicitud.Salida_Autorizada_Por_Vigilante) {
      throw new Error('El NIP no corresponde a una salida registrada');
    }
    
    if (solicitud.Estado === 'regresada') {
      throw new Error('El colaborador ya ha regresado anteriormente');
    }
    
    // Registrar fecha/hora de regreso
    solicitud.Estado = 'regresada';
    solicitud.Fecha_Hora_Regreso = new Date().toISOString();
    setDemoSolicitudes(solicitudes);
    
    // Calcular tiempo de ausencia
    const salidaTimestamp = new Date(solicitud.Fecha_Hora_Aprobacion || solicitud.Fecha_Hora_Solicitud);
    const regresoTimestamp = new Date(solicitud.Fecha_Hora_Regreso);
    const tiempoAusencia = Math.round((regresoTimestamp.getTime() - salidaTimestamp.getTime()) / 60000); // Minutos
    
    return {
      status: 200,
      data: {
        exito: true,
        empleado: solicitud.Nombre,
        motivo: solicitud.Motivo,
        fechaHoraRegreso: solicitud.Fecha_Hora_Regreso,
        tiempoAusencia: tiempoAusencia,
        mensaje: 'Registro de regreso exitoso (MODO DEMO)'
      }
    };
  };

  const obtenerSolicitudesDemo = async (rol: string, empleado?: string, estado?: string): Promise<Solicitud[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let solicitudes = getDemoSolicitudes();
    
    // Solo filtrar por empleado si es un colaborador viendo sus propias solicitudes
    if (rol === 'colaborador' && empleado) {
      solicitudes = solicitudes.filter(s => s.Nombre === empleado);
    }
    // Supervisores y vigilantes ven todas las solicitudes (o filtrar por estado si se especifica)
    
    if (estado && estado !== 'todos') {
      solicitudes = solicitudes.filter(s => s.Estado === estado);
    }
    
    // Verificar expiraciones
    const ahora = new Date();
    let dataChanged = false;
    solicitudes.forEach(s => {
      if (s.Estado === 'autorizada' && s.Fecha_Expiracion) {
        const fechaExp = new Date(s.Fecha_Expiracion);
        if (ahora > fechaExp && !s.Salida_Autorizada_Por_Vigilante) {
          s.Estado = 'expirada';
          dataChanged = true;
        }
      }
    });
    
    if (dataChanged) {
      setDemoSolicitudes(solicitudes);
    }
    
    return solicitudes;
  };

  // Función para realizar peticiones (modo real o demo)
  const apiCall = async (endpoint: string, options?: any) => {
    if (demoMode) {
      // MODO DEMO: Usar funciones locales completamente
      if (options?.method === 'POST') {
        const data = JSON.parse(options.body);
        switch (data.accion) {
          case 'verificar_usuario':
            return await verificarUsuarioDemo(data.nombre, data.rol);
          case 'crear_solicitud':
            return await crearSolicitudDemo(data.nombre, data.motivo);
          case 'autorizar_solicitud':
            return await autorizarSolicitudDemo(data.id, data.supervisor, data.decision);
          case 'autorizar_salida_fisica':
            return await autorizarSalidaFisicaDemo(data.nip, data.vigilante);
          case 'registrar_regreso':
            return await registrarRegresoDemo(data.nip);
          default:
            throw new Error('Acción no válida en modo demo');
        }
      } else {
        const url = new URL(endpoint, 'http://localhost'); // Base URL fake para parsing
        const params = Object.fromEntries(url.searchParams);
        switch (params.accion) {
          case 'validar_nip':
            const resultNip = await validarNIPDemo(params.nip);
            return { status: 200, data: resultNip };
          default:
            throw new Error('Acción no válida en modo demo');
        }
      }
    } else {
      // MODO REAL: Hacer request HTTP
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    }
  };

  // Actualizar solicitudes según el rol del usuario
  const actualizarSolicitudes = async () => {
    if (!usuario) return;

    try {
      setIsLoading(true);
      setError(null);

      let solicitudesData: Solicitud[];
      
      if (demoMode) {
        solicitudesData = await obtenerSolicitudesDemo(usuario.rol, usuario.nombre);
      } else {
        let params: Record<string, string> = {
          accion: 'obtener_solicitudes',
          rol: usuario.rol,
        };

        if (usuario.rol === 'colaborador') {
          params.empleado = usuario.nombre;
        }

        const url = new URL(API_URL);
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });

        const result = await apiCall(url.toString());
        if (result.status !== 200) {
          throw new Error(result.data?.error || 'Error en la petición');
        }
        solicitudesData = result.data.solicitudes || [];
      }
      
      setSolicitudes(solicitudesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva solicitud
  const crearSolicitud = async (motivo: string): Promise<boolean> => {
    if (!usuario) return false;

    try {
      setIsLoading(true);
      setError(null);

      const result = await apiCall(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion: 'crear_solicitud',
          nombre: usuario.nombre,
          motivo: motivo,
        }),
      });

      if (result.status !== 200) {
        throw new Error(result.data?.error || 'Error al crear solicitud');
      }

      await actualizarSolicitudes();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear solicitud');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Autorizar o rechazar solicitud
  const autorizarSolicitud = async (id: string, decision: 'autorizar' | 'rechazar'): Promise<boolean> => {
    if (!usuario || usuario.rol !== 'supervisor') return false;

    try {
      setIsLoading(true);
      setError(null);

      const result = await apiCall(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion: 'autorizar_solicitud',
          id: id,
          supervisor: usuario.nombre,
          decision: decision,
        }),
      });

      if (result.status !== 200) {
        throw new Error(result.data?.error || 'Error al procesar solicitud');
      }

      await actualizarSolicitudes();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar solicitud');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Validar NIP
  const validarNIP = async (nip: string) => {
    try {
      setError(null);
      
      if (demoMode) {
        return await validarNIPDemo(nip);
      } else {
        const url = new URL(API_URL);
        url.searchParams.append('accion', 'validar_nip');
        url.searchParams.append('nip', nip);
        
        const result = await apiCall(url.toString());
        if (result.status !== 200) {
          throw new Error(result.data?.error || 'Error al validar NIP');
        }
        return result.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar NIP');
      throw err;
    }
  };

  // Autorizar salida física
  const autorizarSalidaFisica = async (nip: string): Promise<boolean> => {
    if (!usuario || usuario.rol !== 'vigilante') return false;

    try {
      setIsLoading(true);
      setError(null);

      const result = await apiCall(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion: 'autorizar_salida_fisica',
          nip: nip,
          vigilante: usuario.nombre,
        }),
      });

      if (result.status !== 200) {
        throw new Error(result.data?.error || 'Error al autorizar salida');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al autorizar salida');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Registrar regreso de colaborador
  const registrarRegreso = async (nip: string): Promise<boolean> => {
    if (!usuario) return false;

    try {
      setIsLoading(true);
      setError(null);

      const result = await apiCall(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion: 'registrar_regreso',
          nip: nip,
        }),
      });

      if (result.status !== 200) {
        throw new Error(result.data?.error || 'Error al registrar regreso');
      }

      await actualizarSolicitudes();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar regreso');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Función universal para verificar usuario (demo y real)
  const verificarUsuario = async (nombre: string, rol: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      clearError();
      
      const result = await apiCall(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accion: 'verificar_usuario',
          nombre: nombre.trim(),
          rol: rol,
        }),
      });
      
      if (result.status === 200 && result.data.valido) {
        setUsuario({
          nombre: nombre.trim(),
          rol: rol as any,
          activo: true,
          email: result.data.usuario?.email,
        });
        return true;
      } else {
        throw new Error(result.data?.error || 'Usuario no autorizado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de autenticación';
      setError(errorMessage);
      console.error('Error de autenticación:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar solicitudes cuando el usuario cambia
  useEffect(() => {
    if (usuario) {
      actualizarSolicitudes();
    } else {
      setSolicitudes([]);
    }
  }, [usuario]);

  const value: AppContextType = {
    usuario,
    solicitudes,
    isLoading,
    error,
    demoMode,
    setUsuario,
    actualizarSolicitudes,
    crearSolicitud,
    autorizarSolicitud,
    validarNIP,
    autorizarSalidaFisica,
    clearError,
    verificarUsuario,
    registrarRegreso,
    exportarExcel,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}