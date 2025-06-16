import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, HandHeart, ShieldCheck, Sparkles, Camera } from 'lucide-react';
import { Carousel } from '@/components/ui/carousel'; // Pastikan path ini benar

// Komponen kecil untuk kartu fitur agar kode lebih rapi
const FeatureCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
      <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
        <Icon className="text-red-600" size={24} />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 mb-2">{title}</h3>
      <p className="text-zinc-600 text-sm">{children}</p>
    </div>
);

export default function HomePage() {
  // Daftar path gambar untuk galeri di dalam folder /public/gallery/
  const galleryImages = [
    '/gallery/acara-1.jpg',
    '/gallery/acara-2.jpeg',
    '/gallery/acara-3.jpeg',
    '/gallery/acara-4.jpeg',
    '/gallery/acara-5.jpeg',
    '/gallery/acara-6.jpeg',
    '/gallery/acara-7.jpeg',
    '/gallery/acara-8.jpeg',
  ];

  return (
    <div className="bg-zinc-50 font-sans text-zinc-800">
      {/* ===== Header & Logo ===== */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-zinc-200">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-pmi.jpg"
              alt="Logo PMI Kabupaten Cianjur"
              width={512} // Ganti dengan lebar asli file logo Anda
              height={512} // Ganti dengan tinggi asli file logo Anda
              className="h-15 w-auto rounded-full"
            />
          </Link>
          <nav>
            <Link href="/admin" className="text-sm font-semibold text-zinc-600 hover:text-red-600 transition-colors">
              Dashboard Admin
            </Link>
          </nav>
        </div>
      </header>
      
      {/* ===== Hero Section ===== */}
      <main className="container mx-auto px-6 pt-10 sm:pt-24 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Kolom Teks & CTA */}
          <div className="text-center lg:text-left animate-fade-in">
            <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              PMR KABUPATEN CIANJUR - TAHUN 2025
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900">
              Pelantikan & Pelatihan PMR Tingkat Wira dan Madya
              <span className="block text-red-600 mt-2"> Se-Kabupaten Cianjur</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-600 max-w-lg mx-auto lg:mx-0">
              Bentuk generasi muda yang tanggap, peduli, dan terampil. Mari bergabung dalam acara pelantikan dan pelatihan terbesar se-Kabupaten Cianjur!
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/daftar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Daftar Sekarang
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Kolom Ilustrasi/Gambar */}
          <div className="hidden lg:block animate-fade-in-delay">
            <div className="bg-red-50 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Image 
                    src="/background.jpg" 
                    alt="background"
                    width={500} // Beri dimensi placeholder, styling akan membuatnya responsif
                    height={500}
                    className="w-full h-auto"
                 />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Key Information Section ===== */}
      <section className="bg-white py-20 lg:py-24">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Apa yang Akan Didapatkan?</h2>
            <p className="mt-3 text-zinc-600 max-w-2xl mx-auto">
                Lebih dari sekadar pelantikan, ini adalah momen untuk bertumbuh, belajar, dan menjalin persahabatan.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard icon={HandHeart} title="Membangun Solidaritas">
                    Bertemu dan berkolaborasi dengan ratusan anggota PMR dari seluruh penjuru Cianjur. Perkuat jiwa kemanusiaan dan semangat menolong.
                </FeatureCard>
                <FeatureCard icon={ShieldCheck} title="Keterampilan Kepalangmerahan">
                    Pelatihan praktis pertolongan pertama, siaga bencana, dan kesehatan remaja langsung dari para ahli di bidangnya.
                </FeatureCard>
                <FeatureCard icon={Sparkles} title="Pengalaman Tak Terlupakan">
                    Kegiatan yang dirancang untuk menjadi seru, menantang, dan meninggalkan kenangan berharga seumur hidup.
                </FeatureCard>
            </div>
        </div>
      </section>

      {/* ===== Galeri Dokumentasi Section ===== */}
      <section className="bg-zinc-50 py-20 lg:py-24">
        <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                <Camera size={16} />
                Kilas Balik
            </div>
            <h2 className="text-3xl font-bold text-zinc-900">Dokumentasi Kegiatan Tahun Lalu</h2>
            <p className="mt-3 text-zinc-600 max-w-2xl mx-auto mb-12">
                Lihat kembali momen-momen penuh semangat, kebersamaan, dan pembelajaran dari acara pelantikan sebelumnya.
            </p>
            {/* Memanggil Komponen Carousel dari file terpisah */}
            <Carousel images={galleryImages} />
        </div>
      </section>
      
    </div>
  );
}