# SIMBA ATK Imigrasi

Sistem Informasi Manajemen Barang ATK (SIMBA) untuk kebutuhan pengajuan, persetujuan, dan pelaporan barang ATK di lingkungan Imigrasi.

## Fitur utama
- Autentikasi pengguna dan sesi login
- Pengajuan kebutuhan ATK
- Persetujuan permintaan oleh admin
- Dashboard statistik real-time
- Cetak laporan permintaan
- Manajemen data item ATK dan stok

## Struktur project

```text
.
├── backend/               # API, konfigurasi database, dan server Express
│   ├── api.php
│   ├── config.php
│   ├── database.sql
│   ├── db.js
│   ├── install.php
│   ├── print_laporan.php
│   ├── server.js
│   └── setup-db.js
├── frontend/              # Antarmuka aplikasi dan template tampilan
│   ├── css/
│   ├── images/
│   ├── includes/
│   ├── js/
│   ├── public/
│   ├── views/
│   └── index.php
├── docs/                  # Dokumentasi dan catatan teknis
├── .env.example           # Template konfigurasi environment
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── .env                   # File lokal yang tidak dipush
```

## Persiapan

1. Instal dependency:

```bash
npm install
```

2. Salin template environment:

```bash
copy .env.example .env
```

3. Sesuaikan konfigurasi database dan session secret di `.env`.

4. Jalankan aplikasi:

```bash
npm start
```

Aplikasi akan berjalan di:

```text
http://localhost:8000
```

## Variabel environment

Berikut contoh konfigurasi yang digunakan:

```env
PORT=8000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=db_atk_kanim
SESSION_SECRET=supersecretatkkanimkey123
```

## Catatan
- File `.env` bersifat lokal dan tidak didistribusikan ke Git.
- Folder `backend/php_backup` telah dihapus dari repositori karena merupakan arsip cadangan yang tidak diperlukan untuk pengembangan aktif.
