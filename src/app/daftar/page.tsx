'use client'

import React, { useState, FormEvent, ChangeEvent, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { useRegistrationStore } from '../../lib/store'
import Image from 'next/image'
import { 
    UploadCloud, FileDown, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Send, Wallet, Users, Info, 
    User, Phone, University, ListChecks, Tent, MapPin, Loader2, FileText, Camera, Shield, Clock
} from 'lucide-react'

// Definisikan tipe data state
type PesertaState = {
  nama_lengkap: string;
  foto_file: File | null;
  status: 'Menunggu Foto' | 'Foto Cocok' | 'Error';
}
type PendampingState = {
  nama_lengkap: string;
}
type LahanState = {
  id: number;
  nomor_lahan: number;
  kapasitas_maks: number;
  pendaftaran_id: number | null;
}

// Definisikan Harga sebagai konstanta
const HARGA_PESERTA = 35000;
const HARGA_PENDAMPING = 25000;
const NAMA_TENDA_PANITIA: { [key: string]: string } = {
    '50': 'Tenda Pleton (Kapasitas 50)',
    '20': 'Tenda Regu (Kapasitas 20)',
    '15': 'Tenda Dome (Kapasitas 15)',
};
const HARGA_TENDA: { [key: string]: number } = {
    '50': 750000,
    '20': 400000,
    '15': 250000,
};

// Komponen-komponen UI kecil untuk konsistensi
const IconLabel = ({ icon: Icon, children }: { icon: React.ElementType, children: React.ReactNode }) => (
    <div className="flex items-center gap-3">
        <div className="p-2 bg-red-50 rounded-lg">
            <Icon className="text-red-600" size={18} />
        </div>
        <span className="font-semibold text-slate-700">{children}</span>
    </div>
);

const FormInput = ({ id, label, icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon: React.ElementType }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm">
        <IconLabel icon={icon}>{label}</IconLabel>
    </label>
    <input 
      id={id} 
      {...props} 
      className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-slate-300" 
    />
  </div>
);

const FormSelect = ({ id, label, icon, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, icon: React.ElementType }) => (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm">
        <IconLabel icon={icon}>{label}</IconLabel>
      </label>
      <select 
        id={id} 
        {...props} 
        className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-slate-300"
      >
        {children}
      </select>
    </div>
);

const StatsCard = ({ icon: Icon, title, value, color = "red" }: { icon: React.ElementType, title: string, value: string | number, color?: string }) => (
  <div className="bg-white p-4 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-all duration-200">
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-${color}-50 rounded-lg`}>
        <Icon className={`text-${color}-600`} size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

export default function DaftarPage() {
  const router = useRouter();
  const setData = useRegistrationStore((state) => state.setData);

  const [step, setStep] = useState(1);
  const [namaPembina, setNamaPembina] = useState('');
  const [namaSekolah, setNamaSekolah] = useState('');
  const [nomorWhatsapp, setNomorWhatsapp] = useState('');
  const [kategori, setKategori] = useState<'Wira' | 'Madya'>('Madya');
  const [pesertaList, setPesertaList] = useState<PesertaState[]>([]);
  const [pendampingList, setPendampingList] = useState<PendampingState[]>([]);
  
  const [sewaTenda, setSewaTenda] = useState('');
  const [jenisTendaPanitia, setJenisTendaPanitia] = useState('');
  const [kapasitasTendaSendiri, setKapasitasTendaSendiri] = useState('');
  
  const [lahanList, setLahanList] = useState<LahanState[]>([]);
  const [lahanDipilih, setLahanDipilih] = useState<LahanState | null>(null);
  const [loadingLahan, setLoadingLahan] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');

  const kapasitasTendaTerpilih = useMemo(() => {
    if (sewaTenda === 'panitia') return parseInt(jenisTendaPanitia) || 0;
    if (sewaTenda === 'sendiri') return parseInt(kapasitasTendaSendiri) || 0;
    return 0;
  }, [sewaTenda, jenisTendaPanitia, kapasitasTendaSendiri]);

  useEffect(() => {
    const fetchLahan = async () => {
      if (kapasitasTendaTerpilih > 0) {
        setLoadingLahan(true);
        setLahanDipilih(null);
        try {
          const response = await fetch(`/api/lahan?kategori=${kategori}&kapasitas=${kapasitasTendaTerpilih}`);
          if (!response.ok) throw new Error('Gagal mengambil data lahan dari server.');
          const data = await response.json();
          if(data.error) throw new Error(data.error);
          setLahanList(data);
        } catch (error) {
            if(error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage('Terjadi kesalahan tidak diketahui saat memuat lahan.');
            }
        } finally {
          setLoadingLahan(false);
        }
      } else {
        setLahanList([]);
      }
    };
    fetchLahan();
  }, [kapasitasTendaTerpilih, kategori]);

  const stats = useMemo(() => {
    const totalPeserta = pesertaList.length;
    const totalPendamping = pendampingList.length;
    const fotoSiap = pesertaList.filter(p => p.status === 'Foto Cocok').length;
    const biayaPeserta = totalPeserta * HARGA_PESERTA;
    const biayaPendamping = totalPendamping * HARGA_PENDAMPING;
    const biayaTenda = sewaTenda === 'panitia' && jenisTendaPanitia ? HARGA_TENDA[jenisTendaPanitia] || 0 : 0;
    const totalBiaya = biayaPeserta + biayaPendamping + biayaTenda;
    return { totalPeserta, totalPendamping, fotoSiap, biayaPeserta, biayaPendamping, biayaTenda, totalBiaya };
  }, [pesertaList, pendampingList, sewaTenda, jenisTendaPanitia]);

  const handleExcelUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const pesertaSheet = workbook.Sheets['Peserta'];
        if (!pesertaSheet) throw new Error("Sheet dengan nama 'Peserta' tidak ditemukan.");
        const pesertaJson = XLSX.utils.sheet_to_json(pesertaSheet) as { 'Nama Lengkap': string }[];
        const newPesertaList: PesertaState[] = pesertaJson.map(item => ({ nama_lengkap: item['Nama Lengkap'], foto_file: null, status: 'Menunggu Foto' }));
        setPesertaList(newPesertaList);
        const pendampingSheet = workbook.Sheets['Pendamping'];
        let newPendampingList: PendampingState[] = [];
        if (pendampingSheet) {
          const pendampingJson = XLSX.utils.sheet_to_json(pendampingSheet) as { 'Nama Lengkap': string }[];
          newPendampingList = pendampingJson.map(item => ({ nama_lengkap: item['Nama Lengkap'] }));
        }
        setPendampingList(newPendampingList);
        setMessage(`Berhasil impor ${newPesertaList.length} peserta dan ${newPendampingList.length} pendamping.`);
        setMessageType('info');
      } catch (error) {
        if (error instanceof Error) {
          setMessage(`Gagal memproses file Excel: ${error.message}`);
        } else {
          setMessage('Gagal memproses file Excel karena kesalahan tidak diketahui.');
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
        const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.').toLowerCase();
        const matchedPesertaIndex = updatedPesertaList.findIndex(p => {
            if (p.status === 'Foto Cocok') return false;
            const firstNameFromExcel = p.nama_lengkap.split(' ')[0].toLowerCase();
            return firstNameFromExcel === fileNameWithoutExt || p.nama_lengkap.toLowerCase() === fileNameWithoutExt;
        });
        if (matchedPesertaIndex !== -1 && updatedPesertaList[matchedPesertaIndex].status !== 'Foto Cocok') {
            updatedPesertaList[matchedPesertaIndex].foto_file = file;
            updatedPesertaList[matchedPesertaIndex].status = 'Foto Cocok';
            matchedCount++;
        }
    }
    setPesertaList(updatedPesertaList);
    setMessage(`${matchedCount} foto berhasil dicocokkan. Periksa daftar verifikasi.`);
    setMessageType('info');
  };

  const nextStep = () => {
    if (step === 1 && (!namaSekolah || !namaPembina || !nomorWhatsapp)) {
        setMessage('Harap lengkapi semua data sekolah dan pembina.'); 
        setMessageType('error'); 
        return;
    }
    if (step === 2) {
      if (pesertaList.length === 0) {
        setMessage('Anda belum mengunggah daftar peserta.'); 
        setMessageType('error'); 
        return;
      }
      if (stats.fotoSiap < stats.totalPeserta) {
        setMessage(`Masih ada ${stats.totalPeserta - stats.fotoSiap} foto peserta yang belum cocok.`); 
        setMessageType('error'); 
        return;
      }
    }
    if (step === 3) {
      if (!lahanDipilih) {
        setMessage('Anda harus memilih satu kavling di denah untuk melanjutkan.'); 
        setMessageType('error'); 
        return;
      }
    }
    setMessage('');
    setMessageType('info');
    setStep(prev => prev + 1);
  }
  
  const prevStep = () => setStep(prev => prev - 1);
  
  const handleProceedToPayment = (e: FormEvent) => {
    e.preventDefault();
    setData({
      namaPembina, namaSekolah, nomorWhatsapp, kategori,
      pesertaList, pendampingList,
      lahanDipilihId: lahanDipilih?.id || null,
      sewaTendaOpsi: sewaTenda,
      jenisTendaPanitia: sewaTenda === 'panitia' ? jenisTendaPanitia : kapasitasTendaSendiri,
      biayaSewaTenda: stats.biayaTenda,
      totalBiaya: stats.totalBiaya
    });
    router.push('/pembayaran');
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 font-sans text-slate-800">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
                    <Image src="/logo-pmi.png" alt="Logo PMI" width={60} height={60} className="rounded-full"/>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
                    Pendaftaran Pelantikan PMR
                </h1>
                <p className="text-xl text-slate-600 mb-2">Kabupaten Cianjur 2025</p>
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <Shield size={16} />
                    Proses Aman & Terpercaya
                </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex justify-between items-center mb-12 px-4">
                {['Sekolah', 'Peserta', 'Tenda & Lahan', 'Konfirmasi'].map((title, index) => (
                <React.Fragment key={title}>
                    <div className="flex flex-col items-center text-center flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-lg ${
                            step >= index + 1 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200' 
                                : 'bg-white text-slate-400 border-2 border-slate-200'
                        }`}>
                            {step > index + 1 ? <CheckCircle size={24} /> : index + 1}
                        </div>
                        <span className={`mt-3 text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                            step >= index + 1 ? 'text-red-600' : 'text-slate-400'
                        }`}>
                            {title}
                        </span>
                    </div>
                    {index < 3 && (
                        <div className={`flex-1 h-2 mx-4 rounded-full transition-all duration-300 ${
                            step > index + 1 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-slate-200'
                        }`} />
                    )}
                </React.Fragment>
                ))}
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <form onSubmit={handleProceedToPayment} className="p-8 sm:p-12">
                    
                    {/* Step 1: School Information */}
                    {step === 1 && (
                        <section className="space-y-8 animate-fade-in">
                            <div className="text-center pb-6 border-b border-slate-100">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Data Sekolah & Pembina</h2>
                                <p className="text-slate-600">Lengkapi informasi dasar sekolah dan pembina PMR</p>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="lg:col-span-2">
                                    <FormInput 
                                        id="namaSekolah" 
                                        label="Nama Sekolah" 
                                        icon={University} 
                                        type="text" 
                                        value={namaSekolah} 
                                        onChange={(e) => setNamaSekolah(e.target.value)} 
                                        required 
                                        placeholder="Contoh: SMP Negeri 1 Cianjur"
                                    />
                                </div>
                                <FormInput 
                                    id="namaPembina" 
                                    label="Nama Pembina/Pelatih" 
                                    icon={User} 
                                    type="text" 
                                    value={namaPembina} 
                                    onChange={(e) => setNamaPembina(e.target.value)} 
                                    required 
                                    placeholder="Nama lengkap pembina"
                                />
                                <FormInput 
                                    id="nomorWhatsapp" 
                                    label="Nomor WhatsApp" 
                                    icon={Phone} 
                                    type="tel" 
                                    value={nomorWhatsapp} 
                                    onChange={(e) => setNomorWhatsapp(e.target.value)} 
                                    required 
                                    placeholder="08xxxxxxxxxx"
                                />
                                <div className="lg:col-span-2">
                                    <FormSelect 
                                        id="kategori" 
                                        label="Kategori Peserta" 
                                        icon={ListChecks} 
                                        value={kategori} 
                                        onChange={(e) => setKategori(e.target.value as 'Wira' | 'Madya')}
                                    >
                                        <option value="Madya">Madya (SMP/Sederajat)</option>
                                        <option value="Wira">Wira (SMA/Sederajat)</option>
                                    </FormSelect>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 2: Participants */}
                    {step === 2 && (
                        <section className="space-y-8 animate-fade-in">
                            <div className="text-center pb-6 border-b border-slate-100">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Data Peserta & Pendamping</h2>
                                <p className="text-slate-600">Upload data Excel dan foto peserta</p>
                            </div>

                            {/* Upload Instructions */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <FileText className="text-blue-600" size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800">Langkah 1: Upload Data Excel</h3>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-4">
                                            Unduh template, isi sheet "Peserta" dan "Pendamping", lalu upload kembali.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <a 
                                                href="/template-pendaftaran.xlsx" 
                                                download 
                                                className="flex items-center justify-center gap-2 bg-white border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-50 font-semibold transition-all duration-200 shadow-sm"
                                            >
                                                <FileDown size={18} /> 
                                                Unduh Template Excel
                                            </a>
                                            <label className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold cursor-pointer transition-all duration-200 shadow-sm">
                                                <UploadCloud size={18} /> 
                                                Upload File Excel
                                                <input 
                                                    type="file" 
                                                    onChange={handleExcelUpload} 
                                                    accept=".xlsx, .xls" 
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {pesertaList.length > 0 && (
                                        <div className="pt-6 border-t border-blue-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Camera className="text-green-600" size={20} />
                                                </div>
                                                <h3 className="font-bold text-slate-800">Langkah 2: Upload Foto Peserta</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">
                                                Pastikan nama file foto sama dengan nama peserta (tanpa ekstensi).
                                            </p>
                                            <label className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-semibold cursor-pointer transition-all duration-200 shadow-sm">
                                                <UploadCloud size={18} /> 
                                                Pilih Semua Foto
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    onChange={handlePhotoUpload} 
                                                    accept="image/png, image/jpeg" 
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Statistics Cards */}
                            {pesertaList.length > 0 && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatsCard icon={Users} title="Total Peserta" value={stats.totalPeserta} />
                                    <StatsCard icon={Users} title="Pendamping" value={stats.totalPendamping} color="blue" />
                                    <StatsCard icon={CheckCircle} title="Foto Siap" value={stats.fotoSiap} color="green" />
                                    <StatsCard icon={Clock} title="Menunggu" value={stats.totalPeserta - stats.fotoSiap} color="yellow" />
                                </div>
                            )}

                            {/* Verification Lists */}
                            {(pesertaList.length > 0 || pendampingList.length > 0) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {pesertaList.length > 0 && (
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <Users size={20} className="text-red-600" />
                                                Verifikasi Peserta ({stats.totalPeserta})
                                            </h3>
                                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                                {pesertaList.map((p, i) => (
                                                    <div key={`p-${i}`} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100">
                                                        <span className="font-medium text-slate-700">{p.nama_lengkap}</span>
                                                        <span className={`flex items-center gap-2 px-3 py-1 text-xs rounded-full font-semibold ${
                                                            p.status === 'Foto Cocok' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {p.status === 'Foto Cocok' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {pendampingList.length > 0 && (
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <Shield size={20} className="text-blue-600" />
                                                Daftar Pendamping ({stats.totalPendamping})
                                            </h3>
                                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                                {pendampingList.map((p, i) => (
                                                    <div key={`d-${i}`} className="flex items-center p-3 bg-white rounded-xl border border-slate-100">
                                                        <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                                            <User size={14} className="text-blue-600" />
                                                        </div>
                                                        <span className="font-medium text-slate-700">{p.nama_lengkap}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Step 3: Tent & Location */}
                    {step === 3 && (
                        <section className="space-y-8 animate-fade-in">
                            <div className="text-center pb-6 border-b border-slate-100">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-3">
                                    <Tent className="text-red-600" />
                                    Opsi Tenda & Pemilihan Lahan
                                </h2>
                                <p className="text-slate-600">Pilih opsi tenda dan kavling lokasi acara</p>
                            </div>

                            {/* Tent Options */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-4">Pilih Opsi Tenda:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className={`p-6 border-2 rounded-2xl cursor-pointer text-center transition-all duration-200 ${
                                            sewaTenda === 'panitia' 
                                                ? 'border-red-500 bg-red-50 ring-4 ring-red-100' 
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}>
                                            <input 
                                                type="radio" 
                                                name="sewaTenda" 
                                                value="panitia" 
                                                onChange={e => {setSewaTenda(e.target.value); setKapasitasTendaSendiri('');}} 
                                                className="sr-only"
                                            />
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={`p-3 rounded-full ${sewaTenda === 'panitia' ? 'bg-red-100' : 'bg-slate-100'}`}>
                                                    <Tent className={sewaTenda === 'panitia' ? 'text-red-600' : 'text-slate-500'} size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Sewa dari Panitia</h4>
                                                    <p className="text-sm text-slate-600 mt-1">Tenda disediakan oleh panitia</p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`p-6 border-2 rounded-2xl cursor-pointer text-center transition-all duration-200 ${
                                            sewaTenda === 'sendiri' 
                                                ? 'border-red-500 bg-red-50 ring-4 ring-red-100' 
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}>
                                            <input 
                                                type="radio" 
                                                name="sewaTenda" 
                                                value="sendiri" 
                                                onChange={e => {setSewaTenda(e.target.value); setJenisTendaPanitia('');}} 
                                                className="sr-only"
                                            />
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={`p-3 rounded-full ${sewaTenda === 'sendiri' ? 'bg-red-100' : 'bg-slate-100'}`}>
                                                    <Users className={sewaTenda === 'sendiri' ? 'text-red-600' : 'text-slate-500'} size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">Bawa Tenda Sendiri</h4>
                                                    <p className="text-sm text-slate-600 mt-1">Menggunakan tenda milik sekolah</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Tent Selection */}
                                {sewaTenda === 'panitia' && (
                                    <div className="animate-fade-in bg-blue-50 rounded-2xl p-6 border border-blue-200">
                                        <FormSelect 
                                            id="jenisTenda" 
                                            label="Pilih Tenda Panitia" 
                                            icon={ListChecks} 
                                            value={jenisTendaPanitia} 
                                            onChange={e => setJenisTendaPanitia(e.target.value)}
                                        >
                                            <option value="">-- Pilih Kapasitas --</option>
                                            <option value="50">Tenda Pleton (Kapasitas 50) - {formatRupiah(HARGA_TENDA['50'])}</option>
                                            <option value="20">Tenda Regu (Kapasitas 20) - {formatRupiah(HARGA_TENDA['20'])}</option>
                                            <option value="15">Tenda Dome (Kapasitas 15) - {formatRupiah(HARGA_TENDA['15'])}</option>
                                        </FormSelect>
                                    </div>
                                )}

                                {sewaTenda === 'sendiri' && (
                                    <div className="animate-fade-in bg-green-50 rounded-2xl p-6 border border-green-200">
                                        <FormSelect 
                                            id="kapasitasSendiri" 
                                            label="Pilih Kapasitas Tenda yang Dibawa" 
                                            icon={Users} 
                                            value={kapasitasTendaSendiri} 
                                            onChange={e => setKapasitasTendaSendiri(e.target.value)}
                                        >
                                            <option value="">-- Pilih Kapasitas --</option>
                                            <option value="15">Kapasitas 15 Orang</option>
                                            <option value="20">Kapasitas 20 Orang</option>
                                            <option value="50">Kapasitas 50 Orang</option>
                                        </FormSelect>
                                    </div>
                                )}
                            </div>

                            {/* Location Selection */}
                            {kapasitasTendaTerpilih > 0 && (
                                <div className="pt-8 border-t border-slate-200">
                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
                                            <MapPin className="text-red-600"/>
                                            Pilih Kavling di Denah ({kategori})
                                        </h3>
                                        <p className="text-slate-600">Klik pada nomor kavling yang tersedia untuk memilih lokasi</p>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                        <div className="text-center mb-6">
                                            <Image 
                                                src="/denah.png" 
                                                alt="Denah Lokasi Kavling" 
                                                width={800} 
                                                height={1000} 
                                                className="w-full max-w-2xl mx-auto h-auto border rounded-xl shadow-sm bg-white"
                                            />
                                        </div>

                                        {loadingLahan ? (
                                            <div className="flex justify-center items-center h-32">
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="animate-spin text-red-600" size={24}/>
                                                    <span className="text-slate-600">Memuat kavling tersedia...</span>
                                                </div>
                                            </div>
                                        ) : lahanList.length === 0 ? (
                                            <div className="p-6 bg-yellow-50 text-yellow-800 text-center rounded-xl border border-yellow-200">
                                                <AlertCircle className="mx-auto mb-2" size={24} />
                                                <p className="font-semibold">Tidak ada kavling tersedia</p>
                                                <p className="text-sm">Untuk kategori dan kapasitas tenda yang dipilih</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-8 md:grid-cols-12 gap-3 p-6 bg-white rounded-xl border border-slate-200 mb-6">
                                                    {lahanList.map(lahan => {
                                                        const isBooked = lahan.pendaftaran_id !== null;
                                                        const isSelected = lahan.id === lahanDipilih?.id;
                                                        return (
                                                            <button 
                                                                type="button" 
                                                                key={lahan.id} 
                                                                disabled={isBooked} 
                                                                onClick={() => setLahanDipilih(lahan)} 
                                                                className={`p-3 aspect-square flex items-center justify-center rounded-xl font-bold text-sm transition-all duration-200 ${
                                                                    isBooked 
                                                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                                                        : isSelected 
                                                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white ring-4 ring-red-200 shadow-lg transform scale-105' 
                                                                            : 'bg-white border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-700 shadow-sm hover:shadow-md'
                                                                }`}
                                                            >
                                                                {lahan.nomor_lahan}
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                                <div className="flex flex-wrap justify-center gap-6 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded bg-white border-2 border-slate-200 shadow-sm"></div>
                                                        <span className="text-slate-600 font-medium">Tersedia</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded bg-gradient-to-r from-red-500 to-red-600 shadow-sm"></div>
                                                        <span className="text-slate-600 font-medium">Pilihan Anda</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded bg-slate-300"></div>
                                                        <span className="text-slate-600 font-medium">Sudah Dipesan</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <section className="space-y-8 animate-fade-in">
                            <div className="text-center pb-6 border-b border-slate-100">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Konfirmasi & Rincian Biaya</h2>
                                <p className="text-slate-600">Periksa kembali data pendaftaran sebelum melanjutkan</p>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Info size={20} className="text-blue-600" />
                                    Ringkasan Pendaftaran
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-600">Nama Sekolah:</span>
                                            <span className="font-bold text-slate-900">{namaSekolah}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-600">Kategori:</span>
                                            <span className="font-bold text-slate-900">{kategori}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-600">Opsi Tenda:</span>
                                            <span className="font-bold text-slate-900">
                                                {sewaTenda === 'panitia' && NAMA_TENDA_PANITIA[jenisTendaPanitia]}
                                                {sewaTenda === 'sendiri' && `Bawa Sendiri (${kapasitasTendaSendiri})`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-600">Kavling:</span>
                                            <span className="font-bold text-red-600">No. {lahanDipilih?.nomor_lahan}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-red-100 rounded-xl">
                                        <Wallet size={24} className="text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">Rincian Biaya</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-700">Biaya Peserta</p>
                                            <p className="text-sm text-slate-500">{stats.totalPeserta} peserta × {formatRupiah(HARGA_PESERTA)}</p>
                                        </div>
                                        <p className="font-bold text-slate-900">{formatRupiah(stats.biayaPeserta)}</p>
                                    </div>
                                    
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-700">Biaya Pendamping</p>
                                            <p className="text-sm text-slate-500">{stats.totalPendamping} pendamping × {formatRupiah(HARGA_PENDAMPING)}</p>
                                        </div>
                                        <p className="font-bold text-slate-900">{formatRupiah(stats.biayaPendamping)}</p>
                                    </div>
                                    
                                    {stats.biayaTenda > 0 && (
                                        <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                            <div>
                                                <p className="font-medium text-slate-700">Biaya Sewa Tenda</p>
                                                <p className="text-sm text-slate-500">{NAMA_TENDA_PANITIA[jenisTendaPanitia]}</p>
                                            </div>
                                            <p className="font-bold text-slate-900">{formatRupiah(stats.biayaTenda)}</p>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
                                        <p className="text-xl font-bold text-slate-900">TOTAL TAGIHAN</p>
                                        <p className="text-2xl font-bold text-red-600">{formatRupiah(stats.totalBiaya)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <p className="text-sm text-blue-800 font-medium">
                                    <Shield className="inline mr-2" size={16} />
                                    Pastikan semua data sudah benar. Anda akan diarahkan ke halaman pembayaran yang aman.
                                </p>
                            </div>
                        </section>
                    )}
                    
                    {/* Navigation & Messages */}
                    <div className="pt-8 border-t border-slate-200">
                        {message && (
                            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 font-medium ${
                                messageType === 'error' 
                                    ? 'bg-red-50 text-red-800 border border-red-200' 
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                                {messageType === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                                <span>{message}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                            <button 
                                type="button" 
                                onClick={prevStep} 
                                className={`inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-200 font-semibold transition-all duration-200 ${
                                    step > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                }`}
                            >
                                <ArrowLeft size={18} /> 
                                Kembali
                            </button>
                            
                            <div>
                                {step < 4 && (
                                    <button 
                                        type="button" 
                                        onClick={nextStep} 
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Lanjutkan 
                                        <ArrowRight size={18} />
                                    </button>
                                )}
                                {step === 4 && (
                                    <button 
                                        type="submit" 
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <Send size={20} /> 
                                        Lanjut ke Pembayaran
                                    </button>
                                )}
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