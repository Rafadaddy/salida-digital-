/**
 * BACKEND TEMPORAL - SIMULACIÓN FUNCIONAL
 * Este código simula el backend hasta que se configure Google Apps Script real
 */

// Simulación de datos para testing inmediato
const simulateBackend = {
  usuarios: [
    { nombre: 'Juan Pérez', rol: 'colaborador', activo: true, email: 'juan.perez@empresa.com' },
    { nombre: 'María González', rol: 'colaborador', activo: true, email: 'maria.gonzalez@empresa.com' },
    { nombre: 'Carlos Supervisor', rol: 'supervisor', activo: true, email: 'carlos.supervisor@empresa.com' },
    { nombre: 'Ana Supervisora', rol: 'supervisor', activo: true, email: 'ana.supervisora@empresa.com' },
    { nombre: 'Pedro Vigilante', rol: 'vigilante', activo: true, email: 'pedro.vigilante@empresa.com' },
    { nombre: 'Luis Seguridad', rol: 'vigilante', activo: true, email: 'luis.seguridad@empresa.com' }
  ],
  solicitudes: JSON.parse(localStorage.getItem('demo_solicitudes') || '[]'),
  nextId: parseInt(localStorage.getItem('demo_nextId') || '1'),
  nextNip: parseInt(localStorage.getItem('demo_nextNip') || '1000')
};

// Guardar datos en localStorage para persistencia
const saveData = () => {
  localStorage.setItem('demo_solicitudes', JSON.stringify(simulateBackend.solicitudes));
  localStorage.setItem('demo_nextId', simulateBackend.nextId.toString());
  localStorage.setItem('demo_nextNip', simulateBackend.nextNip.toString());
};

// Simulación de fetch para el backend demo
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  // Interceptar solo requests al backend
  if (url.includes('script.google.com')) {
    console.log('🔧 MODO DEMO: Interceptando request al backend', { url, options });
    return simulateBackendResponse(url, options);
  }
  return originalFetch.apply(this, arguments);
};

async function simulateBackendResponse(url, options) {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  
  try {
    let response;
    
    if (options && options.method === 'POST') {
      const body = JSON.parse(options.body);
      response = handlePostRequest(body);
    } else {
      const urlObj = new URL(url);
      const params = Object.fromEntries(urlObj.searchParams);
      response = handleGetRequest(params);
    }
    
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(response)
    };
  } catch (error) {
    console.error('Error en simulación backend:', error);
    return {
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        status: 500,
        data: { error: error.message },
        timestamp: new Date().toISOString()
      })
    };
  }
}

function handleGetRequest(params) {
  switch (params.accion) {
    case 'obtener_solicitudes':
      return obtenerSolicitudesDemo(params.rol, params.empleado, params.estado);
    case 'validar_nip':
      return validarNIPDemo(params.nip);
    case 'obtener_estado_solicitud':
      return obtenerEstadoSolicitudDemo(params.id, params.empleado);
    default:
      return { status: 400, data: { error: 'Acción no válida' } };
  }
}

function handlePostRequest(data) {
  switch (data.accion) {
    case 'crear_solicitud':
      return crearSolicitudDemo(data);
    case 'autorizar_solicitud':
      return autorizarSolicitudDemo(data.id, data.supervisor, data.decision);
    case 'autorizar_salida_fisica':
      return autorizarSalidaFisicaDemo(data.nip, data.vigilante);
    case 'verificar_usuario':
      return verificarUsuarioDemo(data.nombre, data.rol);
    default:
      return { status: 400, data: { error: 'Acción no válida' } };
  }
}

function verificarUsuarioDemo(nombre, rolEsperado) {
  const usuario = simulateBackend.usuarios.find(u => u.nombre === nombre && u.activo);
  
  if (!usuario) {
    return {
      status: 200,
      data: { valido: false, error: 'Usuario no encontrado' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  if (usuario.rol !== rolEsperado) {
    return {
      status: 200,
      data: { valido: false, error: 'Rol no autorizado' },
      timestamp: new Date().toISOString(),
      demo: true
    };
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
    },
    timestamp: new Date().toISOString(),
    demo: true
  };
}

function crearSolicitudDemo(datos) {
  const usuario = simulateBackend.usuarios.find(u => u.nombre === datos.nombre && u.activo);
  
  if (!usuario) {
    return {
      status: 404,
      data: { error: 'Usuario no encontrado' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  const nuevaSolicitud = {
    ID: `PS${Date.now()}${simulateBackend.nextId++}`,
    Nombre: datos.nombre,
    Motivo: datos.motivo,
    Fecha_Hora_Solicitud: new Date().toISOString(),
    Estado: 'pendiente',
    Supervisor_Aprobador: '',
    Fecha_Hora_Aprobacion: '',
    NIP: '',
    Fecha_Expiracion: '',
    Salida_Autorizada_Por_Vigilante: ''
  };
  
  simulateBackend.solicitudes.push(nuevaSolicitud);
  saveData();
  
  return {
    status: 200,
    data: {
      exito: true,
      id: nuevaSolicitud.ID,
      mensaje: 'Solicitud creada exitosamente (MODO DEMO)'
    },
    timestamp: new Date().toISOString(),
    demo: true
  };
}

function autorizarSolicitudDemo(id, supervisor, decision) {
  const solicitud = simulateBackend.solicitudes.find(s => s.ID === id);
  
  if (!solicitud) {
    return {
      status: 404,
      data: { error: 'Solicitud no encontrada' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  const timestamp = new Date();
  
  if (decision === 'autorizar') {
    const nip = (simulateBackend.nextNip++).toString();
    const fechaExpiracion = new Date(timestamp.getTime() + 10 * 60000); // 10 minutos
    
    solicitud.Estado = 'autorizada';
    solicitud.Supervisor_Aprobador = supervisor;
    solicitud.Fecha_Hora_Aprobacion = timestamp.toISOString();
    solicitud.NIP = nip;
    solicitud.Fecha_Expiracion = fechaExpiracion.toISOString();
    
    saveData();
    
    return {
      status: 200,
      data: {
        exito: true,
        nip: nip,
        fechaExpiracion: fechaExpiracion.toISOString(),
        mensaje: 'Solicitud autorizada exitosamente (MODO DEMO)'
      },
      timestamp: new Date().toISOString(),
      demo: true
    };
  } else {
    solicitud.Estado = 'rechazada';
    solicitud.Supervisor_Aprobador = supervisor;
    solicitud.Fecha_Hora_Aprobacion = timestamp.toISOString();
    
    saveData();
    
    return {
      status: 200,
      data: {
        exito: true,
        mensaje: 'Solicitud rechazada (MODO DEMO)'
      },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
}

function validarNIPDemo(nip) {
  const solicitud = simulateBackend.solicitudes.find(s => s.NIP === nip);
  
  if (!solicitud) {
    return {
      status: 200,
      data: { valido: false, error: 'NIP no encontrado' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  const ahora = new Date();
  const fechaExpiracion = new Date(solicitud.Fecha_Expiracion);
  
  if (ahora > fechaExpiracion) {
    solicitud.Estado = 'expirada';
    saveData();
    return {
      status: 200,
      data: { 
        valido: false, 
        error: 'NIP expirado',
        tiempoRestante: 0
      },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  if (solicitud.Salida_Autorizada_Por_Vigilante) {
    return {
      status: 200,
      data: { 
        valido: false, 
        error: 'NIP ya utilizado'
      },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  const tiempoRestante = Math.ceil((fechaExpiracion - ahora) / 60000);
  
  return {
    status: 200,
    data: {
      valido: true,
      empleado: solicitud.Nombre,
      motivo: solicitud.Motivo,
      tiempoRestante: tiempoRestante
    },
    timestamp: new Date().toISOString(),
    demo: true
  };
}

function autorizarSalidaFisicaDemo(nip, vigilante) {
  const solicitud = simulateBackend.solicitudes.find(s => s.NIP === nip);
  
  if (!solicitud) {
    return {
      status: 404,
      data: { error: 'NIP no válido' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  const ahora = new Date();
  const fechaExpiracion = new Date(solicitud.Fecha_Expiracion);
  
  if (ahora > fechaExpiracion) {
    solicitud.Estado = 'expirada';
    saveData();
    return {
      status: 410,
      data: { error: 'NIP expirado' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  if (solicitud.Salida_Autorizada_Por_Vigilante) {
    return {
      status: 409,
      data: { error: 'NIP ya fue utilizado' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  solicitud.Salida_Autorizada_Por_Vigilante = vigilante;
  const tiempoRestante = Math.ceil((fechaExpiracion - ahora) / 60000);
  saveData();
  
  return {
    status: 200,
    data: {
      exito: true,
      empleado: solicitud.Nombre,
      motivo: solicitud.Motivo,
      tiempoRestante: tiempoRestante,
      mensaje: 'Salida autorizada exitosamente (MODO DEMO)'
    },
    timestamp: new Date().toISOString(),
    demo: true
  };
}

function obtenerSolicitudesDemo(rol, empleado, estado) {
  let solicitudesFiltradas = [...simulateBackend.solicitudes];
  
  if (rol === 'colaborador' && empleado) {
    solicitudesFiltradas = solicitudesFiltradas.filter(s => s.Nombre === empleado);
  }
  
  if (estado && estado !== 'todos') {
    solicitudesFiltradas = solicitudesFiltradas.filter(s => s.Estado === estado);
  }
  
  // Verificar expiraciones
  const ahora = new Date();
  let dataChanged = false;
  solicitudesFiltradas.forEach(s => {
    if (s.Estado === 'autorizada' && s.Fecha_Expiracion) {
      const fechaExp = new Date(s.Fecha_Expiracion);
      if (ahora > fechaExp && !s.Salida_Autorizada_Por_Vigilante) {
        s.Estado = 'expirada';
        dataChanged = true;
      }
    }
  });
  
  if (dataChanged) {
    saveData();
  }
  
  return {
    status: 200,
    data: { solicitudes: solicitudesFiltradas },
    timestamp: new Date().toISOString(),
    demo: true
  };
}

function obtenerEstadoSolicitudDemo(id, empleado) {
  const solicitud = simulateBackend.solicitudes.find(s => s.ID === id && s.Nombre === empleado);
  
  if (!solicitud) {
    return {
      status: 404,
      data: { error: 'Solicitud no encontrada' },
      timestamp: new Date().toISOString(),
      demo: true
    };
  }
  
  const resultado = {
    id: solicitud.ID,
    estado: solicitud.Estado,
    fechaSolicitud: solicitud.Fecha_Hora_Solicitud
  };
  
  if (solicitud.Estado === 'autorizada' && solicitud.NIP) {
    const ahora = new Date();
    const fechaExpiracion = new Date(solicitud.Fecha_Expiracion);
    
    if (ahora > fechaExpiracion) {
      solicitud.Estado = 'expirada';
      resultado.estado = 'expirada';
      saveData();
    } else {
      resultado.nip = solicitud.NIP;
      resultado.tiempoRestante = Math.ceil((fechaExpiracion - ahora) / 60000);
    }
  }
  
  return {
    status: 200,
    data: resultado,
    timestamp: new Date().toISOString(),
    demo: true
  };
}

// Mostrar mensaje de demo
console.log('%c🔧 MODO DEMO ACTIVADO', 'background: #007acc; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;');
console.log('%cLa aplicación está funcionando en modo demo mientras configuras tu Google Apps Script.', 'color: #007acc; font-weight: bold;');
console.log('%cUsuarios disponibles:', 'color: #007acc; font-weight: bold;');
simulateBackend.usuarios.forEach(u => {
  console.log(`  • ${u.nombre} (${u.rol})`);
});
console.log('%cPara configurar el backend real, consulta: SOLUCION_URGENTE.md', 'color: #ff6b35; font-weight: bold;');