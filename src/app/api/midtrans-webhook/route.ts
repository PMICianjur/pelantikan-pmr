import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

// Buat Supabase client khusus untuk Route Handler ini
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const notification = await request.json();

  // --- PERBAIKAN DIMULAI DI SINI ---
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  // Pengecekan environment variable
  if (!serverKey || !clientKey) {
    console.error("Missing Midtrans environment variables");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const snap = new Midtrans.Snap({
    isProduction: false,
    serverKey: serverKey, // Sekarang TypeScript yakin ini adalah string
    clientKey: clientKey  // Sekarang TypeScript yakin ini adalah string
  });
  // --- AKHIR PERBAIKAN ---

  try {
    const statusResponse = await snap.transaction.notification(notification);
    let orderId = statusResponse.order_id;
    let transactionStatus = statusResponse.transaction_status;
    let fraudStatus = statusResponse.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}, Transaction status: ${transactionStatus}, Fraud status: ${fraudStatus}`);

    if (transactionStatus == 'settlement' && fraudStatus == 'accept') {
      const { error } = await supabaseAdmin
          .from('pendaftaran')
          .update({ status: 'PAID' })
          .eq('id', orderId);

      if (error) {
        console.error(`Webhook: Gagal update status di database untuk order ID ${orderId}:`, error.message);
      } else {
        console.log(`Webhook: Sukses update status menjadi PAID untuk order ID ${orderId}`);
      }
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