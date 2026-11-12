<?php
require_once 'config.php';

// Verify Admin authentication
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    die("Akses ditolak. Silakan masuk sebagai Admin terlebih dahulu.");
}

$db = getDBConnection();
if ($db === null) {
    die("Koneksi database gagal.");
}

// Get Filters
$start_date = isset($_GET['start_date']) ? trim($_GET['start_date']) : '';
$end_date = isset($_GET['end_date']) ? trim($_GET['end_date']) : '';
$division = isset($_GET['division']) ? trim($_GET['division']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';

// Build Query
try {
    $sql = "SELECT r.*, u.`name` as `requester_name`, u.`division` 
            FROM `requests` r 
            JOIN `users` u ON r.`user_id` = u.`id` 
            WHERE 1=1";
    $params = [];

    if (!empty($status)) {
        $sql .= " AND r.`status` = ?";
        $params[] = $status;
    }
    if (!empty($start_date)) {
        $sql .= " AND DATE(r.`created_at`) >= ?";
        $params[] = $start_date;
    }
    if (!empty($end_date)) {
        $sql .= " AND DATE(r.`created_at`) <= ?";
        $params[] = $end_date;
    }
    if (!empty($division)) {
        $sql .= " AND u.`division` = ?";
        $params[] = $division;
    }
    
    $sql .= " ORDER BY r.`id` ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll();

    // Fetch items query helper
    $stmt_items = $db->prepare("
        SELECT ri.`quantity`, ai.`name`, ai.`unit` 
        FROM `request_items` ri 
        JOIN `atk_items` ai ON ri.`atk_item_id` = ai.`id` 
        WHERE ri.`request_id` = ?
    ");
} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}

// Helper: Format DateTime
function formatDateTimeText($dateStr) {
    $d = new Date($dateStr); // wait, in PHP:
    $d = new DateTime($dateStr);
    $months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    $day = $d->format('d');
    $month = $months[(int)$d->format('m') - 1];
    $year = $d->format('Y');
    $time = $d->format('H:i');
    return "$day $month $year $time";
}

// Helper: Format Date Only
function formatDateOnlyIndo($dateStr = 'now') {
    $d = new DateTime($dateStr);
    $months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    $day = $d->format('d');
    $month = $months[(int)$d->format('m') - 1];
    $year = $d->format('Y');
    return "$day $month $year";
}

// Status labels
$status_labels = [
    'pending' => 'PENDING',
    'approved' => 'DISETUJUI',
    'rejected' => 'DITOLAK',
    'completed' => 'SELESAI (DISERAHKAN)'
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Laporan ATK - Kanim Tasikmalaya</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 2cm;
        }
        
        /* Kop Surat Official */
        .kop-surat {
            display: flex;
            align-items: center;
            border-bottom: 3px double #000;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        .kop-logo {
            width: 80px;
            height: 80px;
            margin-right: 20px;
            flex-shrink: 0;
        }
        .kop-logo svg {
            width: 100%;
            height: 100%;
        }
        .kop-text {
            text-align: center;
            flex-grow: 1;
            line-height: 1.2;
        }
        .kop-text h3 {
            font-size: 12pt;
            font-weight: normal;
            margin: 0;
        }
        .kop-text h4 {
            font-size: 13pt;
            font-weight: bold;
            margin: 0;
        }
        .kop-text h2 {
            font-size: 15pt;
            font-weight: bold;
            margin: 5px 0;
        }
        .kop-text p {
            font-size: 9pt;
            margin: 2px 0;
        }

        .report-title {
            text-align: center;
            margin-bottom: 25px;
        }
        .report-title h2 {
            font-size: 14pt;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-decoration: underline;
        }
        .report-title p {
            font-size: 11pt;
            margin: 0;
        }

        /* Table Laporan */
        table.report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
            font-size: 10pt;
        }
        table.report-table th, table.report-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: top;
        }
        table.report-table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }
        table.report-table td.center {
            text-align: center;
        }
        table.report-table td.items-list {
            line-height: 1.4;
        }

        /* Signatures block */
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            page-break-inside: avoid;
            gap: 15px;
        }
        .sig-block {
            text-align: center;
            flex: 1;
            min-width: 150px;
            line-height: 1.3;
            font-size: 10pt;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 140px; /* Fixed height to align all footers at the bottom */
        }
        .sig-header p, .sig-footer p {
            margin: 0;
        }
        .sig-date {
            margin-bottom: 5px;
            min-height: 1.2em;
        }
        .sig-name { font-weight: bold; text-decoration: underline; }
        .sig-nip  { margin-top: 3px; }

        @media print {
            body {
                padding: 0;
            }
            @page {
                size: A4 portrait;
                margin: 1.5cm;
            }
        }
    </style>
</head>
<body>

    <!-- Kop Surat -->
    <div class="kop-surat">
        <div class="kop-logo">
            <!-- Lambang Resmi Kantor Imigrasi Tasikmalaya -->
            <img src="images/logo-kanim.jpg" alt="Logo Kanim Tasikmalaya" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
        </div>
        <div class="kop-text">
            <h3>KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA R.I.</h3>
            <h4>KANTOR WILAYAH JAWA BARAT</h4>
            <h2>KANTOR IMIGRASI KELAS I NON TPI KOTA TASIKMALAYA</h2>
            <p>Jl. Letnan Harun No. 2, Sukamulya, Kec. Bungursari, Tasikmalaya, Jawa Barat 46151</p>
            <p>Telp: (0265) 342616 | Email: kanim_tasikmalaya@kemenkumham.go.id</p>
        </div>
    </div>

    <!-- Title -->
    <div class="report-title">
        <h2>LAPORAN PENGAJUAN ALAT TULIS KANTOR (ATK)</h2>
        <p>
            <?php 
            if (!empty($start_date) && !empty($end_date)) {
                echo "Periode: " . date('d-m-Y', strtotime($start_date)) . " s/d " . date('d-m-Y', strtotime($end_date));
            } elseif (!empty($start_date)) {
                echo "Periode: Mulai " . date('d-m-Y', strtotime($start_date));
            } elseif (!empty($end_date)) {
                echo "Periode: Sampai " . date('d-m-Y', strtotime($end_date));
            } else {
                echo "Periode: Semua Riwayat Pengajuan";
            }
            ?>
        </p>
        <?php if (!empty($division) || !empty($status)): ?>
            <p style="font-size: 10pt; margin-top: 4px;">
                <?php
                $filters_text = [];
                if (!empty($division)) $filters_text[] = "Seksi: " . htmlspecialchars($division);
                if (!empty($status)) $filters_text[] = "Status: " . htmlspecialchars($status_labels[$status]);
                echo implode(" | ", $filters_text);
                ?>
            </p>
        <?php endif; ?>
    </div>

    <!-- Results Table -->
    <table class="report-table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 18%;">Nama Pengaju / Seksi</th>
                <th style="width: 25%;">Barang ATK</th>
                <th style="width: 8%;">Jumlah</th>
                <th style="width: 8%;">Satuan</th>
                <th style="width: 14%;">Tujuan / Keperluan</th>
                <th style="width: 10%;">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            <?php if (count($requests) === 0): ?>
                <tr>
                    <td colspan="8" style="text-align: center; font-style: italic; padding: 20px;">
                        Tidak ada data pengajuan yang sesuai dengan kriteria filter laporan.
                    </td>
                </tr>
            <?php else: ?>
                <?php foreach ($requests as $idx => $req): 
                    $stmt_items->execute([$req['id']]);
                    $items = $stmt_items->fetchAll();
                    $itemCount = count($items);
                    
                    if ($itemCount === 0): ?>
                        <tr>
                            <td class="center"><?php echo $idx + 1; ?></td>
                            <td class="center"><?php echo formatDateTimeText($req['created_at']); ?></td>
                            <td>
                                <strong><?php echo htmlspecialchars($req['requester_name']); ?></strong><br>
                                <span style="font-size: 8.5pt; color: #444;"><?php echo htmlspecialchars($req['division']); ?></span>
                            </td>
                            <td>-</td>
                            <td class="center">-</td>
                            <td class="center">-</td>
                            <td><?php echo htmlspecialchars($req['purpose']); ?></td>
                            <td class="center bold" style="font-size: 9pt;">
                                <?php echo htmlspecialchars($status_labels[$req['status']] ?? strtoupper($req['status'])); ?>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($items as $itemIdx => $it): ?>
                            <tr>
                                <?php if ($itemIdx === 0): ?>
                                    <td class="center" rowspan="<?php echo $itemCount; ?>"><?php echo $idx + 1; ?></td>
                                    <td class="center" rowspan="<?php echo $itemCount; ?>"><?php echo formatDateTimeText($req['created_at']); ?></td>
                                    <td rowspan="<?php echo $itemCount; ?>">
                                        <strong><?php echo htmlspecialchars($req['requester_name']); ?></strong><br>
                                        <span style="font-size: 8.5pt; color: #444;"><?php echo htmlspecialchars($req['division']); ?></span>
                                    </td>
                                <?php endif; ?>
                                
                                <td><?php echo htmlspecialchars($it['name']); ?></td>
                                <td class="center"><?php echo $it['quantity']; ?></td>
                                <td class="center"><?php echo htmlspecialchars($it['unit']); ?></td>
                                
                                <?php if ($itemIdx === 0): ?>
                                    <td rowspan="<?php echo $itemCount; ?>"><?php echo htmlspecialchars($req['purpose']); ?></td>
                                    <td class="center bold" style="font-size: 9pt;" rowspan="<?php echo $itemCount; ?>">
                                        <?php echo htmlspecialchars($status_labels[$req['status']] ?? strtoupper($req['status'])); ?>
                                    </td>
                                <?php endif; ?>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>

    <!-- Tanda Tangan -->
    <div class="signatures">
        <div class="sig-block">
            <div class="sig-header">
                <p class="sig-date">&nbsp;</p>
                <p style="font-weight: bold;">Pemohon</p>
            </div>
            <div class="sig-footer">
                <p class="sig-name">....................................................</p>
                <p class="sig-nip">NIP. ...............................................</p>
            </div>
        </div>
        <div class="sig-block">
            <div class="sig-header">
                <p class="sig-date">&nbsp;</p>
                <p style="font-weight: bold;">Mengetahui,<br>Kasi/Kasubag/TU</p>
            </div>
            <div class="sig-footer">
                <p class="sig-name">....................................................</p>
                <p class="sig-nip">NIP. ...............................................</p>
            </div>
        </div>
        <div class="sig-block">
            <div class="sig-header">
                <p class="sig-date">&nbsp;</p>
                <p style="font-weight: bold;">Menyetujui,<br>Kasubag TU / Kaur Umum</p>
            </div>
            <div class="sig-footer">
                <p class="sig-name">....................................................</p>
                <p class="sig-nip">NIP. ...............................................</p>
            </div>
        </div>
        <div class="sig-block">
            <div class="sig-header">
                <p class="sig-date">Tasikmalaya, <?php echo formatDateOnlyIndo(); ?></p>
                <p style="font-weight: bold;">Yang Memberikan,<br>Petugas Gudang</p>
            </div>
            <div class="sig-footer">
                <p class="sig-name">....................................................</p>
                <p class="sig-nip">NIP. ...............................................</p>
            </div>
        </div>
    </div>

    <!-- Auto Print Script -->
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
