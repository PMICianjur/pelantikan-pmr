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

    // Siapkan parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: gross_amount
      },
      customer_details: customer_details,
      
      // --- BAGIAN UTAMA: Memaksa/Memprioritaskan Metode Pembayaran ---
      // Hanya metode pembayaran dalam daftar ini yang akan muncul di popup Snap.
      enabled_payments: [
        "qris",           // Alias umum untuk QRIS, biasanya mencakup GoPay
        "gopay",          // Spesifik untuk GoPay, akan menampilkan QRIS jika di mobile
        "shopeepay",      // Menampilkan QRIS ShopeePay
        "bca_va",         // Contoh: Virtual Account BCA
        "bni_va",         // Contoh: Virtual Account BNI
        "mandiri_va",     // Contoh: Virtual Account Mandiri
        "indomaret",      // Contoh: Pembayaran via Indomaret
        "alfamart"        // Contoh: Pembayaran via Alfamart
      ]
    };
  
    // Buat token transaksi
    const transaction = await snap.createTransactionToken(parameter);
    console.log(`Midtrans token berhasil dibuat untuk Order ID: ${order_id}`);
    
    return NextResponse.json(transaction);

  } catch (e) {
    // Penanganan error yang lebih baik
    let errorMessage = 'Terjadi kesalahan yang tidak diketahui.';
    if (e instanceof Error) {
        errorMessage = e.message;
    }
    console.error('Error saat membuat token Midtrans:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
