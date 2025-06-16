import Link from 'next/link';
import { CheckCircle2, Home } from 'lucide-react';

export default function PendaftaranSuksesPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-xl shadow-lg text-center">
        
        {/* Ikon Sukses */}
        <CheckCircle2
          className="text-green-500 mx-auto mb-4"
          size={80}
          strokeWidth={1.5}
        />

        {/* Judul Pesan */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Pendaftaran Terkirim!
        </h1>

        {/* Pesan Penjelasan */}
        <p className="text-slate-600 mt-3 mb-8">
          Terima kasih, data pendaftaran dan bukti pembayaran Anda telah kami terima. 
          Panitia akan segera melakukan verifikasi. Informasi selanjutnya akan kami sampaikan melalui WhatsApp.
        </p>

        {/* Tombol Aksi */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition-colors shadow-sm"
        >
          <Home size={18} />
          Kembali ke Beranda
        </Link>
        
      </div>
    </div>
  );
}