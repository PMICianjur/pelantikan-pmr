import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

// --- PERBAIKAN DIMULAI DI SINI: Definisikan tipe data untuk payload ---
interface PesertaFromPayload {
    nama_lengkap: string;
    foto_url: string | null;
}

interface PendampingFromPayload {
    nama_lengkap: string;
}

interface PendaftaranPayload {
    namaPembina: string;
    namaSekolah: string;
    nomorWhatsapp: string;
    kategori: 'Wira' | 'Madya';
    lahanDipilihId: number | null;
    pesertaList: PesertaFromPayload[];
    pendampingList: PendampingFromPayload[];
    biayaSewaTenda: number;
    totalBiaya: number;
}
// --- AKHIR PERBAIKAN ---

export async function POST(request: Request) {
  try {
    const notification = await request.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
      throw new Error("Kunci API Midtrans tidak lengkap di server.");
    }

    const snap = new Midtrans.Snap({
      isProduction: true,
      serverKey: serverKey,
      clientKey: clientKey,
    });

    const statusResponse = await snap.transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Webhook diterima. Order ID: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

    if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: pendingData, error: pendingError } = await supabaseAdmin
        .from('transaksi_pending')
        .select('payload')
        .eq('id', orderId)
        .single();
      
      if (pendingError || !pendingData) {
        throw new Error(`Data transaksi pending untuk order ID ${orderId} tidak ditemukan.`);
      }
      
      // --- PERBAIKAN DI SINI: Terapkan tipe pada payload ---
      const pendaftaranLengkap = pendingData.payload as PendaftaranPayload;

      const { data: pendaftaranData, error: pendaftaranError } = await supabaseAdmin
        .from('pendaftaran')
        .insert({
            nama_pembina: pendaftaranLengkap.namaPembina,
            nama_sekolah: pendaftaranLengkap.namaSekolah,
            nomor_whatsapp: pendaftaranLengkap.nomorWhatsapp,
            kategori: pendaftaranLengkap.kategori,
            jumlah_peserta: pendaftaranLengkap.pesertaList.length,
            jumlah_pendamping: pendaftaranLengkap.pendampingList.length,
            biaya_sewa_tenda: pendaftaranLengkap.biayaSewaTenda,
            total_biaya_keseluruhan: pendaftaranLengkap.totalBiaya,
            status: 'PAID'
        })
        .select('id')
        .single();
        
      if (pendaftaranError) throw new Error(`Gagal menyimpan pendaftaran final: ${pendaftaranError.message}`);
      if (!pendaftaranData) throw new Error('Gagal mendapatkan ID pendaftaran final.');
      
      const pendaftaranId = pendaftaranData.id;

      if (pendaftaranLengkap.lahanDipilihId) {
        await supabaseAdmin.from('lahan').update({ pendaftaran_id: pendaftaranId }).eq('id', pendaftaranLengkap.lahanDipilihId);
      }

      // --- PERBAIKAN DI SINI: Hapus '(p: any)' karena tipe sudah otomatis dikenali ---
      if (pendaftaranLengkap.pesertaList && pendaftaranLengkap.pesertaList.length > 0) {
        const pesertaToInsert = pendaftaranLengkap.pesertaList.map(p => ({
          nama_lengkap: p.nama_lengkap, foto_url: p.foto_url,
          pendaftaran_id: pendaftaranId, nama_sekolah: pendaftaranLengkap.namaSekolah
        }));
        await supabaseAdmin.from('peserta').insert(pesertaToInsert);
      }
      
      if (pendaftaranLengkap.pendampingList && pendaftaranLengkap.pendampingList.length > 0) {
        const pendampingToInsert = pendaftaranLengkap.pendampingList.map(p => ({
          nama_lengkap: p.nama_lengkap,
          pendaftaran_id: pendaftaranId,
          nama_sekolah: pendaftaranLengkap.namaSekolah
        }));
        await supabaseAdmin.from('pendamping').insert(pendampingToInsert);
      }

      await supabaseAdmin.from('transaksi_pending').update({ status: 'COMPLETED' }).eq('id', orderId);
    }
    
    return NextResponse.json({ status: 'ok' });

  } catch (e) {
    if (e instanceof Error) {
        console.error('Error handling Midtrans webhook:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
  }
}