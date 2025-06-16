'use client'

import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import Image from 'next/image'
import { useRegistrationStore } from '../../lib/store'
import { 
    UploadCloud, FileDown, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Send, Wallet, Users, Info, 
    User, Phone, University, ListChecks 
} from 'lucide-react'
import React from 'react'

// Definisikan tipe data state
type PesertaState = {
  nama_lengkap: string;
  foto_file: File | null;
  status: 'Menunggu Foto' | 'Foto Cocok' | 'Error';
}
type PendampingState = {
  nama_lengkap: string;
}

// Definisikan Harga sebagai konstanta
const HARGA_PESERTA = 35000;
const HARGA_PENDAMPING = 15000;

// Komponen kecil untuk membuat label dengan ikon secara konsisten
const IconLabel = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
    <div className="flex items-center gap-2">
        <Icon className="text-red-600" size={18} />
        <span className="font-medium text-zinc-700">{children}</span>
    </div>
);

const FormInput = ({ id, label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon: React.ElementType }) => (
  <div>
    <label htmlFor={id} className="block text-sm mb-1.5">
        <IconLabel icon={icon}>{label}</IconLabel>
    </label>
    <input id={id} {...props} className="w-full p-3 border border-zinc-300 bg-white text-zinc-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow duration-200" />
  </div>
);

const FormSelect = ({ id, label, icon, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, icon: React.ElementType }) => (
    <div>
      <label htmlFor={id} className="block text-sm mb-1.5">
        <IconLabel icon={icon}>{label}</IconLabel>
      </label>
      <select id={id} {...props} className="w-full p-3 border border-zinc-300 bg-white text-zinc-900 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow duration-200">
        {children}
      </select>
    </div>
);

export default function DaftarPage() {
  const router = useRouter();
  const setData = useRegistrationStore((state) => state.setData);

  const [step, setStep] = useState(1);
  const [namaPembina, setNamaPembina] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [kategori, setKategori] = useState('Madya');
  const [pesertaList, setPesertaList] = useState<PesertaState[]>([]);
  const [pendampingList, setPendampingList] = useState<PendampingState[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');

  const handleExcelUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const pesertaSheet = workbook.Sheets['Peserta'];
        if (!pesertaSheet) throw new Error("Sheet 'Peserta' tidak ditemukan.");
        const pesertaJson = XLSX.utils.sheet_to_json(pesertaSheet) as { 'Nama Lengkap': string }[];
        const newPesertaList: PesertaState[] = pesertaJson.map(item => ({ nama_lengkap: item['Nama Lengkap'], foto_file: null, status: 'Menunggu Foto' }));
        setPesertaList(newPesertaList);

        const pendampingSheet = workbook.Sheets['Pendamping'];
        let newPendampingList: { nama_lengkap: string }[] = [];
        if (pendampingSheet) {
          const pendampingJson = XLSX.utils.sheet_to_json(pendampingSheet) as { 'Nama Lengkap': string }[];
          newPendampingList = pendampingJson.map(item => ({ nama_lengkap: item['Nama Lengkap'] }));
        }
        setPendampingList(newPendampingList);
        setMessage(`Berhasil impor ${newPesertaList.length} peserta dan ${newPendampingList.length} pendamping.`);
        setMessageType('info');
      } catch (error) { // <-- Perbaikan dari 'any'
            if (error instanceof Error) {
                setMessage(`Gagal proses Excel: ${error.message}`);
            } else {
                setMessage('Gagal memproses Excel karena kesalahan tidak diketahui.');
            }
            setMessageType('error');
          }
        };
    reader.readAsBinaryString(file);
  };
  
const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let matchedCount = 0;
    const updatedPesertaList = [...pesertaList];

    for (const file of files) {
      // Ambil nama file tanpa ekstensi dan ubah ke huruf kecil
      const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.').toLowerCase();
      
      // Cari peserta yang belum punya foto cocok
      const matchedPesertaIndex = updatedPesertaList.findIndex(p => {
        if (p.status === 'Foto Cocok') {
          return false;
        }
        const firstNameFromExcel = p.nama_lengkap.split(' ')[0].toLowerCase();
        return firstNameFromExcel === fileNameWithoutExt || p.nama_lengkap.toLowerCase() === fileNameWithoutExt;
      });

      if (matchedPesertaIndex !== -1) {
        // Cek lagi agar tidak menimpa foto yang sudah ada di iterasi yang sama
        if (updatedPesertaList[matchedPesertaIndex].status !== 'Foto Cocok') {
            updatedPesertaList[matchedPesertaIndex].foto_file = file;
            updatedPesertaList[matchedPesertaIndex].status = 'Foto Cocok';
            matchedCount++;
        }
      }
    }

    setPesertaList(updatedPesertaList);
    setMessage(`${matchedCount} foto berhasil dicocokkan. Periksa daftar verifikasi.`);
    setMessageType('info');
  };

  const stats = useMemo(() => {
    const totalPeserta = pesertaList.length;
    const totalPendamping = pendampingList.length;
    const fotoSiap = pesertaList.filter(p => p.status === 'Foto Cocok').length;
    const biayaPeserta = totalPeserta * HARGA_PESERTA;
    const biayaPendamping = totalPendamping * HARGA_PENDAMPING;
    const totalBiaya = biayaPeserta + biayaPendamping;
    return { totalPeserta, totalPendamping, fotoSiap, biayaPeserta, biayaPendamping, totalBiaya };
  }, [pesertaList, pendampingList]);

  const nextStep = () => {
    // Validasi untuk langkah 1 -> 2
    if (step === 1 && (!namaSekolah || !namaPembina || !nomorWhatsapp)) {
        setMessage('Harap lengkapi semua data sekolah dan pembina.');
        setMessageType('error');
        return;
    }

    // Validasi untuk langkah 2 -> 3 (YANG DIPERBARUI)
    if (step === 2) {
      if (pesertaList.length === 0) {
        setMessage('Anda belum mengunggah daftar peserta. Harap unggah file Excel.');
        setMessageType('error');
        return;
      }
      if (stats.fotoSiap < stats.totalPeserta) {
        setMessage(`Masih ada ${stats.totalPeserta - stats.fotoSiap} foto peserta yang belum cocok. Harap lengkapi semua foto.`);
        setMessageType('error');
        return;
      }
    }

    // Jika semua validasi lolos, lanjutkan ke langkah berikutnya
    setMessage('');
    setMessageType('info');
    setStep(prev => prev + 1);
  }
  
  const prevStep = () => setStep(prev => prev - 1);
  
  const handleProceedToPayment = (e: FormEvent) => {
    e.preventDefault();
    setData({ namaPembina, namaSekolah, nomorWhatsapp, kategori, pesertaList, pendampingList });
    router.push('/pembayaran');
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="bg-zinc-50 font-sans text-zinc-800">
      <div className="container mx-auto px-4 py-8 sm:py-8 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
           <Image
              src="/logo-pmi.png"
              alt="Logo PMI"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">Pendaftaran Pelantikan & Pelatihan PMR Tingkat Wira dan Madya <br />Se-Kabupaten Cianjur</h1>
            <p className="text-lg font-bold text-zinc-900 mt-2">Tahun 2025</p>
          </div>
          
          <div className="flex justify-between items-center mb-10 px-2">
            {['Sekolah', 'Peserta', 'Konfirmasi'].map((title, index) => (
              <React.Fragment key={title}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= index + 1 ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                    {step > index + 1 ? <CheckCircle size={24} /> : index + 1}
                  </div>
                  <span className={`mt-2 text-xs sm:text-sm font-semibold transition-colors duration-300 ${step >= index + 1 ? 'text-red-600' : 'text-zinc-400'}`}>{title}</span>
                </div>
                {index < 2 && <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${step > index + 1 ? 'bg-red-600' : 'bg-zinc-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
            <form onSubmit={handleProceedToPayment} className="space-y-8">
              {step === 1 && (
                <section className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-semibold text-zinc-900 border-b pb-3">1. Data Sekolah & Pembina</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2"><FormInput id="namaSekolah" label="Nama Sekolah" icon={University} type="text" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} required /></div>
                    <FormInput id="namaPembina" label="Nama Pembina/Pelatih" icon={User} type="text" value={namaPembina} onChange={(e) => setNamaPembina(e.target.value)} required />
                    <FormInput id="nomorWhatsapp" label="Nomor WhatsApp" icon={Phone} type="tel" value={nomorWhatsapp} onChange={(e) => setNomorWhatsapp(e.target.value)} required />
                    <div className="sm:col-span-2"><FormSelect id="kategori" label="Kategori" icon={ListChecks} value={kategori} onChange={(e) => setKategori(e.target.value)}><option value="Madya">Madya (SMP/Sederajat)</option><option value="Wira">Wira (SMA/Sederajat)</option></FormSelect></div>
                  </div>
                </section>
              )}
              {step === 2 && (
                 <section className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-semibold text-zinc-900 border-b pb-3">2. Data Peserta & Pendamping</h2>
                  <div className="bg-zinc-50 p-4 rounded-lg space-y-4">
                    <div>
                      <h3 className="font-semibold text-zinc-800">Langkah A: Unggah Data Excel</h3>
                      <p className="text-sm text-zinc-500 mt-1">Unduh template, lalu isi sheet `Peserta` dan `Pendamping`.</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-3">
                        <a href="/template-pendaftaran.xlsx" download className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-zinc-300 text-zinc-800 px-4 py-2.5 rounded-lg hover:bg-zinc-100 text-sm font-semibold transition"><FileDown size={16} /> Unduh Template</a>
                        <label className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 text-sm font-semibold cursor-pointer transition"><UploadCloud size={16} /> Unggah Excel<input type="file" onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden"/></label>
                      </div>
                    </div>
                    {pesertaList.length > 0 && (
                      <div className="pt-4 border-t border-zinc-200">
                        <h3 className="font-semibold text-zinc-800">Langkah B: Unggah Foto Peserta</h3>
                        <p className="text-sm text-zinc-500 mt-1">Pastikan nama file foto sama dengan nama peserta di Excel.</p>
                        <label className="mt-3 inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-2.5 rounded-lg hover:bg-zinc-700 text-sm font-semibold cursor-pointer transition"><UploadCloud size={16} /> Pilih Semua Foto<input type="file" multiple onChange={handlePhotoUpload} accept="image/png, image/jpeg" className="hidden"/></label>
                      </div>
                    )}
                  </div>
                  {(pesertaList.length > 0 || pendampingList.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="border p-3 rounded-lg"><h3 className="font-bold text-sm mb-2">Verifikasi Peserta ({stats.totalPeserta})</h3><div className="max-h-48 overflow-y-auto space-y-1 pr-2">{pesertaList.map((p, i) => (<div key={`p-${i}`} className="flex justify-between items-center text-sm p-2 bg-zinc-50 rounded-md"><span>{p.nama_lengkap}</span><span className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${p.status === 'Foto Cocok' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status === 'Foto Cocok' ? <CheckCircle size={12}/> : <Info size={12}/>} {p.status}</span></div>))}</div></div>
                        <div className="border p-3 rounded-lg"><h3 className="font-bold text-sm mb-2">Verifikasi Pendamping ({stats.totalPendamping})</h3><div className="max-h-48 overflow-y-auto space-y-1 pr-2">{pendampingList.map((p, i) => (<div key={`d-${i}`} className="flex items-center text-sm p-2 bg-zinc-50 rounded-md"><Users size={14} className="mr-2"/><span>{p.nama_lengkap}</span></div>))}</div></div>
                    </div>
                  )}
                </section>
              )}
              {step === 3 && (
                 <section className="space-y-6 animate-fade-in">
                  <h2 className="text-2xl font-semibold text-zinc-900 border-b pb-3">3. Konfirmasi & Rincian Biaya</h2>
                  <div className="p-4 bg-zinc-50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-zinc-600">Nama Sekolah:</span><span className="font-semibold text-zinc-900">{namaSekolah}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-zinc-600">Nama Pembina:</span><span className="font-semibold text-zinc-900">{namaPembina}</span></div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-4"><Wallet size={20} className="text-red-600" /><h3 className="text-lg font-semibold text-zinc-900">Rincian Biaya</h3></div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><p className="text-zinc-600">Biaya Peserta ({stats.totalPeserta} x {formatRupiah(HARGA_PESERTA)})</p><p className="font-medium text-zinc-800">{formatRupiah(stats.biayaPeserta)}</p></div>
                      <div className="flex justify-between"><p className="text-zinc-600">Biaya Pendamping ({stats.totalPendamping} x {formatRupiah(HARGA_PENDAMPING)})</p><p className="font-medium text-zinc-800">{formatRupiah(stats.biayaPendamping)}</p></div>
                      <div className="border-t border-zinc-200 my-2"></div>
                      <div className="flex justify-between items-center"><p className="font-bold text-zinc-900">TOTAL TAGIHAN</p><p className="font-bold text-xl text-red-600">{formatRupiah(stats.totalBiaya)}</p></div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-zinc-500">Pastikan semua data sudah benar. Anda akan diarahkan ke halaman pembayaran setelah menekan tombol di bawah.</p>
                </section>
              )}
              <div className="pt-6 border-t mt-2">
                {message && (<div className={`p-3 rounded-lg mb-4 flex items-center gap-3 text-sm font-medium ${messageType === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{messageType === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}<span>{message}</span></div>)}
                <div className="flex justify-between items-center">
                  <button type="button" onClick={prevStep} className={`inline-flex items-center gap-2 bg-zinc-200 text-zinc-800 px-4 py-2.5 rounded-lg hover:bg-zinc-300 font-semibold transition ${step > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><ArrowLeft size={16} /> Kembali</button>
                  <div>
                    {step < 3 && (<button type="button" onClick={nextStep} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-semibold transition shadow-sm hover:shadow-md">Lanjut <ArrowRight size={16} /></button>)}
                    {step === 3 && (<button type="submit" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-bold text-base transition shadow-sm hover:shadow-md"><Send size={16} /> Lanjut ke Pembayaran</button>)}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}