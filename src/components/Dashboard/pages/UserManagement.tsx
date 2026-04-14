import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Edit, Trash2, Check, X } from 'lucide-react';
import axios from 'axios'; // <-- Tambahkan axios
import { useAuth } from '../../../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Untuk indikator loading

  // State untuk form
  const [formData, setFormData] = useState({
    id: '',
    nama: '',
    email: '',
    jabatan: '',
    instansi: '',
    unitKerja: '',
    np: '',
    statusKepegawaian: 'Pegawai Tetap',
    statusKeaktifan: 'Aktif',
    role: 'User',
  });

  // MENGAMBIL DATA DARI DATABASE (LARAVEL API)
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/users');
      // Format data dari database ke format frontend
      const formattedUsers = response.data.map((u: any) => ({
        id: u.id.toString(), // Database id biasanya number
        nama: u.nama,
        email: u.email,
        jabatan: u.jabatan,
        instansi: u.instansi,
        unitKerja: u.unit_kerja, // Map snake_case ke camelCase
        np: u.np,
        statusKepegawaian: u.status_kepegawaian,
        statusKeaktifan: u.status_keaktifan ? 'Aktif' : 'Tidak Aktif',
        role: u.role,
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Gagal mengambil data users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAvailableRoles = () => {
    if (currentUser?.role === 'Super Admin') return ['Admin'];
    if (currentUser?.role === 'Admin') return ['User', 'Manajemen'];
    return [];
  };
  const availableRoles = getAvailableRoles();

  const handleOpenModal = (mode: 'add' | 'edit', userData: any = null) => {
    setModalMode(mode);
    if (mode === 'edit' && userData) {
      setFormData({
        id: userData.id,
        nama: userData.nama,
        email: userData.email,
        jabatan: userData.jabatan || '',
        instansi: userData.instansi || '',
        unitKerja: userData.unitKerja || '',
        np: userData.np || '',
        statusKepegawaian: userData.statusKepegawaian || 'Pegawai Tetap',
        statusKeaktifan: userData.statusKeaktifan || 'Aktif',
        role: userData.role,
      });
    } else {
      setFormData({
        id: '',
        nama: '',
        email: '',
        jabatan: '',
        instansi: '',
        unitKerja: '',
        np: '',
        statusKepegawaian: 'Pegawai Tetap',
        statusKeaktifan: 'Aktif',
        role: availableRoles[0] || 'User',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Siapkan data yang dikirim ke Laravel
    const payload = {
      nama: formData.nama,
      email: formData.email,
      jabatan: formData.jabatan,
      instansi: formData.instansi,
      unit_kerja: formData.unitKerja,
      np: formData.np,
      status_kepegawaian: formData.statusKepegawaian,
      status_keaktifan: formData.statusKeaktifan,
      role: formData.role,
    };

    try {
      if (modalMode === 'add') {
        await axios.post('http://127.0.0.1:8000/api/users', payload);
      } else {
        await axios.put(`http://127.0.0.1:8000/api/users/${formData.id}`, payload);
      }
      
      // Refresh data dari database setelah sukses simpan
      await fetchUsers();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Gagal menyimpan:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/users/${id}`);
        // Refresh tabel
        fetchUsers();
      } catch (error) {
        console.error('Gagal menghapus:', error);
        alert('Gagal menghapus user.');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (currentUser?.role === 'Super Admin') return u.role === 'Admin';
    if (currentUser?.role === 'Admin') return u.role === 'User' || u.role === 'Manajemen';
    return false;
  });

  if (currentUser?.role !== 'Super Admin' && currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <X className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 max-w-md">
          Sesuai aturan sistem, akun dengan level <b>{currentUser?.role || 'User'}</b> tidak memiliki kewenangan untuk mengakses halaman User Management.
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">
            {currentUser?.role === 'Super Admin' 
              ? 'Kelola akun Administrator sistem' 
              : 'Kelola akun Pengguna dan Manajemen'}
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal('add')}
          className="mt-4 md:mt-0 flex items-center space-x-2 bg-[#0b3c5d] text-white px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-semibold text-sm">Tambah User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div className="hidden md:flex items-center text-sm text-gray-500 font-medium">
            <Users className="w-4 h-4 mr-2" />
            Menampilkan: {filteredUsers.length} Pengguna
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0b3c5d] text-white text-sm">
                <th className="px-6 py-4 font-semibold">Nama Pengguna</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Jabatan</th>
                <th className="px-6 py-4 font-semibold">Unit Kerja</th>
                <th className="px-6 py-4 font-semibold">Status Kepegawaian</th>
                <th className="px-6 py-4 font-semibold text-center">Role Sistem</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{u.nama}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600">{u.jabatan || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{u.unitKerja || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{u.statusKepegawaian || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block
                      ${u.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' : 
                        u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 
                        u.role === 'Manajemen' ? 'bg-orange-100 text-orange-700' : 
                        'bg-emerald-100 text-emerald-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center space-x-2">
                    <button 
                      onClick={() => handleOpenModal('edit', u)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Pengguna"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    Tidak ada data pengguna yang sesuai dengan hak akses Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-md shadow-sm border border-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form id="userForm" onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jabatan</label>
                  <input type="text" value={formData.jabatan} onChange={(e) => setFormData({...formData, jabatan: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Instansi</label>
                  <input type="text" value={formData.instansi} onChange={(e) => setFormData({...formData, instansi: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Kerja</label>
                  <input type="text" value={formData.unitKerja} onChange={(e) => setFormData({...formData, unitKerja: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">NP (Nomor Pegawai)</label>
                  <input type="text" value={formData.np} onChange={(e) => setFormData({...formData, np: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status Kepegawaian</label>
                  <select value={formData.statusKepegawaian} onChange={(e) => setFormData({...formData, statusKepegawaian: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Pegawai Tetap">Pegawai Tetap</option>
                    <option value="Pegawai Kontrak / PKWT">Pegawai Kontrak / PKWT</option>
                    <option value="CPNS">CPNS</option>
                    <option value="PNS">PNS</option>
                    <option value="Outsourcing">Outsourcing</option>
                    <option value="Magang">Magang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status Keaktifan</label>
                  <select value={formData.statusKeaktifan} onChange={(e) => setFormData({...formData, statusKeaktifan: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role Sistem</label>
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} disabled={modalMode === 'edit' && formData.id === currentUser?.id} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold ${modalMode === 'edit' && formData.id === currentUser?.id ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-blue-50 text-blue-800'}`}>
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                    {modalMode === 'edit' && !availableRoles.includes(formData.role) && (
                      <option value={formData.role}>{formData.role}</option>
                    )}
                  </select>
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password Default</label>
                    <input type="text" disabled value="Sitor123!@" className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none font-mono cursor-not-allowed" />
                    <p className="text-xs text-gray-500 mt-1">User akan diminta mengganti password ini saat login pertama kali.</p>
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition-colors">
                Batal
              </button>
              <button type="submit" form="userForm" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-md shadow-blue-200 disabled:opacity-50">
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Menyimpan...' : 'Simpan Akun'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}