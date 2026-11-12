<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalasi Dibutuhkan - E-ATK Kanim Tasikmalaya</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-dark: #071426;
            --primary: #0d2847;
            --gold-color: #c5a059;
            --bg-main: #f4f6f9;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-main);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 1rem;
        }
        .install-card {
            background: white;
            border-radius: 16px;
            padding: 2.5rem;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 15px 35px rgba(13, 40, 71, 0.08);
            border: 1px solid #e5e7eb;
        }
        h1 { font-family: 'Outfit', sans-serif; color: var(--primary-dark); font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.5rem; }
        .btn {
            display: inline-block;
            background-color: var(--primary);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn:hover { background-color: var(--primary-dark); }
    </style>
</head>
<body>
    <div class="install-card">
        <h1>Sistem E-ATK Belum Terinstal</h1>
        <p>Database untuk Sistem Pengajuan ATK Kantor Imigrasi Kelas I Non TPI Kota Tasikmalaya belum diinisialisasi atau tabel tidak ditemukan. Silakan jalankan program instalasi database terlebih dahulu.</p>
        <a href="../backend/install.php" class="btn">Mulai Instalasi Database</a>
    </div>
</body>
</html>
