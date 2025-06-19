'use client';

import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useRegistrationStore } from '@/lib/store';
import { Banknote, Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Image from 'next/image';

// Definisikan harga sebagai konstanta di atas komponen
const HARGA_PESERTA = 35000;
const HARGA_PENDAMPING = 15000;

export default function FinalPembayaranPage() {
    const router = useRouter();
    
    // Ambil SEMUA data pendaftaran yang relevan dari store Zustand
    const { 
        namaPembina, namaSekolah, nomorWhatsapp, kategori, 
        pesertaList, pendampingList, lahanDipilihId, reset 
    } = useRegistrationStore();

    // State lokal khusus untuk halaman ini
    const [buktiFile, setBuktiFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [pageReady, setPageReady] = useState(false);

    // Efek untuk memeriksa apakah data ada saat halaman dimuat.
    // Mencegah error jika pengguna me-refresh halaman ini.
    useEffect(() => {
        // Cek `namaSekolah` sebagai perwakilan data dari store
        if (!namaSekolah) {
            const timer = setTimeout(() => {
                // Cek lagi setelah sedikit jeda
                if (!useRegistrationStore.getState().namaSekolah) {
                    alert("Data pendaftaran tidak ditemukan. Anda akan diarahkan kembali ke halaman awal.");
                    router.push('/daftar');
                } else {
                    setPageReady(true);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setPageReady(true);
        }
    }, [namaSekolah, router]);

    // Kalkulasi biaya menggunakan useMemo agar efisien
    const { totalBiaya } = useMemo(() => {
        const biayaPeserta = pesertaList.length * HARGA_PESERTA;
        const biayaPendamping = pendampingList.length * HARGA_PENDAMPING;
        return { totalBiaya: biayaPeserta + biayaPendamping };
    }, [pesertaList, pendampingList]);
    
    // Handler untuk input file bukti pembayaran
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // Validasi ukuran file maks 5MB
                setError("Ukuran file terlalu besar. Maksimal 5MB.");
                return;
            }
            setBuktiFile(file);
            setError('');
        }
    };
    
    // Fungsi utama yang menjalankan SEMUA proses penyimpanan ke database
    const handleKonfirmasi = async () => {
        if (!buktiFile) {
            setError('Harap unggah bukti pembayaran.');
            return;
        }
        setUploading(true);
        setError('');

        try {
            // LANGKAH 1: Simpan data pendaftaran utama untuk mendapatkan ID
            const { data: pendaftaranData, error: pendaftaranError } = await supabase
                .from('pendaftaran')
                .insert({
                    nama_pembina: namaPembina,
                    nama_sekolah: namaSekolah,
                    nomor_whatsapp: nomorWhatsapp,
                    kategori: kategori,
                    jumlah_peserta: pesertaList.length,
                    jumlah_pendamping: pendampingList.length,
                    total_biaya_peserta: pesertaList.length * HARGA_PESERTA, 
                    total_biaya_pendamping: pendampingList.length * HARGA_PENDAMPING, 
                    total_biaya_keseluruhan: totalBiaya,
                    status: 'WAITING_CONFIRMATION' // Status awal setelah submit
                })
                .select('id')
                .single();

            if (pendaftaranError) throw new Error(`Gagal menyimpan pendaftaran utama: ${pendaftaranError.message}`);
            const pendaftaranId = pendaftaranData.id;

            // LANGKAH 2: Booking Lahan
            if (lahanDipilihId) {
                const { error: lahanError } = await supabase
                    .from('lahan')
                    .update({ pendaftaran_id: pendaftaranId })
                    .eq('id', lahanDipilihId);
                
                if (lahanError) {
                    // Jika booking gagal (misal: sudah dipesan), batalkan pendaftaran
                    await supabase.from('pendaftaran').delete().eq('id', pendaftaranId);
                    throw new Error('Gagal memesan lahan. Kemungkinan sudah dipesan beberapa detik lalu. Mohon ulangi pendaftaran dan pilih lahan lain.');
                }
            }

            // LANGKAH 3: Upload Bukti Pembayaran
            const buktiExt = buktiFile.name.split('.').pop();
            const buktiFileName = `${pendaftaranId}-${Date.now()}.${buktiExt}`;
            const { error: buktiUploadError } = await supabase.storage.from('bukti-pembayaran').upload(buktiFileName, buktiFile);
            if(buktiUploadError) throw new Error(`Gagal unggah bukti bayar: ${buktiUploadError.message}`);
            
            const { data: buktiUrlData } = supabase.storage.from('bukti-pembayaran').getPublicUrl(buktiFileName);
            
            // LANGKAH 4: Update URL bukti bayar di pendaftaran
            await supabase.from('pendaftaran').update({ bukti_pembayaran_url: buktiUrlData.publicUrl }).eq('id', pendaftaranId);

            // LANGKAH 5: Proses & Simpan Data Peserta
            for (const peserta of pesertaList) {
                if (!peserta.foto_file) continue;
                const fotoPath = `peserta/${pendaftaranId}/${peserta.nama_lengkap.replace(/ /g, '_')}.jpg`;
                await supabase.storage.from('file-peserta').upload(fotoPath, peserta.foto_file);
                const { data: urlData } = supabase.storage.from('file-peserta').getPublicUrl(fotoPath);
                await supabase.from('peserta').insert({
                    nama_lengkap: peserta.nama_lengkap, foto_url: urlData.publicUrl, pendaftaran_id: pendaftaranId, nama_sekolah: namaSekolah,
                });
            }

            // LANGKAH 6: Proses & Simpan Data Pendamping
            if (pendampingList.length > 0) {
                const pendampingToInsert = pendampingList.map(p => ({
                    nama_lengkap: p.nama_lengkap, pendaftaran_id: pendaftaranId, nama_sekolah: namaSekolah
                }));
                await supabase.from('pendamping').insert(pendampingToInsert);
            }

            // LANGKAH 7: Selesai! Kosongkan state dan arahkan ke halaman sukses
            reset();
            router.push('/status/sukses');

        } catch (err) {
            if (err instanceof Error) {
                setError(`Terjadi kesalahan saat submit: ${err.message}`);
            } else {
                setError('Terjadi kesalahan yang tidak diketahui.');
            }
        } finally {
            setUploading(false);
        }
    };
    
    const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    // Tampilkan loading jika data belum siap dari store
    if (!pageReady) {
        return <div className="flex justify-center items-center h-screen bg-zinc-50"><Loader2 className="animate-spin text-red-600" size={32}/></div>;
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-zinc-100 p-4 font-sans">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <Image
                        src="/logo-pmi.png"
                        alt="Logo PMI"
                        width={96}
                        height={96}
                        className="mx-auto mb-4"
                    />
                    <h1 className="text-3xl font-bold text-zinc-900">Konfirmasi Pembayaran</h1>
                    <p className="text-md text-zinc-500 mt-2">Pendaftaran an. Sekolah: <span className="font-semibold text-zinc-700">{namaSekolah}</span></p>
                </div>
                <div className="space-y-6">
                    <div className="text-center bg-zinc-50 p-6 rounded-xl">
                        <p className="text-sm font-medium text-zinc-600 uppercase tracking-wider">Total Tagihan</p>
                        <p className="text-5xl font-bold text-red-600 tracking-tight mt-1">{formatRupiah(totalBiaya)}</p>
                    </div>
                    <div className="p-5 border border-zinc-200 rounded-xl text-sm">
                        <div className="flex items-center gap-3 mb-4"><Banknote className="text-red-600" size={20}/><h3 className="font-semibold text-lg text-zinc-800">Instruksi Transfer</h3></div>
                        <div className="space-y-2 text-zinc-700">
                            <div className="flex justify-between"><span className="text-zinc-500">Bank Tujuan:</span><strong>Bank Contoh Indonesia (BCI)</strong></div>
                            <div className="flex justify-between"><span className="text-zinc-500">No. Rekening:</span><strong>123-456-7890</strong></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Atas Nama:</span><strong>Panitia Pelantikan PMR</strong></div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bukti" className="block text-sm font-semibold text-zinc-800 mb-2">Langkah Terakhir: Unggah Bukti Pembayaran</label>
                        <label htmlFor="bukti" className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50">
                            {buktiFile ? (
                                <div className="flex items-center gap-3 text-green-600"><FileText size={32} /><div className="text-left"><p className="font-semibold text-sm">File Terpilih:</p><p className="text-xs">{buktiFile.name}</p></div></div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-500"><Upload size={32} /><p className="mb-2 text-sm">Klik untuk memilih file</p><p className="text-xs">(JPG, PNG, atau PDF, maks. 5MB)</p></div>
                            )}
                        </label>
                        <input id="bukti" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf" />
                    </div>
                    {error && <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg"><AlertCircle size={16}/><span>{error}</span></div>}
                    <button onClick={handleKonfirmasi} disabled={!buktiFile || uploading} className="w-full inline-flex justify-center items-center gap-2 bg-zinc-900 text-white p-4 rounded-xl font-semibold text-base hover:bg-red-600 transition-all duration-300 disabled:bg-zinc-400 disabled:cursor-not-allowed">
                        {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                        {uploading ? 'Memproses Pendaftaran...' : 'Konfirmasi & Selesaikan Pendaftaran'}
                    </button>
                </div>
            </div>
        </div>
    );
}