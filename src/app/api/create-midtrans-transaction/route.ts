import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';

export async function POST(request: Request) {
  try {
    const { order_id, gross_amount, customer_details } = await request.json();

    // Validasi data yang masuk
    if (!order_id || !gross_amount || !customer_details) {
      return NextResponse.json({ error: 'Data tidak lengkap untuk membuat transaksi.' }, { status: 400 });
    }

    // Ambil kunci API dari environment variables
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    // Pastikan kunci API ada untuk mencegah error saat build/runtime
    if (!serverKey || !clientKey) {
      console.error("Kunci API Midtrans tidak lengkap di server.");
      return NextResponse.json({ error: "Konfigurasi server error." }, { status: 500 });
    }
    
    // Inisialisasi Midtrans Snap
    const snap = new Midtrans.Snap({
      // Ganti ke `true` saat website Anda sudah siap menerima pembayaran sungguhan
      isProduction: false,
      serverKey: serverKey,
      clientKey: clientKey
    });

    // --- PERUBAHAN DI SINI ---
    // Siapkan parameter transaksi tanpa properti `enabled_payments`
    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount
      },
      customer_details: customer_details,
    };
    // --- AKHIR PERUBAHAN ---
  
    // Buat token transaksi
    const transaction = await snap.createTransactionToken(parameter);
    console.log(`Midtrans token berhasil dibuat untuk Order ID: ${order_id}`);
    
    return NextResponse.json(transaction);

  } catch (e) {
    let errorMessage = 'Terjadi kesalahan yang tidak diketahui.';
    if (e instanceof Error) {
        errorMessage = e.message;
    }
    console.error('Error saat membuat token Midtrans:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
