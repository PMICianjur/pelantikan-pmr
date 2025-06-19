import { create } from 'zustand';

// Definisikan tipe data untuk state
export type PesertaState = {
  nama_lengkap: string;
  foto_file: File | null;
  status: 'Menunggu Foto' | 'Foto Cocok' | 'Error';
}
export type PendampingState = {
  nama_lengkap: string;
}

// Definisikan tipe data untuk seluruh toko state kita
type RegistrationState = {
  namaPembina: string;
  namaSekolah: string;
  nomorWhatsapp: string;
  kategori: 'Wira' | 'Madya'; // Tipe spesifik
  pesertaList: PesertaState[];
  pendampingList: PendampingState[];
  lahanDipilihId: number | null;
  sewaTendaOpsi: string;
  jenisTendaPanitia: string;
  biayaSewaTenda: number;
  totalBiaya: number;
  setData: (data: Partial<Omit<RegistrationState, 'setData' | 'reset'>>) => void;
  reset: () => void;
}

// --- PERBAIKAN DIMULAI DI SINI ---

// 1. Buat tipe data baru HANYA untuk properti data, tanpa fungsi.
//    Kita menggunakan utility 'Omit' dari TypeScript untuk ini.
type RegistrationData = Omit<RegistrationState, 'setData' | 'reset'>;

// 2. Terapkan tipe data 'RegistrationData' pada 'initialState'.
const initialState: RegistrationData = {
  namaPembina: '',
  namaSekolah: '',
  nomorWhatsapp: '',
  kategori: 'Madya', // Sekarang TypeScript tahu ini harus 'Wira' atau 'Madya'
  pesertaList: [],
  pendampingList: [],
  lahanDipilihId: null,
  sewaTendaOpsi: '',
  jenisTendaPanitia: '',
  biayaSewaTenda: 0,
  totalBiaya: 0,
};

// --- AKHIR PERBAIKAN ---

// Buat store Zustand
export const useRegistrationStore = create<RegistrationState>((set) => ({
  ...initialState,
  setData: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set(initialState),
}));