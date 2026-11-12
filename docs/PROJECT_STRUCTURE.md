# Struktur Proyek

```text
.
├── backend/               # Server, API, dan koneksi database
│   ├── api.php
│   ├── config.php
│   ├── database.sql
│   ├── db.js
│   ├── install.php
│   ├── print_laporan.php
│   ├── server.js
│   └── setup-db.js
├── frontend/              # UI dan template HTML/PHP
│   ├── css/
│   ├── images/
│   ├── includes/
│   ├── js/
│   ├── public/
│   ├── views/
│   └── index.php
├── docs/                  # Dokumentasi proyek
├── .env.example           # Template konfigurasi lingkungan
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── .env                   # Konfigurasi lokal, tidak dipush
└── node_modules/          # Dependency lokal, diabaikan Git
```

## Prinsip struktur
- Pisahkan logika backend dan UI frontend dengan jelas.
- Jaga file konfigurasi sensitif berada di `.env` dan bukan pada repositori publik.
- Hapus arsip atau file backup yang tidak dibutuhkan untuk aktivitas pengembangan aktif.
