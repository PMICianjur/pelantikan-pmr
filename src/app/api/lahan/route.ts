import { supabase } from "@/lib/supabaseClient";
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'; // Pastikan data selalu yang terbaru

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const kategori = searchParams.get('kategori')
  const kapasitas = searchParams.get('kapasitas')

  if (!kategori || !kapasitas) {
    return new Response(JSON.stringify({ error: 'Parameter kategori dan kapasitas dibutuhkan' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }


  try {
    // Ambil semua lahan yang cocok dengan kategori DAN
    // memiliki kapasitas yang lebih besar atau sama dengan yang dibutuhkan
 const { data, error } = await supabase
      .from('lahan')
      .select('*')
      .eq('kategori', kategori)
      .eq('kapasitas_maks', parseInt(kapasitas)); // Diubah dari .gte() menjadi .eq()

    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    let errorMessage = 'Terjadi kesalahan pada server.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}