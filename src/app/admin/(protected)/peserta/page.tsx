'use client' // Menandakan ini adalah Client Component

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Users, ArrowLeft, ArrowRight, FileDown, Loader2 } from 'lucide-react';

// Definisikan tipe data untuk peserta agar lebih jelas
type Peserta = {
  id: number;
  created_at: string;
  nama_lengkap: string;
  foto_url: string;
  pendaftaran_id: number;
  nama_sekolah: string | null;
}

export default function PesertaPage() {
  const searchParams = useSearchParams();
  const [pesertas, setPesertas] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 15; // Jumlah item per halaman dalam tampilan tabel

  // useEffect untuk mengambil data sesuai halaman yang aktif
  useEffect(() => {
    const currentPage = parseInt(searchParams.get('page') || '1');
    setPage(currentPage);

    const fetchPesertas = async () => {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from('peserta')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (data) {
        setPesertas(data);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      }
      if (error) {
        console.error("Gagal mengambil data peserta:", error.message);
      }
      setLoading(false);
    };

    fetchPesertas();
  }, [searchParams]);

  // Fungsi untuk handle export ke Excel dengan gambar
// ... di dalam komponen PesertaAdminPage ...
const handleExport = async () => {
    setExporting(true);
    try {
      const { data: allPesertas, error } = await supabase
        .from('peserta')
        .select(`nama_lengkap, nama_sekolah, foto_url, pendaftaran!inner(status)`)
        .eq('pendaftaran.status', 'PAID');
        
      if (error) throw error;
      if (!allPesertas) throw new Error("Tidak ada data untuk diekspor.");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Peserta Lunas');
      
      const FOTO_TARGET_HEIGHT_PX = 151;
      const ROW_HEIGHT_PT = 113;

      worksheet.columns = [
        { header: 'Foto', key: 'foto', width: 25 },
        { header: 'Nama Lengkap', key: 'nama', width: 35 },
        { header: 'Nama Sekolah', key: 'sekolah', width: 35 },
      ];
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } };

      for (const [index, peserta] of allPesertas.entries()) {
        const rowIndex = index + 2;
        worksheet.addRow({ nama: peserta.nama_lengkap, sekolah: peserta.nama_sekolah, });
        try {
          const response = await fetch(peserta.foto_url);
          const imageBuffer = await response.arrayBuffer();
          const imageId = workbook.addImage({ buffer: imageBuffer, extension: 'jpeg', });
          worksheet.addImage(imageId, { tl: { col: 0.1, row: rowIndex - 1.1 }, ext: { width: FOTO_TARGET_HEIGHT_PX * (1), height: FOTO_TARGET_HEIGHT_PX } }); // Placeholder width
          worksheet.getRow(rowIndex).height = ROW_HEIGHT_PT;
        } catch (imgError) {
          console.error(`Gagal memproses gambar untuk ${peserta.nama_lengkap}:`, imgError);
          worksheet.getCell(`A${rowIndex}`).value = 'Gagal Dimuat';
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, "Data Peserta Lunas (dengan Foto).xlsx");

    } catch (error) { // <-- Perbaikan dari 'any'
      let errorMessage = 'Terjadi kesalahan yang tidak diketahui.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Gagal mengekspor data:", errorMessage);
      alert("Gagal mengekspor data: " + errorMessage);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Users className="text-red-600" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Daftar Semua Peserta</h1>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {exporting ? 'Mengekspor...' : 'Export ke Excel'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Foto</th>
                <th className="p-4 font-semibold text-slate-600">Nama Lengkap</th>
                <th className="p-4 font-semibold text-slate-600">Nama Sekolah</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center p-8">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : pesertas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center p-8 text-slate-500">Belum ada data peserta.</td>
                </tr>
              ) : (
                pesertas.map((peserta) => (
                  <tr key={peserta.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-2">
                      <Image
                        src={peserta.foto_url}
                        alt={`Foto ${peserta.nama_lengkap}`}
                        width={48}
                        height={48}
                        className="rounded-md object-cover aspect-square bg-slate-200"
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-800">{peserta.nama_lengkap}</td>
                    <td className="p-4 text-slate-600">{peserta.nama_sekolah}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
            <div className="flex justify-between items-center mt-8">
                <Link
                    href={`/admin/peserta?page=${page - 1}`}
                    className={`inline-flex items-center gap-2 bg-white text-slate-800 px-4 py-2 rounded-lg font-semibold transition shadow-sm ${
                        page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-100'
                    }`}
                >
                    <ArrowLeft size={16} /> Sebelumnya
                </Link>
                <span className="text-slate-600 font-medium">
                    Halaman {page} dari {totalPages}
                </span>
                <Link
                    href={`/admin/peserta?page=${page + 1}`}
                    className={`inline-flex items-center gap-2 bg-white text-slate-800 px-4 py-2 rounded-lg font-semibold transition shadow-sm ${
                        page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-slate-100'
                    }`}
                >
                    Berikutnya <ArrowRight size={16} />
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}