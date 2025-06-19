// Memberi tahu TypeScript tentang struktur dasar dari library 'midtrans-client'
declare module 'midtrans-client' {
  // Interface untuk opsi saat membuat instance Snap
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  // Interface untuk parameter detail transaksi
  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }
  
  // Interface untuk parameter detail pelanggan (opsional)
  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }

  // Interface untuk parameter lengkap saat membuat token
  interface CreateTransactionParameters {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    // Anda bisa menambahkan properti lain di sini jika diperlukan, seperti item_details
  }

  // Deklarasi kelas Snap
  class Snap {
    constructor(options: SnapOptions);
    
    /**
     * Membuat token transaksi untuk Midtrans Snap.
     * @param parameter - Objek yang berisi detail transaksi.
     * @returns Promise yang akan resolve dengan objek berisi token.
     */
    createTransactionToken(parameter: CreateTransactionParameters): Promise<{ token: string }>;
    
    // Deklarasi untuk API notifikasi (webhook)
    transaction: {
        notification(notification: object | string): Promise<any>;
    };
  }

  // Export default agar kita bisa menggunakan `import Midtrans from 'midtrans-client'`
  export default { Snap };
}