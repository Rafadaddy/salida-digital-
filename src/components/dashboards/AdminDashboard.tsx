import React, { useState, useEffect } from 'react';
import { useApp, Usuario } from '../../contexts/AppContext';
import {
    Settings, UserPlus, Users, Key, Trash2,
    CheckCircle2, XCircle, RefreshCw, Shield,
    Mail, User, Lock, Save, Search
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { crearUsuario, obtenerUsuarios, eliminarUsuario, actualizarPassword, isLoading, error } = useApp();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [filtro, setFiltro] = useState('');

    // Estado para nuevo usuario
    const [nuevoUser, setNuevoUser] = useState({
        nombre: '',
        rol: 'colaborador' as Usuario['rol'],
        clave: '',
        password: '',
        email: '',
        activo: true
    });

    // Estado para reset de password
    const [resetPass, setResetPass] = useState<{ id: string, pass: string } | null>(null);

    const cargarUsuarios = async () => {
        const lista = await obtenerUsuarios();
        setUsuarios(lista);
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        const exito = await crearUsuario(nuevoUser);
        if (exito) {
            setNuevoUser({ nombre: '', rol: 'colaborador', clave: '', password: '', email: '', activo: true });
            setMostrarForm(false);
            cargarUsuarios();
        }
    };

    const handleEliminar = async (id: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de eliminar permanentemente al usuario ${nombre}?`)) {
            const exito = await eliminarUsuario(id);
            if (exito) cargarUsuarios();
        }
    };

    const handleResetPassword = async () => {
        if (!resetPass) return;
        const exito = await actualizarPassword(resetPass.id, resetPass.pass);
        if (exito) {
            alert('Contraseña actualizada correctamente');
            setResetPass(null);
            cargarUsuarios();
        }
    };

    const usuariosFiltrados = usuarios.filter(u =>
        u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        u.rol.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            {/* Header Corporativo */}
            <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-tr from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                            <Settings className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
                            <p className="text-slate-500 font-medium">Gestiona el acceso y roles de todo el personal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMostrarForm(!mostrarForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                        <UserPlus className="h-5 w-5" />
                        {mostrarForm ? 'Cerrar Formulario' : 'Nuevo Usuario'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Creación */}
                {mostrarForm && (
                    <div className="lg:col-span-1 border-2 border-dashed border-blue-200 rounded-[2rem] p-8 bg-blue-50/30">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            Alta de Personal
                        </h2>
                        <form onSubmit={handleCrear} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={nuevoUser.nombre}
                                        onChange={e => setNuevoUser({ ...nuevoUser, nombre: e.target.value })}
                                        placeholder="Ej: Pedro Vigilante"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Rol en el Sistema</label>
                                <select
                                    value={nuevoUser.rol}
                                    onChange={e => setNuevoUser({ ...nuevoUser, rol: e.target.value as any })}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none"
                                >
                                    <option value="colaborador">Colaborador (Pide pases)</option>
                                    <option value="supervisor">Supervisor (Aprueba pases)</option>
                                    <option value="vigilante">Vigilante (Da salida física)</option>
                                    <option value="admin">Administrador (Control total)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Clave de Empleado (Opcional)</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={nuevoUser.clave}
                                        onChange={e => setNuevoUser({ ...nuevoUser, clave: e.target.value })}
                                        placeholder="Ej: 1330779"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Contraseña Inicial</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={nuevoUser.password}
                                        onChange={e => setNuevoUser({ ...nuevoUser, password: e.target.value })}
                                        placeholder="Contraseña segura"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Correo (Opcional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={nuevoUser.email}
                                        onChange={e => setNuevoUser({ ...nuevoUser, email: e.target.value })}
                                        placeholder="usuario@empresa.com"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <Save className="h-5 w-5" />
                                Guardar Usuario
                            </button>
                        </form>
                    </div>
                )}

                {/* Listado de Usuarios */}
                <div className={`${mostrarForm ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden`}>
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-600" />
                            Directorio de Usuarios
                        </h2>
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={filtro}
                                onChange={e => setFiltro(e.target.value)}
                                placeholder="Buscar por nombre o rol..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Usuario</th>
                                    <th className="px-8 py-4">Clave</th>
                                    <th className="px-8 py-4">Rol</th>
                                    <th className="px-8 py-4 text-center">Estado</th>
                                    <th className="px-8 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {usuariosFiltrados.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 group-hover:scale-110 transition-transform">
                                                    {u.nombre.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{u.nombre}</p>
                                                    <p className="text-xs text-slate-500">{u.email || 'Sin correo'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {u.clave || '---'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.rol === 'supervisor' ? 'bg-green-100 text-green-700' :
                                                    u.rol === 'vigilante' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {u.rol}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {u.activo ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-slate-300 mx-auto" />
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button
                                                onClick={() => {
                                                    const nueva = window.prompt(`Nueva contraseña para ${u.nombre}:`);
                                                    if (nueva) setResetPass({ id: u.id!, pass: nueva });
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Cambiar contraseña"
                                            >
                                                <Key className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEliminar(u.id!, u.nombre)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación de Reset Pass */}
            {resetPass && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <Key className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Restablecer Contraseña</h3>
                        <p className="text-slate-500 text-center text-sm mb-6">
                            ¿Confirmas cambiar la contraseña de este usuario por la nueva que ingresaste?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleResetPassword}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setResetPass(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
