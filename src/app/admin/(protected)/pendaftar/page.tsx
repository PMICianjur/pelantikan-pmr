import { supabase } from '@/lib/supabaseClient';
import { Building } from 'lucide-react';
import AksiPembayaranButtons from './AksiPembayaranButtons';

// Baris ini memastikan halaman selalu mengambil data terbaru dari server
// dan mengatasi masalah status yang tidak berubah.
export const dynamic = 'force-dynamic';

// Komponen kecil untuk membuat badge status yang berwarna-warni
const StatusBadge = ({ status }: { status: string | null }) => {
  const statusMap = {
    PAID: 'bg-green-100 text-green-800',
    WAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
    PENDING_PAYMENT: 'bg-slate-200 text-slate-800',
  };
  
  const statusText = {
    PAID: 'Lunas',
    WAITING_CONFIRMATION: 'Menunggu Konfirmasi',
    REJECTED: 'Ditolak',
    PENDING_PAYMENT: 'Menunggu Pembayaran',
  };

  const safeStatus = status || 'PENDING_PAYMENT';
  const style = statusMap[safeStatus as keyof typeof statusMap];
  const text = statusText[safeStatus as keyof typeof statusText];

  return (
    <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${style}`}>
      {text}
    </span>
  );
};

export default async function PendaftarPage() {
  const { data: pendaftarans, error } = await supabase
    .from('pendaftaran')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="p-8 font-semibold text-red-500">Gagal memuat data pendaftar: {error.message}</p>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Building className="text-red-600" size={32} />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Verifikasi Pembayaran Pendaftar</h1>
        </div>
        
        {/* Di sini Anda bisa menempatkan kembali komponen filter dan search jika diperlukan */}

        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 font-semibold text-slate-600 text-sm">Nama Sekolah</th>
                <th className="p-4 font-semibold text-slate-600 text-sm hidden lg:table-cell">Pembina</th>
                <th className="p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">Kontak WA</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Status Pembayaran</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!pendaftarans || pendaftarans.length === 0 ? (
                 <tr><td colSpan={5} className="text-center p-8 text-slate-500">Belum ada pendaftar.</td></tr>
              ) : pendaftarans.map((p) => (
                <tr key={p.id} className="border-t border-slate-200">
                  <td className="p-4 font-medium text-slate-900 text-sm">{p.nama_sekolah}</td>
                  <td className="p-4 text-slate-600 text-sm hidden lg:table-cell">{p.nama_pembina}</td>
                  <td className="p-4 text-slate-600 text-sm hidden md:table-cell">{p.nomor_whatsapp}</td>
                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-4">
                    <AksiPembayaranButtons 
                      pendaftaranId={p.id} 
                      buktiUrl={p.bukti_pembayaran_url}
                      nomorWhatsapp={p.nomor_whatsapp}
                      namaSekolah={p.nama_sekolah}
                      status={p.status} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}