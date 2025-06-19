import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';

export async function POST(request: Request) {
  try {
    console.log("Memulai API Test Sederhana...");

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
      console.error("API Test: Kunci API tidak ditemukan di environment.");
      return NextResponse.json({ error: "Konfigurasi server error: Kunci API hilang." }, { status: 500 });
    }
    
    // Tes inisialisasi Midtrans Snap. Jika kunci salah, ini akan gagal.
    console.log("API Test: Mencoba inisialisasi Midtrans Snap...");
    new Midtrans.Snap({
      isProduction: false,
      serverKey: serverKey,
      clientKey: clientKey
    });
    console.log("API Test: Inisialisasi Midtrans Snap BERHASIL.");

    // Jika berhasil, jangan buat token dulu, langsung kirim pesan sukses.
    return NextResponse.json({ message: "API Test Berhasil, Kunci API valid." });

  } catch (e) {
    let errorMessage = 'Terjadi kesalahan tidak diketahui.';
    if (e instanceof Error) {
        errorMessage = e.message;
    }
    console.error('API Test: Terjadi CRASH:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}