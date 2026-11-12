const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const usersSeed = [
  ['admin', 'admin123', 'Hendi Wijaya, S.Sos.', 'admin', 'Sub Bagian Umum'],
  ['pegawai', 'pegawai123', 'Budi Santoso', 'pegawai', 'Sub Bagian Umum'],
  ['lalintus', 'lalintus123', 'Dewi Lestari', 'pegawai', 'Seksi Lalu Lintas Keimigrasian'],
  ['intalim', 'intalim123', 'Rian Hidayat', 'pegawai', 'Seksi Izin Tinggal & Status Keimigrasian'],
  ['infokim', 'infokim123', 'Siti Rahma', 'pegawai', 'Seksi Informasi & Komunikasi Keimigrasian'],
  ['inteldakim', 'inteldakim123', 'Ahmad Fauzi', 'pegawai', 'Seksi Intelijen & Penindakan Keimigrasian']
];

const atkItemsSeed = [
  ['1010301001000001', 'Ballpoint Balliner Hitam', 'Alat Tulis & Kantor', 22, 5, 'Pcs', 'Ballpoint Balliner warna hitam untuk tanda tangan dan menulis.', 'Baik'],
  ['1010301001000004', 'Pulpen Joyko', 'Alat Tulis & Kantor', 2, 5, 'Pcs', 'Pulpen Joyko standar kantoran.', 'Baik'],
  ['1010301001000010', 'Pen Stand', 'Alat Tulis & Kantor', 7, 2, 'Pcs', 'Dudukan pulpen meja kerja.', 'Baik'],
  ['1010301001000015', 'Ballpoint Joyko JK-100', 'Alat Tulis & Kantor', 5, 10, 'Pcs', 'Ballpoint Joyko JK-100 tinta hitam.', 'Baik'],
  ['1010301001000018', 'Ballpoint Balliner Hijau', 'Alat Tulis & Kantor', 11, 5, 'Pcs', 'Ballpoint Balliner warna hijau.', 'Baik'],
  ['1010301001000019', 'Ballpoint Sarasa Clip 1.0 Hitam', 'Alat Tulis & Kantor', 24, 5, 'Pcs', 'Pulpen gel Sarasa clip 1.0mm hitam.', 'Baik'],
  ['1010301001000027', 'Spidol Whiteboard (Lusin)', 'Alat Tulis & Kantor', 5, 2, 'Lusin', 'Spidol whiteboard per lusin.', 'Baik'],
  ['1010301003000001', 'BINDER KLIP NO.155', 'Alat Tulis & Kantor', 5, 5, 'Box', 'Penjepit kertas Binder Clip No. 155.', 'Baik'],
  ['1010301003000002', 'BINDER KLIP NO.200', 'Alat Tulis & Kantor', 6, 5, 'Box', 'Penjepit kertas Binder Clip No. 200.', 'Baik'],
  ['1010301003000003', 'BINDER KLIP NO.107', 'Alat Tulis & Kantor', 5, 5, 'Box', 'Penjepit kertas Binder Clip No. 107.', 'Baik'],
  ['1010301003000004', 'BINDER KLIP NO.260', 'Alat Tulis & Kantor', 6, 5, 'Box', 'Penjepit kertas Binder Clip No. 260.', 'Baik'],
  ['1010301003000005', 'BINDER KLIP NO.105', 'Alat Tulis & Kantor', 7, 5, 'Box', 'Penjepit kertas Binder Clip No. 105.', 'Baik'],
  ['1010301003000007', 'Paper Clips No.3', 'Alat Tulis & Kantor', 4, 5, 'Box', 'Klip kertas kecil No. 3.', 'Baik'],
  ['1010301004000003', 'Tipe-X Roll', 'Alat Tulis & Kantor', 22, 5, 'Pcs', 'Pita koreksi tipe-x kertas roll.', 'Baik'],
  ['1010301005000001', 'BUKU POLIO 200 LBR', 'Kertas & Dokumen', 5, 2, 'Buku', 'Buku tulis ukuran folio tebal 200 lembar.', 'Baik'],
  ['1010301005000002', 'BUKU POLIO 100 LBR', 'Kertas & Dokumen', 4, 2, 'Buku', 'Buku tulis ukuran folio tebal 100 lembar.', 'Baik'],
  ['1010301005000003', 'BUKU EKSPEDISI 100 LEMBAR', 'Kertas & Dokumen', 7, 2, 'Buku', 'Buku ekspedisi untuk catatan surat menyurat.', 'Baik'],
  ['1010301006000001', 'BOX FILE', 'Penyimpanan', 2, 5, 'Pcs', 'Kotak penyimpanan berkas/file.', 'Baik'],
  ['1010301006000003', 'MAP KUNING', 'Penyimpanan', 48400, 100, 'Pcs', 'Map kertas warna kuning.', 'Baik'],
  ['1010301006000006', 'MAP ZIPPER BAG', 'Penyimpanan', 15, 5, 'Pcs', 'Map plastik ber-zipper.', 'Baik'],
  ['1010301006000007', 'MAP SPRING FILE', 'Penyimpanan', 67438, 50, 'Pcs', 'Map jepit besi spring file.', 'Baik'],
  ['1010301006000010', 'Map Plastik Kancing', 'Penyimpanan', 10, 10, 'Pcs', 'Map plastik dengan kancing penutup.', 'Baik'],
  ['1010301006000016', 'Map Merah', 'Penyimpanan', 479, 20, 'Pcs', 'Map kertas warna merah.', 'Baik'],
  ['1010301006000022', 'Box File Jumbo', 'Penyimpanan', 5, 2, 'Pcs', 'Kotak penyimpanan berkas ukuran jumbo.', 'Baik'],
  ['1010301006000023', 'Display Book Clear A4', 'Penyimpanan', 5, 5, 'Pcs', 'Buku display berkas ukuran A4.', 'Baik'],
  ['1010301006000024', 'Display Book Clear F4', 'Penyimpanan', 5, 5, 'Pcs', 'Buku display berkas ukuran F4.', 'Baik'],
  ['1010301006000025', 'Bantex Map Ordner Plastik Ring Mekanik A4', 'Penyimpanan', 15, 5, 'Pcs', 'Ordner penyimpanan Bantex ring mekanik A4.', 'Baik'],
  ['1010301008000002', 'CUTTER L-500', 'Alat Tulis & Kantor', 4, 3, 'Pcs', 'Pisau cutter ukuran sedang L-500.', 'Baik'],
  ['1010301010000003', 'DOUBLE TAPE', 'Alat Tulis & Kantor', 2, 5, 'Pcs', 'Selotip bolak-balik (double tape).', 'Baik'],
  ['1010301010000008', 'LEM KERTAS CAIR', 'Alat Tulis & Kantor', 7, 5, 'Botol', 'Lem kertas cair serbaguna.', 'Baik'],
  ['1010301010000010', 'Sign Here Joyko', 'Alat Tulis & Kantor', 54, 10, 'Pcs', 'Pembatas halaman warna-warni (sticky note).', 'Baik'],
  ['1010301010000012', 'Double Tape 2.5 cm', 'Alat Tulis & Kantor', 7, 5, 'Pcs', 'Selotip double tape lebar 2.5 cm.', 'Baik'],
  ['1010301010000013', 'Lakban Hitam 5cm', 'Alat Tulis & Kantor', 14, 5, 'Roll', 'Lakban kain hitam lebar 5 cm.', 'Baik'],
  ['1010301010000016', 'Double Tape 3M', 'Alat Tulis & Kantor', 9, 5, 'Pcs', 'Double tape merk 3M daya rekat kuat.', 'Baik'],
  ['1010301010000017', 'Lakban Bening Besar', 'Alat Tulis & Kantor', 17, 5, 'Roll', 'Lakban bening ukuran besar.', 'Baik'],
  ['1010301010000021', 'Lakban Coklat', 'Alat Tulis & Kantor', 5, 5, 'Roll', 'Lakban coklat ukuran besar.', 'Baik'],
  ['1010301010000023', 'Double Tape Besar', 'Alat Tulis & Kantor', 6, 5, 'Pcs', 'Double tape ukuran besar.', 'Baik'],
  ['1010301012000003', 'SDI Stapler 1193', 'Alat Tulis & Kantor', 1, 2, 'Pcs', 'Stapler SDI tipe 1193.', 'Baik'],
  ['1010301012000006', 'Stapler HD-10D', 'Alat Tulis & Kantor', 2, 5, 'Pcs', 'Stapler ukuran HD-10D.', 'Baik'],
  ['1010301999000006', 'STAPLER REMOVER', 'Alat Tulis & Kantor', 1, 2, 'Pcs', 'Alat pencabut isi stapler.', 'Baik'],
  ['1010301999000008', 'GUNTING', 'Alat Tulis & Kantor', 5, 5, 'Pcs', 'Gunting kertas sedang.', 'Baik'],
  ['1010301999000032', 'Gunting Besar', 'Alat Tulis & Kantor', 5, 2, 'Pcs', 'Gunting ukuran besar.', 'Baik'],
  ['1010301999000035', 'Rak Dokumen Jaring Besi', 'Penyimpanan', 10, 2, 'Pcs', 'Rak dokumen susun berbahan jaring besi.', 'Baik'],
  ['1010301999000036', 'Box Container 70 L', 'Penyimpanan', 6, 2, 'Pcs', 'Kotak kontainer plastik kapasitas 70 liter.', 'Baik'],
  ['1010301999000037', 'Pen Holderr', 'Alat Tulis & Kantor', 10, 2, 'Pcs', 'Tempat alat tulis meja.', 'Baik'],
  ['1010302001000006', 'HVS A4 75 GRAM', 'Kertas & Dokumen', 306, 20, 'Rim', 'Kertas HVS ukuran A4 berat 75 gram.', 'Baik'],
  ['1010302001000012', 'HVS F4 75 gr SIDU', 'Kertas & Dokumen', 12, 10, 'Rim', 'Kertas HVS ukuran Folio/F4 berat 75 gram merk Sinar Dunia.', 'Baik'],
  ['1010302002000005', 'Kertas Antrian Ukuran 80x80', 'Kertas & Dokumen', 30, 5, 'Roll', 'Kertas thermal roll untuk mesin antrean.', 'Baik'],
  ['1010302004000001', 'AMPLOP PUTIH SEDANG 4 4.110', 'Kertas & Dokumen', 10, 5, 'Box', 'Amplop surat putih ukuran sedang.', 'Baik'],
  ['1010302004000006', 'Amplop Putih 90pps (Panjang)', 'Kertas & Dokumen', 11, 5, 'Box', 'Amplop putih panjang tipe 90pps.', 'Baik'],
  ['1010302004000007', 'Amplop Coklat Kabinet Ukuran 11 x 27 cm', 'Kertas & Dokumen', 2, 5, 'Pak', 'Amplop coklat kabinet 11 x 27 cm.', 'Baik'],
  ['1010302004000008', 'Amplop Putih 104pps (95 mm Kecil)', 'Kertas & Dokumen', 10, 5, 'Box', 'Amplop putih ukuran kecil tipe 104pps.', 'Baik'],
  ['1010302999000001', 'KERTAS FOTO', 'Kertas & Dokumen', 4, 2, 'Pak', 'Kertas cetak foto glossy.', 'Baik'],
  ['1010302999000003', 'POS IT MMS WARNA KECIL', 'Kertas & Dokumen', 5, 5, 'Pcs', 'Sticky notes / post it ukuran kecil warna-warni.', 'Baik'],
  ['1010302999000002', 'Kertas Antrian Ukuran 80x80 (Cadangan)', 'Kertas & Dokumen', 6, 2, 'Roll', 'Cadangan kertas antrian thermal 80x80.', 'Baik'],
  ['1010304004000013', 'CARTRIDGE LASERJET 26A', 'Peralatan & IT', 6, 2, 'Pcs', 'Cartridge toner printer HP LaserJet 26A.', 'Baik'],
  ['1010304004000015', 'TINTA EPSON 644 CYAN', 'Peralatan & IT', 5, 3, 'Botol', 'Tinta refill printer Epson T644 warna biru.', 'Baik'],
  ['1010304004000016', 'TINTA EPSON 644 MAGENTA', 'Peralatan & IT', 5, 3, 'Botol', 'Tinta refill printer Epson T644 warna merah muda.', 'Baik'],
  ['1010304004000018', 'TINTA EPSON 644 YELLOW', 'Peralatan & IT', 5, 3, 'Botol', 'Tinta refill printer Epson T644 warna kuning.', 'Baik'],
  ['1010304004000023', 'TINTA EPSON 003 CYAN', 'Peralatan & IT', 23, 5, 'Botol', 'Tinta refill printer Epson 003 warna biru.', 'Baik'],
  ['1010304004000024', 'TINTA EPSON 003 MAGENTA', 'Peralatan & IT', 29, 5, 'Botol', 'Tinta refill printer Epson 003 warna merah.', 'Baik'],
  ['1010304004000025', 'TINTA EPSON 003 BLACK', 'Peralatan & IT', 24, 5, 'Botol', 'Tinta refill printer Epson 003 warna hitam.', 'Baik'],
  ['1010304004000026', 'TINTA EPSON 003 YELLOW', 'Peralatan & IT', 17, 5, 'Botol', 'Tinta refill printer Epson 003 warna kuning.', 'Baik'],
  ['1010304004000027', 'TINTA EPSON 003 BLACK 2', 'Peralatan & IT', 4, 3, 'Botol', 'Tinta refill printer Epson 003 warna hitam (varian 2).', 'Baik'],
  ['1010304004000028', 'TINTA EPSON 664 BLACK 2', 'Peralatan & IT', 18, 5, 'Botol', 'Tinta refill printer Epson 664 warna hitam.', 'Baik'],
  ['1010304004000031', 'CARTRIDGE LASERJET 48A', 'Peralatan & IT', 5, 2, 'Pcs', 'Cartridge toner printer HP LaserJet 48A.', 'Baik'],
  ['1010304004000043', 'Tinta Dilleta DC-900', 'Peralatan & IT', 9, 2, 'Botol', 'Tinta khusus printer paspor Diletta DC-900.', 'Baik'],
  ['1010304004000045', 'Tinta Epson 008 Black', 'Peralatan & IT', 5, 2, 'Botol', 'Tinta refill printer Epson 008 hitam.', 'Baik'],
  ['1010304004000048', 'Tinta Polaroid P4000', 'Peralatan & IT', 1, 1, 'Botol', 'Tinta printer ribbon / Polaroid P4000.', 'Baik'],
  ['1010304004000049', 'Brother Label Tape TZE-661 36mm 14"', 'Peralatan & IT', 2, 2, 'Pcs', 'Pita label printer Brother TZe-661 ukuran 36mm.', 'Baik'],
  ['1010304004000050', 'Brother Label Tape TZE-261 36mm 14"', 'Peralatan & IT', 2, 2, 'Pcs', 'Pita label printer Brother TZe-261 ukuran 36mm.', 'Baik'],
  ['1010304004000051', 'Brother Label Tape TZE-561 36mm 14"', 'Peralatan & IT', 2, 2, 'Pcs', 'Pita label printer Brother TZe-561 ukuran 36mm.', 'Baik'],
  ['1010304004000052', 'Brother Label Tape TZE-461 36mm 14"', 'Peralatan & IT', 2, 2, 'Pcs', 'Pita label printer Brother TZe-461 ukuran 36mm.', 'Baik'],
  ['1010304004000053', 'Tinta Epson 664 Magenta', 'Peralatan & IT', 6, 3, 'Botol', 'Tinta refill printer Epson 664 warna merah.', 'Baik'],
  ['1010304004000054', 'Tinta Epson 664 Yellow', 'Peralatan & IT', 6, 3, 'Botol', 'Tinta refill printer Epson 664 warna kuning.', 'Baik'],
  ['1010304004000055', 'Tinta Epson 664 Cyan', 'Peralatan & IT', 6, 3, 'Botol', 'Tinta refill printer Epson 664 warna biru.', 'Baik'],
  ['1010304010000001', 'Mouse Wireless', 'Peralatan & IT', 5, 2, 'Pcs', 'Mouse nirkabel untuk PC/Laptop.', 'Baik'],
  ['1010304010000002', 'Mousepad', 'Peralatan & IT', 10, 5, 'Pcs', 'Alas mouse standard.', 'Baik'],
  ['1010304010000003', 'Mouse USB', 'Peralatan & IT', 5, 2, 'Pcs', 'Mouse kabel USB standard.', 'Baik'],
  ['1010304999000001', 'Kabel LAN', 'Peralatan & IT', 1, 2, 'Pcs', 'Kabel jaringan LAN RJ45.', 'Baik'],
  ['1010304999000014', 'Keyboard USB', 'Peralatan & IT', 5, 2, 'Pcs', 'Papan ketik/keyboard USB.', 'Baik'],
  ['1010304999000016', 'Keyboard Wireless Logitech', 'Peralatan & IT', 10, 2, 'Pcs', 'Keyboard nirkabel merk Logitech.', 'Baik'],
  ['1010305001000001', 'SAPU GAGANG LIDI', 'Kebersihan & Sanitasi', 10, 2, 'Pcs', 'Sapu lidi dengan gagang panjang.', 'Baik'],
  ['1010305001000002', 'Scotch Brite Busa Cuci Piring', 'Kebersihan & Sanitasi', 15, 5, 'Pcs', 'Spons busa cuci piring Scotch Brite.', 'Baik'],
  ['1010305001000003', 'SIKAT LANTAI GAGANG', 'Kebersihan & Sanitasi', 1, 2, 'Pcs', 'Sikat lantai dengan gagang.', 'Baik'],
  ['1010305001000006', 'Sapu Ijuk', 'Kebersihan & Sanitasi', 1, 2, 'Pcs', 'Sapu ijuk pembersih lantai.', 'Baik'],
  ['1010305001000007', 'Pengki', 'Kebersihan & Sanitasi', 7, 2, 'Pcs', 'Serokan/pengki sampah plastik.', 'Baik'],
  ['1010305001000010', 'Sapu', 'Kebersihan & Sanitasi', 5, 2, 'Pcs', 'Sapu lantai standar.', 'Baik'],
  ['1010305002000001', 'KANEBO', 'Kebersihan & Sanitasi', 6, 2, 'Pcs', 'Lap kanebo sintetis penyerap air.', 'Baik'],
  ['1010305002000002', 'CLING 425 ML', 'Kebersihan & Sanitasi', 15, 3, 'Botol', 'Cairan pembersih kaca Cling 425 ml.', 'Baik'],
  ['1010305002000009', 'LAP MIKRO VIBER', 'Kebersihan & Sanitasi', 1, 2, 'Pcs', 'Kain lap microfiber halus.', 'Baik'],
  ['1010305002000011', 'Lap Microfiber', 'Kebersihan & Sanitasi', 15, 5, 'Pcs', 'Lap pembersih kain microfiber.', 'Baik'],
  ['1010305002000018', 'Lobby Duster Acrylic Refil 60 Cm', 'Kebersihan & Sanitasi', 3, 2, 'Pcs', 'Refill kain pel lobby duster acrylic 60 cm.', 'Baik'],
  ['1010305002000028', 'Alat Pel Mop (Pro Clean)', 'Kebersihan & Sanitasi', 1, 2, 'Pcs', 'Alat pel mop lantai merk Pro Clean.', 'Baik'],
  ['1010305002000029', 'Alat Pel Biasa (Dragon)', 'Kebersihan & Sanitasi', 3, 2, 'Pcs', 'Alat pel lantai biasa merk Dragon.', 'Baik'],
  ['1010305003000001', 'GAYUNG', 'Kebersihan & Sanitasi', 5, 2, 'Pcs', 'Gayung air plastik untuk kamar mandi.', 'Baik'],
  ['1010305004000002', 'PLASTIK SAMPAH PLASTIK 80x100', 'Kebersihan & Sanitasi', 10, 5, 'Pak', 'Plastik sampah besar hitam ukuran 80x100 cm.', 'Baik'],
  ['1010305004000006', 'Plastik Sampah 60 x 100', 'Kebersihan & Sanitasi', 13, 5, 'Pak', 'Plastik sampah hitam ukuran 60x100 cm.', 'Baik'],
  ['1010305008000002', 'SOKLIN LANTAI 900 AP', 'Kebersihan & Sanitasi', 14, 3, 'Pouch', 'Pembersih lantai So Klin lantai kemasan 900 ml.', 'Baik'],
  ['1010305008000003', 'WIPOL', 'Kebersihan & Sanitasi', 16, 3, 'Pouch', 'Cairan disinfektan pembersih lantai Wipol.', 'Baik'],
  ['1010305008000006', 'PEMBERSIH TOILET HARPIC', 'Kebersihan & Sanitasi', 8, 3, 'Botol', 'Cairan pembersih toilet Harpic.', 'Baik'],
  ['1010305008000016', 'Refill Sunlight 1600 ml', 'Kebersihan & Sanitasi', 10, 3, 'Pouch', 'Sabun cuci piring Sunlight refill 1600 ml.', 'Baik'],
  ['1010305008000032', 'MPC Cleaner', 'Kebersihan & Sanitasi', 4, 2, 'Botol', 'Multi Purpose Cleaner (cairan pembersih serbaguna).', 'Baik'],
  ['1010305008000033', 'Polish Marmer & Granit (Primo) 320 gr', 'Kebersihan & Sanitasi', 3, 2, 'Pcs', 'Cairan poles marmer & granit Primo 320 gr.', 'Baik'],
  ['1010305008000034', 'Kit Metal Polish Cream', 'Kebersihan & Sanitasi', 7, 2, 'Pcs', 'Krim pengkilap logam merk Kit.', 'Baik'],
  ['1010305008000035', 'Pembasmi Karat Penetrate Megacool Spray', 'Kebersihan & Sanitasi', 2, 2, 'Pcs', 'Semprotan pembasmi karat Megacool.', 'Baik'],
  ['1010305012000002', 'REFILL PERFUME ACE HARDWARE', 'Kebersihan & Sanitasi', 20, 5, 'Pcs', 'Isi ulang parfum ruangan Ace Hardware.', 'Baik'],
  ['1010305012000004', 'Pengharum ruangan Stella', 'Kebersihan & Sanitasi', 14, 5, 'Pcs', 'Pengharum ruangan gantung Stella.', 'Baik'],
  ['1010305012000006', 'Kamper Toilet Bulat', 'Kebersihan & Sanitasi', 15, 5, 'Pak', 'Kamper/kapur barus bulat untuk toilet.', 'Baik'],
  ['1010305999000011', 'Pewangi Karpet Malabeez 250 ml', 'Kebersihan & Sanitasi', 6, 2, 'Botol', 'Cairan pewangi karpet Malabeez 250 ml.', 'Baik'],
  ['1010306001000001', 'Kabel Roll 5M', 'Peralatan & IT', 3, 2, 'Pcs', 'Kabel roll perpanjangan listrik panjang 5 meter.', 'Baik'],
  ['1010306010000001', 'BATU BATERAI ALKALINE AAA', 'Peralatan & IT', 35, 10, 'Pcs', 'Baterai alkaline ukuran AAA.', 'Baik'],
  ['1010306010000003', 'BATU BATERAI ALKALINE AA', 'Peralatan & IT', 44, 10, 'Pcs', 'Baterai alkaline ukuran AA.', 'Baik'],
  ['1010306999000004', 'TERMINAL 5 LUBANG', 'Peralatan & IT', 7, 2, 'Pcs', 'Terminal colokan listrik 5 lubang.', 'Baik'],
  ['1010306999000007', 'Dak Kabel TC 4', 'Peralatan & IT', 30, 5, 'Pcs', 'Dak pelindung kabel ukuran TC 4.', 'Baik'],
  ['1010309001000002', 'MATERAI 10000', 'Kertas & Dokumen', 184, 20, 'Pcs', 'Materai tempel nominal 10.000 rupiah.', 'Baik'],
  ['1010309001000002', 'Tisu Basah', 'Kebersihan & Sanitasi', 20, 5, 'Pack', 'Tisu basah antiseptik.', 'Baik'],
  ['1010309999000001', 'Tisu Gulung Livi', 'Kebersihan & Sanitasi', 129, 20, 'Roll', 'Tisu toilet roll merk Livi.', 'Baik'],
  ['1010309999000004', 'Spons Busa Cuci Piring #M', 'Kebersihan & Sanitasi', 1, 2, 'Pcs', 'Spons cuci piring ukuran medium.', 'Baik'],
  ['1010309999000005', 'Tisu Wajah Paseo', 'Kebersihan & Sanitasi', 90, 15, 'Pack', 'Tisu wajah Paseo softpack.', 'Baik'],
  ['1010309999000007', 'Tisu Livi Hand Towel', 'Kebersihan & Sanitasi', 81, 15, 'Pack', 'Tisu pengering tangan Livi hand towel.', 'Baik'],
  ['1010313001000001', 'SOLAR', 'Kebersihan & Sanitasi', 86, 20, 'Liter', 'Bahan bakar solar untuk mesin genset Kanim.', 'Baik'],
  ['1010315001000001', 'SPRI Paspor Biasa 48 Hal', 'Kertas & Dokumen', 260, 50, 'Buku', 'Surat Perjalanan Republik Indonesia (Paspor) 48 Halaman.', 'Baik'],
  ['1010315001000002', 'SPRI Paspor Biasa 24 Hal', 'Kertas & Dokumen', 542, 50, 'Buku', 'Surat Perjalanan Republik Indonesia (Paspor) 24 Halaman.', 'Baik'],
  ['1010315001000003', 'Perdim 23', 'Kertas & Dokumen', 400, 50, 'Buku', 'Formulir keimigrasian Perdim 23.', 'Baik'],
  ['1010315001000004', 'Perdim 25', 'Kertas & Dokumen', 2500, 100, 'Buku', 'Formulir keimigrasian Perdim 25.', 'Baik'],
  ['1010315001000005', 'Perdim 28', 'Kertas & Dokumen', 580, 50, 'Buku', 'Formulir keimigrasian Perdim 28.', 'Baik']
];

async function setupDatabase(reset = false) {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const dbName = process.env.DB_NAME || 'db_atk_kanim';

  console.log(`Connecting to MySQL server at ${host}...`);
  const conn = await mysql.createConnection({ host, user, password });

  try {
    if (reset) {
      console.log(`Reset requested: dropping database ${dbName} if exists...`);
      await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    }

    console.log(`Verifying/Creating database \`${dbName}\`...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);

    console.log('Verifying/Creating tables...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`role\` ENUM('admin', 'pegawai') NOT NULL,
        \`division\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`atk_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`code\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`stock\` INT NOT NULL DEFAULT 0,
        \`min_stock\` INT NOT NULL DEFAULT 5,
        \`unit\` VARCHAR(50) NOT NULL,
        \`description\` TEXT NULL,
        \`condition_status\` VARCHAR(50) DEFAULT 'Baik',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`requests\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`request_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`user_id\` INT NOT NULL,
        \`purpose\` TEXT NOT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`request_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`request_id\` INT NOT NULL,
        \`atk_item_id\` INT NOT NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        FOREIGN KEY (\`request_id\`) REFERENCES \`requests\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`atk_item_id\`) REFERENCES \`atk_items\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`request_history\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`request_id\` INT NOT NULL,
        \`status\` VARCHAR(50) NOT NULL,
        \`by_user_name\` VARCHAR(100) NOT NULL,
        \`remarks\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`request_id\`) REFERENCES \`requests\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    console.log('Seeding users...');
    for (const u of usersSeed) {
      const [username, plainPassword, name, role, division] = u;
      const [rows] = await conn.query('SELECT COUNT(*) AS cnt FROM `users` WHERE `username` = ?', [username]);
      if (rows[0].cnt === 0) {
        const hashedPassword = bcrypt.hashSync(plainPassword, 10);
        await conn.query(
          'INSERT INTO `users` (`username`, `password`, `name`, `role`, `division`) VALUES (?, ?, ?, ?, ?)',
          [username, hashedPassword, name, role, division]
        );
      }
    }

    console.log('Seeding ATK items...');
    if (reset) {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      await conn.query('TRUNCATE TABLE `atk_items`');
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // Check if items table is empty
    const [itemRows] = await conn.query('SELECT COUNT(*) AS cnt FROM `atk_items`');
    if (itemRows[0].cnt === 0) {
      const insertStmt = 'INSERT INTO `atk_items` (`code`, `name`, `category`, `stock`, `min_stock`, `unit`, `description`, `condition_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      for (const item of atkItemsSeed) {
        await conn.query(insertStmt, item);
      }
      console.log(`Seeded ${atkItemsSeed.length} items successfully.`);
    } else {
      console.log('ATK items already seeded, skipping.');
    }

    console.log('Database setup complete successfully.');
  } catch (err) {
    console.error('Error setting up database:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  // Executed from command line
  const resetArg = process.argv.includes('--reset') || process.argv.includes('-r');
  setupDatabase(resetArg)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = setupDatabase;
