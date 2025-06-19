import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

// HAPUS inisialisasi Supabase client dari sini

export async function POST(request: Request) {
  const notification = await request.json();

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    console.error("Missing Midtrans environment variables");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  
  // Inisialisasi Midtrans Snap di dalam fungsi
  const snap = new Midtrans.Snap({
    isProduction: false,
    serverKey: serverKey,
    clientKey: clientKey
  });

  try {
    const statusResponse = await snap.transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Webhook: Notifikasi diterima untuk Order ID ${orderId}`);

    if (transactionStatus == 'settlement' && fraudStatus == 'accept') {
      
      // --- PERBAIKAN DI SINI: Inisialisasi Supabase Client dipindahkan ke dalam ---
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      console.log(`Webhook: Memperbarui status untuk Order ID ${orderId} menjadi PAID`);
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