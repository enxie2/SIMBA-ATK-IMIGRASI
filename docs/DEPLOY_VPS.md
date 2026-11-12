# Deploy ke VPS Ubuntu

Panduan singkat untuk menempatkan aplikasi SIMBA ATK pada server publik dengan VPS Ubuntu.

## 1. Siapkan VPS
Instal dependensi server:

```bash
sudo apt update
sudo apt install -y nginx mysql-server nodejs npm certbot python3-certbot-nginx
```

## 2. Clone repo

```bash
cd /var/www
sudo git clone https://github.com/enxie2/SIMBA-ATK-IMIGRASI.git simba-atk-imigrasi
cd simba-atk-imigrasi
sudo npm install
```

## 3. Konfigurasi environment
Copy file template dan sesuaikan nilai database dan session:

```bash
cp .env.example .env
nano .env
```

## 4. Akses database
Buat database MySQL sesuai konfigurasi di `.env`, lalu import file SQL dari:

```bash
mysql -u root -p < backend/database.sql
```

## 5. Jalankan aplikasi dengan PM2

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 6. Konfigurasi Nginx
Copy file konfigurasi contoh ke `/etc/nginx/sites-available/default` atau buat server block baru.

```bash
sudo cp nginx.conf.example /etc/nginx/conf.d/simba-atk.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Aktifkan SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 8. Verifikasi
Buka domain Anda di browser, lalu login ke aplikasi.

## Catatan
- Pastikan port 8000 terbuka untuk reverse proxy local.
- Pastikan `.env` tidak dipublikasikan ke repositori.
- Jika Anda memakai domain, sesuaikan `server_name` di file Nginx.
