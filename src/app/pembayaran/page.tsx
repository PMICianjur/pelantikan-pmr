'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useRegistrationStore } from '@/lib/store';
import { Loader2, ShieldCheck, Wallet, AlertCircle } from 'lucide-react';
import Image from 'next/image';

// Memberitahu TypeScript tentang adanya object 'snap' di object 'window'
declare global {
    interface Window {
        snap: any;
    }
}

export default function MidtransPaymentPage() {
    const router = useRouter();
    
    // Ambil semua data yang relevan dari store Zustand
    const { 
        namaPembina, namaSekolah, nomorWhatsapp, kategori, pesertaList, pendampingList, 
        lahanDipilihId, biayaSewaTenda, totalBiaya, reset 
    } = useRegistrationStore();

    const [loading, setLoading] = useState(false);
    const [pageReady, setPageReady] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Load script Midtrans Snap secara dinamis
        const script = document.createElement('script');
        script.src = "https://app.sandbox.midtrans.com/snap/snap.js"; // Ganti ke URL produksi jika sudah live
        script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!);
        script.async = true;
        document.body.appendChild(script);

        // Cek apakah data pendaftaran ada di store. Jika tidak (karena refresh), arahkan kembali.
        if (!namaSekolah) {
            const timer = setTimeout(() => {
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

        return () => {
            // Bersihkan script saat komponen unmount
            document.body.removeChild(script);
        };
    }, [namaSekolah, router]);

 const handleBayar = async () => {
        setLoading(true);
        setError('');

        try {
            // LANGKAH A: Simpan semua data awal ke database
            const { data: pendaftaranData, error: pendaftaranError } = await supabase
                .from('pendaftaran')
                .insert({
                    nama_pembina: namaPembina, nama_sekolah: namaSekolah, nomor_whatsapp: nomorWhatsapp, kategori,
                    jumlah_peserta: pesertaList.length, jumlah_pendamping: pendampingList.length,
                    biaya_sewa_tenda: biayaSewaTenda, total_biaya_keseluruhan: totalBiaya,
                    status: 'PENDING_PAYMENT'
                }).select('id').single();

            // --- PERBAIKAN DI SINI ---
            // Pengecekan tegas untuk memastikan kita mendapatkan ID sebelum melanjutkan.
            if (pendaftaranError) throw new Error(`Gagal menyimpan pendaftaran utama: ${pendaftaranError.message}`);
            if (!pendaftaranData?.id) {
                throw new Error('Gagal mendapatkan ID pendaftaran setelah menyimpan data awal.');
            }
            
            // Karena sudah melewati pengecekan, pendaftaranId di sini DIJAMIN berupa angka.
            const pendaftaranId = pendaftaranData.id;
            // --- AKHIR PERBAIKAN ---

            // Proses data terkait lainnya...
            if (lahanDipilihId) {
                await supabase.from('lahan').update({ pendaftaran_id: pendaftaranId }).eq('id', lahanDipilihId);
            }
            for (const peserta of pesertaList) {
                if (!peserta.foto_file) continue;
                const fotoPath = `peserta/${pendaftaranId}/${peserta.nama_lengkap.replace(/ /g, '_')}.jpg`;
                await supabase.storage.from('file-peserta').upload(fotoPath, peserta.foto_file);
                const { data: urlData } = supabase.storage.from('file-peserta').getPublicUrl(fotoPath);
                await supabase.from('peserta').insert({
                    nama_lengkap: peserta.nama_lengkap, foto_url: urlData.publicUrl, pendaftaran_id: pendaftaranId, nama_sekolah: namaSekolah,
                });
            }
            if (pendampingList.length > 0) {
                const pendampingToInsert = pendampingList.map(p => ({
                    nama_lengkap: p.nama_lengkap, pendaftaran_id: pendaftaranId, nama_sekolah: namaSekolah
                }));
                await supabase.from('pendamping').insert(pendampingToInsert);
            }
            
            // LANGKAH B: Request token transaksi ke backend kita
            const response = await fetch('/api/create-midtrans-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: pendaftaranId.toString(),
                    gross_amount: totalBiaya,
                    customer_details: {
                        first_name: namaPembina,
                        phone: nomorWhatsapp,
                        email: `${nomorWhatsapp}@email.com` // Email dummy jika tidak ada
                    }
                }),
            });

            const { token, error: tokenError } = await response.json();
            if (tokenError) throw new Error(`Gagal mendapatkan token pembayaran: ${tokenError}`);

            // LANGKAH C: Buka popup pembayaran Midtrans
            window.snap.pay(token, {
                onSuccess: (result: any) => { reset(); router.push('/status/sukses'); },
                onPending: (result: any) => { reset(); router.push('/'); },
                onError: (result: any) => { setError('Pembayaran gagal atau dibatalkan.'); },
                onClose: () => { setError('Anda menutup jendela pembayaran sebelum selesai.'); }
            });

        } catch (err) {
            if (err instanceof Error) { setError(`Terjadi kesalahan: ${err.message}`); } 
            else { setError('Terjadi kesalahan yang tidak diketahui.'); }
        } finally {
            setLoading(false);
        }
    };
    const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

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
                    <h1 className="text-3xl font-bold text-zinc-900">Pembayaran Pendaftaran</h1>
                    <p className="text-md text-zinc-500 mt-2">Sekolah: <span className="font-semibold text-zinc-700">{namaSekolah}</span></p>
                </div>
                <div className="space-y-6">
                    <div className="text-center bg-zinc-50 p-6 rounded-xl">
                        <p className="text-sm font-medium text-zinc-600 uppercase tracking-wider">Total Tagihan</p>
                        <p className="text-5xl font-bold text-red-600 tracking-tight mt-1">{formatRupiah(totalBiaya)}</p>
                    </div>
                    {error && <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg"><AlertCircle size={16}/><span>{error}</span></div>}
                    <button onClick={handleBayar} disabled={loading} className="w-full inline-flex justify-center items-center gap-2 bg-zinc-900 text-white p-4 rounded-xl font-semibold text-base hover:bg-red-600 transition-all duration-300 disabled:bg-zinc-400 disabled:cursor-not-allowed">
                        {loading ? <Loader2 className="animate-spin" /> : <Wallet />}
                        {loading ? 'Mempersiapkan Pembayaran...' : 'Bayar Sekarang dengan Midtrans'}
                    </button>
                    <div className="text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} /> Transaksi aman dan terenkripsi oleh Midtrans.
                    </div>
                </div>
            </div>
        </div>
    );
}