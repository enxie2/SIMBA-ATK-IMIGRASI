# Deploy ke Vercel

Project ini dapat dijalankan di Vercel sebagai aplikasi Express. Vercel akan menjalankan server Express sebagai Function; file PHP tidak menjadi runtime aplikasi pada jalur ini.

## Konfigurasi project Vercel

1. Import repository `enxie2/SIMBA-ATK-IMIGRASI` dari GitHub.
2. Set **Root Directory** ke `.` (folder repository).
3. Biarkan Framework Preset mendeteksi Express atau pilih **Other** jika deteksi otomatis tidak muncul.
4. Biarkan Build Command dan Output Directory kosong/default. Jangan pilih `frontend` sebagai root.
5. Deploy setelah variabel environment dan database production disiapkan.

Root `server.js` adalah entrypoint Express untuk Vercel. Aset statis yang dipublikasikan otomatis berada di `public/`; salinan sumber tetap berada di `frontend/public/` untuk server lokal.

## Environment Variables

Tambahkan nilai berikut di **Project Settings > Environment Variables**, untuk Production dan Preview jika diperlukan:

```text
DB_HOST=<host database MySQL publik>
DB_USER=<user database>
DB_PASS=<password database>
DB_NAME=<nama database>
SESSION_SECRET=<secret acak panjang>
```

Jangan gunakan `localhost` untuk `DB_HOST`: di Vercel, `localhost` menunjuk ke instance Function, bukan komputer atau MySQL lokal Anda. Database harus dapat diakses dari Vercel melalui jaringan dan mendukung koneksi MySQL eksternal.

Import schema awal dari `backend/database.sql` ke database production sebelum login. Jangan menjalankan reset database pada data production.

## Pemeriksaan penting sebelum publik

- Aplikasi saat ini memakai `express-session` MemoryStore. Sesi tidak persisten antar instance/serverless dan bukan penyimpanan sesi production yang aman; gunakan session store eksternal sebelum dipakai oleh banyak pengguna.
- Ganti akun dan password seed bawaan sebelum publikasi. Jangan gunakan password contoh di `backend/setup-db.js` di lingkungan production.
- Atur `SESSION_SECRET` rahasia dan berbeda dari development.
- Pastikan backup database dan pembatasan akses database sudah disiapkan.

## Troubleshooting 404

- Pastikan Root Directory Vercel menunjuk ke root repository, bukan `backend/` atau `frontend/`.
- Pastikan deployment menggunakan commit terbaru yang memiliki `server.js` di root.
- Pastikan folder `public/` berisi `index.html`, `css/`, `js/`, dan `images/`.
- Buka Deployment > Functions/Runtime Logs untuk melihat error saat Express atau database dijalankan.
