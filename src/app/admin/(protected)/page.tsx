import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { 
    Users, 
    ArrowRight, 
    BarChart3, 
    Building, 
    Clock, 
    DollarSign,
    UserCheck,
    GraduationCap
} from 'lucide-react';

// Komponen kecil untuk kartu statistik agar kode utama lebih bersih
const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: React.ElementType, colorClass: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-start gap-4 transition-all hover:shadow-xl hover:-translate-y-1">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon className="text-white" size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-3xl font-bold text-zinc-900">{value}</p>
        </div>
    </div>
);

// Ini adalah Server Component, semua kalkulasi dilakukan di server
export default async function AdminHomePage() {
  
  // 1. Ambil semua data pendaftaran yang relevan dalam satu panggilan
  const { data: pendaftarans, error } = await supabase
    .from('pendaftaran')
    .select('kategori, status, jumlah_peserta, jumlah_pendamping, total_biaya_keseluruhan, nama_sekolah, created_at');

  if (error) {
    return <p className="p-8 font-semibold text-red-500">Gagal memuat data dashboard: {error.message}</p>;
  }

  // 2. Lakukan semua kalkulasi statistik di sini
  const totalSekolah = pendaftarans.length;
  
  const totalPartisipan = pendaftarans.reduce((acc, p) => acc + (p.jumlah_peserta || 0), 0);
  const totalPendamping = pendaftarans.reduce((acc, p) => acc + (p.jumlah_pendamping || 0), 0);
  const totalKeseluruhan = totalPartisipan + totalPendamping;

  const sekolahWira = pendaftarans.filter(p => p.kategori === 'Wira').length;
  const sekolahMadya = pendaftarans.filter(p => p.kategori === 'Madya').length;

  const menungguKonfirmasi = pendaftarans.filter(p => p.status === 'WAITING_CONFIRMATION').length;
  
  const totalPendapatan = pendaftarans
    .filter(p => p.status === 'PAID')
    .reduce((acc, p) => acc + (p.total_biaya_keseluruhan || 0), 0);

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  // Ambil 5 pendaftar terbaru
  const pendaftarTerbaru = [...pendaftarans]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-white p-3 rounded-full shadow">
             <BarChart3 className="text-red-600" size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">Dashboard Admin Pelantikan & Pelatihan PMR Se-Kabupaten Cianjur Tahun 2025</h1>
        </div>

        {/* Kartu Statistik Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Sekolah Pendaftar" value={totalSekolah} icon={Building} colorClass="bg-red-600" />
            <StatCard title="Total Partisipan" value={totalKeseluruhan} icon={Users} colorClass="bg-zinc-800" />
            <StatCard title="Total Pendapatan" value={formatRupiah(totalPendapatan)} icon={DollarSign} colorClass="bg-red-600" />
            <StatCard title="Menunggu Konfirmasi" value={menungguKonfirmasi} icon={Clock} colorClass="bg-zinc-800" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Navigasi dan Pendaftar Terbaru */}
            <div className="lg:col-span-2 space-y-6">
                {/* Menu Navigasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/admin/pendaftar" className="group block"><div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all h-full"><div className="flex items-center gap-4 mb-2"><UserCheck className="text-red-600" size={24} /><h2 className="text-xl font-bold text-zinc-900">Database Pendaftar</h2></div><p className="text-zinc-600 text-sm mb-4">Setujui atau tolak pembayaran yang masuk dari pendaftar.</p><div className="inline-flex items-center gap-2 text-red-600 font-semibold">Buka Halaman <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></div></div></Link>
                    <Link href="/admin/peserta" className="group block"><div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all h-full"><div className="flex items-center gap-4 mb-2"><Users className="text-red-600" size={24} /><h2 className="text-xl font-bold text-zinc-900">Database Peserta</h2></div><p className="text-zinc-600 text-sm mb-4">Lihat, cari, dan ekspor semua data peserta yang sudah lunas.</p><div className="inline-flex items-center gap-2 text-red-600 font-semibold">Buka Halaman <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></div></div></Link>
                </div>
                {/* Pendaftar Terbaru */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4">Aktivitas Pendaftar Terbaru</h3>
                    <div className="space-y-3">
                        {pendaftarTerbaru.map(p => (
                            <div key={p.nama_sekolah + p.created_at} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-zinc-700">{p.nama_sekolah}</span>
                                <span className="text-zinc-500">{new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Kolom Kanan: Statistik Kategori */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="text-zinc-500" size={20} />
                    <h3 className="text-lg font-bold text-zinc-900">Komposisi Kategori</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-zinc-700">Wira (SMA/Sederajat)</span>
                            <span className="text-zinc-900">{sekolahWira}</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2.5">
                            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${totalSekolah > 0 ? (sekolahWira / totalSekolah) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-zinc-700">Madya (SMP/Sederajat)</span>
                            <span className="text-zinc-900">{sekolahMadya}</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2.5">
                            <div className="bg-zinc-800 h-2.5 rounded-full" style={{ width: `${totalSekolah > 0 ? (sekolahMadya / totalSekolah) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
      </div>
    </div>
  );
}