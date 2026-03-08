import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDocs,
  limit,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

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
  Fecha_Hora_Salida_Fisica?: string;
  Fecha_Hora_Regreso?: string;
  Duracion_Fuera?: string;
  TTL_Expiration?: any;
}

export interface AppContextType {
  usuario: Usuario | null;
  solicitudes: Solicitud[];
  isLoading: boolean;
  error: string | null;
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

// Función para exportar a Excel
export const exportarExcel = (solicitudes: Solicitud[], nombreArchivo: string = 'reporte_pases_salida') => {
  const encabezados = [
    'ID', 'Nombre', 'Motivo', 'Fecha_Hora_Solicitud', 'Estado',
    'Supervisor_Aprobador', 'Fecha_Hora_Aprobacion', 'NIP',
    'Fecha_Expiracion', 'Salida_Fisica', 'Vigilante', 'Fecha_Hora_Regreso', 'Duracion'
  ];

  const filas = solicitudes.map(s => [
    s.ID, s.Nombre, s.Motivo, s.Fecha_Hora_Solicitud, s.Estado,
    s.Supervisor_Aprobador || '', s.Fecha_Hora_Aprobacion || '', s.NIP || '',
    s.Fecha_Expiracion || '', s.Fecha_Hora_Salida_Fisica || '', s.Salida_Autorizada_Por_Vigilante || '', s.Fecha_Hora_Regreso || '', s.Duracion_Fuera || ''
  ]);

  const contenidoCSV = [
    encabezados.join(','),
    ...filas.map(fila => fila.map(celda => `"${celda}"`).join(','))
  ].join('\n');

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

// Usuarios por defecto para simular login
const DEFAULT_USUARIOS = [
  { nombre: 'Juan Pérez', rol: 'colaborador' as const, activo: true },
  { nombre: 'Carlos Supervisor', rol: 'supervisor' as const, activo: true },
  { nombre: 'Pedro Vigilante', rol: 'vigilante' as const, activo: true }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios en Firestore en tiempo real
  useEffect(() => {
    if (!usuario) {
      setSolicitudes([]);
      return;
    }

    setIsLoading(true);
    let q = query(collection(db, "solicitudes"), orderBy("Fecha_Hora_Solicitud", "desc"));

    if (usuario.rol === 'colaborador') {
      // Quitamos el orderBy de aquí para NO requerir un índice compuesto en Firebase
      q = query(collection(db, "solicitudes"), where("Nombre", "==", usuario.nombre));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: Solicitud[] = [];
      const ahora = new Date();

      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();

        // Manejar fechas de Firebase Timestamp a ISO String
        const solicitud = {
          ...item,
          ID: item.ID || docSnap.id,
          Fecha_Hora_Solicitud: item.Fecha_Hora_Solicitud?.toDate?.()?.toISOString() || item.Fecha_Hora_Solicitud,
          Fecha_Hora_Aprobacion: item.Fecha_Hora_Aprobacion?.toDate?.()?.toISOString() || item.Fecha_Hora_Aprobacion,
          Fecha_Expiracion: item.Fecha_Expiracion?.toDate?.()?.toISOString() || item.Fecha_Expiracion,
          Fecha_Hora_Salida_Fisica: item.Fecha_Hora_Salida_Fisica?.toDate?.()?.toISOString() || item.Fecha_Hora_Salida_Fisica,
          Fecha_Hora_Regreso: item.Fecha_Hora_Regreso?.toDate?.()?.toISOString() || item.Fecha_Hora_Regreso,
          Duracion_Fuera: item.Duracion_Fuera,
        } as Solicitud;

        // Auto-expirar si el tiempo pasó
        if (solicitud.Estado === 'autorizada' && solicitud.Fecha_Expiracion) {
          if (ahora > new Date(solicitud.Fecha_Expiracion)) {
            solicitud.Estado = 'expirada';
            updateDoc(doc(db, "solicitudes", docSnap.id), { Estado: 'expirada' });
          }
        }

        data.push(solicitud);
      });

      // Ordenar manualmente por fecha (más reciente primero) para evitar errores de índice en Firebase
      data.sort((a, b) => new Date(b.Fecha_Hora_Solicitud).getTime() - new Date(a.Fecha_Hora_Solicitud).getTime());

      setSolicitudes(data);
      setIsLoading(false);
    }, (err) => {
      console.error("Error en Snapshot:", err);
      setError("Error al conectar con la base de datos");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  const actualizarSolicitudes = async () => {
    // onSnapshot ya maneja la actualización automática
  };

  const crearSolicitud = async (motivo: string): Promise<boolean> => {
    if (!usuario) return false;
    try {
      setIsLoading(true);
      await addDoc(collection(db, "solicitudes"), {
        Nombre: usuario.nombre,
        Motivo: motivo,
        Fecha_Hora_Solicitud: serverTimestamp(),
        Estado: 'pendiente',
        ID: `PS-${Date.now().toString().slice(-6)}`,
        TTL_Expiration: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días para depuración automática
      });
      return true;
    } catch (err) {
      console.error(err);
      setError("Error al crear solicitud");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const autorizarSolicitud = async (id: string, decision: 'autorizar' | 'rechazar'): Promise<boolean> => {
    if (!usuario || usuario.rol !== 'supervisor') return false;
    try {
      setIsLoading(true);
      const q = query(collection(db, "solicitudes"), where("ID", "==", id), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) throw new Error("Solicitud no encontrada");

      const docRef = querySnapshot.docs[0].ref;
      const data: any = {
        Estado: decision === 'autorizar' ? 'autorizada' : 'rechazada',
        Supervisor_Aprobador: usuario.nombre,
        Fecha_Hora_Aprobacion: serverTimestamp()
      };

      if (decision === 'autorizar') {
        data.NIP = Math.floor(1000 + Math.random() * 9000).toString();
        data.Fecha_Expiracion = Timestamp.fromDate(new Date(Date.now() + 15 * 60000)); // 15 min
      }

      await updateDoc(docRef, data);
      return true;
    } catch (err) {
      console.error(err);
      setError("Error al procesar solicitud");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validarNIP = async (nip: string) => {
    try {
      const q = query(collection(db, "solicitudes"), where("NIP", "==", nip), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return { valido: false, error: 'NIP no encontrado' };

      const solicitud = querySnapshot.docs[0].data() as Solicitud;
      const ahora = new Date();
      const fechaExp = solicitud.Fecha_Expiracion ? (solicitud.Fecha_Expiracion as any).toDate() : null;

      if (solicitud.Estado === 'regresada') return { valido: false, error: 'Colaborador ya regresó' };
      if (fechaExp && ahora > fechaExp && solicitud.Estado !== 'en_salida') return { valido: false, error: 'NIP expirado' };

      return {
        valido: true,
        empleado: solicitud.Nombre,
        motivo: solicitud.Motivo,
        enSalida: solicitud.Estado === 'en_salida',
        tiempoRestante: fechaExp ? Math.max(0, Math.ceil((fechaExp.getTime() - ahora.getTime()) / 60000)) : 0
      };
    } catch (err) {
      setError("Error al validar NIP");
      throw err;
    }
  };

  const autorizarSalidaFisica = async (nip: string): Promise<boolean> => {
    if (!usuario || usuario.rol !== 'vigilante') return false;
    try {
      const q = query(collection(db, "solicitudes"), where("NIP", "==", nip), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return false;

      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        Estado: 'en_salida',
        Salida_Autorizada_Por_Vigilante: usuario.nombre,
        Fecha_Hora_Salida_Fisica: serverTimestamp()
      });
      return true;
    } catch (err) {
      setError("Error al autorizar salida");
      return false;
    }
  };

  const registrarRegreso = async (nip: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "solicitudes"), where("NIP", "==", nip), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return false;

      const docRef = querySnapshot.docs[0].ref;
      const solicitud = querySnapshot.docs[0].data();
      const horaSalida = solicitud.Fecha_Hora_Salida_Fisica?.toDate?.() || new Date();
      const horaRegreso = new Date();

      const diffMs = horaRegreso.getTime() - horaSalida.getTime();
      const diffMin = Math.round(diffMs / 60000);
      const duracion = diffMin < 60 ? `${diffMin} min` : `${Math.floor(diffMin / 60)}h ${diffMin % 60}min`;

      await updateDoc(docRef, {
        Estado: 'regresada',
        Fecha_Hora_Regreso: serverTimestamp(),
        Duracion_Fuera: duracion
      });
      return true;
    } catch (err) {
      setError("Error al registrar regreso");
      return false;
    }
  };

  const verificarUsuario = async (nombre: string, rol: string): Promise<boolean> => {
    const userFound = DEFAULT_USUARIOS.find(u => u.nombre.toLowerCase() === nombre.toLowerCase() && u.rol === rol);
    if (userFound) {
      setUsuario(userFound);
      return true;
    }
    setError("Usuario no registrado en el sistema local");
    return false;
  };

  const clearError = () => setError(null);

  return (
    <AppContext.Provider value={{
      usuario, solicitudes, isLoading, error,
      setUsuario, actualizarSolicitudes, crearSolicitud,
      autorizarSolicitud, validarNIP, autorizarSalidaFisica,
      clearError, verificarUsuario, registrarRegreso, exportarExcel
    }}>
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