import { NextResponse } from 'next/server';
import Midtrans from 'midtrans-client';

export async function POST(request: Request) {
  const { order_id, gross_amount, customer_details } = await request.json();

  // --- PERBAIKAN DIMULAI DI SINI ---
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

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

  const parameter = {
    transaction_details: {
      order_id: order_id,
      gross_amount: gross_amount
    },
    customer_details: customer_details
  };
  
  try {
    const token = await snap.createTransactionToken(parameter);
    return NextResponse.json({ token });
  } catch (e) {
    if (e instanceof Error) {
        console.error('Error creating Midtrans transaction:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
  }
}