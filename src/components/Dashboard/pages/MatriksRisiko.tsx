import { useState, useEffect } from 'react';
import { ShieldAlert, Info, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext'; // <-- Import Auth Context

type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi';

interface AuditorRisk {
  id: number;
  name: string;
  opsTI: RiskLevel;
  keuanganFraud: RiskLevel;
  kepatuhan: RiskLevel;
  catatanOpsTI: string;
  catatanKeuanganFraud: string;
  catatanKepatuhan: string;
}

export default function MatriksRisiko() {
  const { user } = useAuth(); // <-- Ambil user login
  const isReadOnly = user?.role === 'Manajemen'; // <-- Cek Role

  const [matrixData, setMatrixData] = useState<AuditorRisk[]>([]);
  const [activeDetail, setActiveDetail] = useState<{
    userId: number;
    auditorName: string;
    auditType: string;
    riskLevel: RiskLevel;
  } | null>(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://sitor-backend-production.up.railway.app/api/matriks-risiko', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatrixData(response.data);
      if (response.data.length > 0 && !activeDetail) {
        setActiveDetail({
          userId: response.data[0].id,
          auditorName: response.data[0].name,
          auditType: 'Audit Operasional & TI',
          riskLevel: response.data[0].opsTI
        });
      }
    } catch (error) {
      console.error('Gagal mengambil data matriks risiko:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveRiskData = async (userId: number, updatedData: AuditorRisk) => {
    if (isReadOnly) return; // Proteksi ganda
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://sitor-backend-production.up.railway.app/api/matriks-risiko/${userId}`, {
        opsTI: updatedData.opsTI,
        keuanganFraud: updatedData.keuanganFraud,
        kepatuhan: updatedData.kepatuhan,
        catatanOpsTI: updatedData.catatanOpsTI,
        catatanKeuanganFraud: updatedData.catatanKeuanganFraud,
        catatanKepatuhan: updatedData.catatanKepatuhan
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Gagal menyimpan data matriks risiko:', error);
    }
  };

  const handleRiskChange = (userId: number, field: 'opsTI' | 'keuanganFraud' | 'kepatuhan', newValue: RiskLevel) => {
    if (isReadOnly) return;
    setMatrixData(prevData => {
      const newData = prevData.map(item => {
        if (item.id === userId) {
          const updatedItem = { ...item, [field]: newValue };
          if (activeDetail?.userId === userId) {
            const auditTypeMap: Record<string, string> = {
              opsTI: 'Audit Operasional & TI',
              keuanganFraud: 'Audit Keuangan & Fraud',
              kepatuhan: 'Audit Kepatuhan'
            };
            if (activeDetail.auditType === auditTypeMap[field]) {
              setActiveDetail({ ...activeDetail, riskLevel: newValue });
            }
          }
          saveRiskData(userId, updatedItem);
          return updatedItem;
        }
        return item;
      });
      return newData;
    });
  };

  const handleNoteChange = (userId: number, value: string) => {
    if (isReadOnly || !activeDetail) return;
    let noteField: 'catatanOpsTI' | 'catatanKeuanganFraud' | 'catatanKepatuhan' = 'catatanOpsTI';
    if (activeDetail.auditType === 'Audit Keuangan & Fraud') noteField = 'catatanKeuanganFraud';
    if (activeDetail.auditType === 'Audit Kepatuhan') noteField = 'catatanKepatuhan';

    setMatrixData(prevData => {
      const newData = prevData.map(item => {
        if (item.id === userId) {
          const updatedItem = { ...item, [noteField]: value };
          saveRiskData(userId, updatedItem);
          return updatedItem;
        }
        return item;
      });
      return newData;
    });
  };

  const handleCellClick = (userId: number, auditorName: string, auditType: string, riskLevel: RiskLevel) => {
    setActiveDetail({ userId, auditorName, auditType, riskLevel });
  };

  const getBgColor = (level: RiskLevel) => {
    switch (level) {
      case 'Rendah': return 'bg-[#e8f8f5] hover:bg-[#d1f2eb] text-[#117a65]';
      case 'Sedang': return 'bg-[#fef9e7] hover:bg-[#fcf3cf] text-[#b9770e]';
      case 'Tinggi': return 'bg-[#fdedec] hover:bg-[#fadbd8] text-[#cb4335]';
      default: return 'bg-white';
    }
  };

  const getTextColor = (level: RiskLevel) => {
    switch (level) {
      case 'Rendah': return 'text-[#117a65]';
      case 'Sedang': return 'text-[#b9770e]';
      case 'Tinggi': return 'text-[#cb4335]';
      default: return 'text-gray-900';
    }
  };

  const renderDetailContent = () => {
    if (!activeDetail || matrixData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 italic">Belum ada data auditor untuk dianalisis.</p>
        </div>
      );
    }

    const activeUser = matrixData.find(u => u.id === activeDetail.userId);
    let currentNote = '';
    if (activeUser) {
      if (activeDetail.auditType === 'Audit Operasional & TI') currentNote = activeUser.catatanOpsTI || '';
      if (activeDetail.auditType === 'Audit Keuangan & Fraud') currentNote = activeUser.catatanKeuanganFraud || '';
      if (activeDetail.auditType === 'Audit Kepatuhan') currentNote = activeUser.catatanKepatuhan || '';
    }

    return (
      <div className="animate-in fade-in duration-300 text-gray-800">
        <div className="mb-6 space-y-1">
          <p><span className="font-bold">Auditor:</span> {activeDetail.auditorName}</p>
          <p><span className="font-bold">Jenis Audit:</span> {activeDetail.auditType}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Analisis Sistem</h3>
          <ul className="space-y-1.5 pl-4">
            <li>
              {activeDetail.riskLevel === 'Tinggi' ? '✕' : '✓'} Sertifikasi inti {activeDetail.riskLevel === 'Tinggi' ? 'tidak tersedia / expired' : 'tersedia'}
            </li>
            <li>
              {activeDetail.riskLevel === 'Rendah' ? '✓' : '✕'} Gap kompetensi {activeDetail.auditType} {activeDetail.riskLevel === 'Rendah' ? 'terpenuhi' : 'ditemukan'}
            </li>
            <li>
              {activeDetail.riskLevel === 'Rendah' ? '✓' : '✕'} Pengalaman audit sejenis {activeDetail.riskLevel === 'Rendah' ? 'sangat memadai' : 'terbatas'}
            </li>
          </ul>
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-3">Rekomendasi Si-Tor</h3>
          <ul className="list-disc pl-8 space-y-1.5">
            {activeDetail.riskLevel === 'Tinggi' && (
              <>
                <li>Pendampingan auditor senior mutlak diperlukan</li>
                <li>Pelatihan sebelum penugasan penuh diwajibkan</li>
                <li>Alternatif auditor dengan risiko lebih rendah sangat disarankan</li>
              </>
            )}
            {activeDetail.riskLevel === 'Sedang' && (
              <>
                <li>Pendampingan auditor senior diperlukan pada tahap krusial</li>
                <li>Review kertas kerja berjenjang lebih ketat</li>
                <li>Jadwalkan program sertifikasi terkait di RKT berikutnya</li>
              </>
            )}
            {activeDetail.riskLevel === 'Rendah' && (
              <>
                <li>Auditor dapat ditugaskan secara independen dan mandiri</li>
                <li>Kandidat cocok untuk mengambil peran sebagai Ketua Tim</li>
                <li>Pertahankan kompetensi dan status sertifikasi saat ini</li>
              </>
            )}
          </ul>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">Catatan Khusus / Penyesuaian Manual</h3>
          <p className="text-xs text-gray-500 mb-3">Tambahkan catatan khusus yang tersimpan unik untuk {activeDetail.auditorName} pada penugasan ini.</p>
          <textarea
            value={currentNote}
            onChange={(e) => handleNoteChange(activeDetail.userId, e.target.value)}
            disabled={isReadOnly}
            placeholder={isReadOnly ? "Tidak ada catatan." : "Ketik catatan tambahan di sini..."}
            className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-[#78231c] outline-none text-sm text-gray-800 min-h-[100px] resize-y ${isReadOnly ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-gray-50 border-gray-300'}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="bg-[#78231c] rounded-t-xl p-8 text-white shadow-md">
        <h1 className="text-3xl font-bold mb-2">Heatmap Risiko Penugasan Audit</h1>
        <p className="text-white/80 text-sm">Si-Tor – Sistem Kompetensi Auditor SPI</p>
        {isReadOnly && (
          <div className="mt-4 inline-block bg-black/20 px-4 py-2 rounded-lg text-sm font-bold text-amber-200">
            🔒 Mode Pantau (Read-Only)
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-[#78231c]" />
          <h2 className="text-lg font-bold text-gray-900">Matriks Risiko Penugasan Audit</h2>
        </div>
        
        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px] border border-gray-300">
            <thead>
              <tr className="bg-[#78231c] text-white">
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold w-1/4">Auditor</th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold w-1/4">Audit Operasional & TI</th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold w-1/4">Audit Keuangan & Fraud</th>
                <th className="border border-gray-300 px-4 py-3 text-center text-sm font-bold w-1/4">Audit Kepatuhan</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.length > 0 ? (
                matrixData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-300 hover:bg-gray-50/50 transition-colors">
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-800 text-center bg-white font-medium">{row.name}</td>
                    
                    <td className={`border border-gray-300 p-0 transition-colors ${getBgColor(row.opsTI)}`} onClick={() => handleCellClick(row.id, row.name, 'Audit Operasional & TI', row.opsTI)}>
                      <select 
                        value={row.opsTI}
                        onChange={(e) => handleRiskChange(row.id, 'opsTI', e.target.value as RiskLevel)}
                        disabled={isReadOnly}
                        className={`w-full h-full py-4 bg-transparent text-center text-sm font-bold outline-none ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} appearance-none ${getTextColor(row.opsTI)}`}
                      >
                        <option value="Rendah" className="text-gray-900">Rendah</option>
                        <option value="Sedang" className="text-gray-900">Sedang</option>
                        <option value="Tinggi" className="text-gray-900">Tinggi</option>
                      </select>
                    </td>

                    <td className={`border border-gray-300 p-0 transition-colors ${getBgColor(row.keuanganFraud)}`} onClick={() => handleCellClick(row.id, row.name, 'Audit Keuangan & Fraud', row.keuanganFraud)}>
                      <select 
                        value={row.keuanganFraud}
                        onChange={(e) => handleRiskChange(row.id, 'keuanganFraud', e.target.value as RiskLevel)}
                        disabled={isReadOnly}
                        className={`w-full h-full py-4 bg-transparent text-center text-sm font-bold outline-none ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} appearance-none ${getTextColor(row.keuanganFraud)}`}
                      >
                        <option value="Rendah" className="text-gray-900">Rendah</option>
                        <option value="Sedang" className="text-gray-900">Sedang</option>
                        <option value="Tinggi" className="text-gray-900">Tinggi</option>
                      </select>
                    </td>

                    <td className={`border border-gray-300 p-0 transition-colors ${getBgColor(row.kepatuhan)}`} onClick={() => handleCellClick(row.id, row.name, 'Audit Kepatuhan', row.kepatuhan)}>
                      <select 
                        value={row.kepatuhan}
                        onChange={(e) => handleRiskChange(row.id, 'kepatuhan', e.target.value as RiskLevel)}
                        disabled={isReadOnly}
                        className={`w-full h-full py-4 bg-transparent text-center text-sm font-bold outline-none ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} appearance-none ${getTextColor(row.kepatuhan)}`}
                      >
                        <option value="Rendah" className="text-gray-900">Rendah</option>
                        <option value="Sedang" className="text-gray-900">Sedang</option>
                        <option value="Tinggi" className="text-gray-900">Tinggi</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-gray-300 px-6 py-12 text-center text-gray-500 bg-white">
                    Belum ada data auditor di sistem.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="flex items-center space-x-3 mt-6">
            <span className="px-4 py-1.5 bg-[#e8f8f5] text-[#117a65] text-xs font-bold rounded-full border border-[#d1f2eb]">Rendah</span>
            <span className="px-4 py-1.5 bg-[#fef9e7] text-[#b9770e] text-xs font-bold rounded-full border border-[#fcf3cf]">Sedang</span>
            <span className="px-4 py-1.5 bg-[#fdedec] text-[#cb4335] text-xs font-bold rounded-full border border-[#fadbd8]">Tinggi</span>
            <span className="text-xs text-gray-500 ml-2 flex items-center"><Info className="w-3 h-3 mr-1"/></span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-gray-700" />
          <span>Detail Risiko Penugasan</span>
        </h2>
        {renderDetailContent()}
      </div>

    </div>
  );
}
