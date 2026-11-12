const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const setupDatabase = require('./setup-db');

const app = express();
const upload = multer();

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretatkkanimkey123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Serves static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Set EJS as templating engine for printable reports
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Helpers for Auth checking
function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Sesi berakhir, silakan masuk kembali.' });
  }
  next();
}

function checkAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Sesi berakhir, silakan masuk kembali.' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang dapat melakukan tindakan ini.' });
  }
  next();
}

// Helper: Format DateTime to Indonesian text
function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

// Helper: Format Date Only to Indonesian full text
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const statusLabels = {
  'pending': 'PENDING',
  'approved': 'DISETUJUI',
  'rejected': 'DITOLAK',
  'completed': 'SELESAI (DISERAHKAN)'
};

// =============================================
// ROUTE: PRINT REPORT (print_laporan.php)
// =============================================
app.get('/print_laporan.php', async (req, res) => {
  // Check authorization
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send("Akses ditolak. Silakan masuk sebagai Admin terlebih dahulu.");
  }

  const { start_date, end_date, division, status } = req.query;

  try {
    let sql = `
      SELECT r.*, u.name as requester_name, u.division 
      FROM \`requests\` r 
      JOIN \`users\` u ON r.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (start_date) {
      sql += ' AND DATE(r.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(r.created_at) <= ?';
      params.push(end_date);
    }
    if (division) {
      sql += ' AND u.division = ?';
      params.push(division);
    }

    sql += ' ORDER BY r.id ASC';

    const [requests] = await db.query(sql, params);

    // Fetch items for each request
    for (const reqRec of requests) {
      const [items] = await db.query(`
        SELECT ri.quantity, ai.name, ai.unit 
        FROM \`request_items\` ri 
        JOIN \`atk_items\` ai ON ri.atk_item_id = ai.id 
        WHERE ri.request_id = ?
      `, [reqRec.id]);
      reqRec.items = items;
    }

    res.render('print_laporan', {
      requests,
      start_date,
      end_date,
      division,
      status,
      statusLabels,
      formatDate,
      formatDateTime,
      printDate: formatDate(new Date())
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error: " + err.message);
  }
});

// =============================================
// API.PHP CONTROLLER ROUTE
// =============================================
app.all('/api.php', upload.none(), async (req, res) => {
  const action = req.query.action || req.body.action || '';

  try {
    switch (action) {
      case 'check_session':
        if (req.session.user) {
          return res.json({ success: true, user: req.session.user });
        }
        return res.json({ success: false });

      case 'login': {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.json({ success: false, message: 'Username dan Password harus diisi.' });
        }

        const [rows] = await db.query('SELECT * FROM `users` WHERE `username` = ?', [username]);
        if (rows.length === 0) {
          return res.json({ success: false, message: 'Username atau password salah.' });
        }

        const user = rows[0];
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
          return res.json({ success: false, message: 'Username atau password salah.' });
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          division: user.division
        };

        return res.json({ success: true, user: req.session.user });
      }

      case 'logout':
        req.session.destroy();
        return res.json({ success: true });

      case 'get_stats': {
        if (!req.session.user) {
          return res.status(401).json({ success: false, message: 'Sesi berakhir.' });
        }
        const user = req.session.user;

        if (user.role === 'admin') {
          const [[{ total_items }]] = await db.query('SELECT COUNT(*) AS total_items FROM `atk_items`');
          const [[{ low_stock }]] = await db.query('SELECT COUNT(*) AS low_stock FROM `atk_items` WHERE `stock` <= `min_stock`');
          const [[{ pending }]] = await db.query('SELECT COUNT(*) AS pending FROM `requests` WHERE `status` = \'pending\'');
          const [[{ completed }]] = await db.query('SELECT COUNT(*) AS completed FROM `requests` WHERE `status` = \'completed\'');
          
          return res.json({ success: true, total_items, low_stock, pending, completed });
        } else {
          const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM `requests` WHERE `user_id` = ?', [user.id]);
          const [[{ pending }]] = await db.query('SELECT COUNT(*) AS pending FROM `requests` WHERE `user_id` = ? AND `status` = \'pending\'', [user.id]);
          const [[{ approved }]] = await db.query('SELECT COUNT(*) AS approved FROM `requests` WHERE `user_id` = ? AND (`status` = \'approved\' OR `status` = \'completed\')', [user.id]);
          const [[{ rejected }]] = await db.query('SELECT COUNT(*) AS rejected FROM `requests` WHERE `user_id` = ? AND `status` = \'rejected\'', [user.id]);
          
          return res.json({ success: true, total, pending, approved, rejected });
        }
      }

      case 'get_catalog': {
        if (!req.session.user) return res.status(401).json({ success: false });
        const search = (req.query.search || '').trim();
        const category = (req.query.category || '').trim();

        let sql = 'SELECT * FROM `atk_items` WHERE 1=1';
        const params = [];

        if (search) {
          sql += ' AND (`name` LIKE ? OR `code` LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
          sql += ' AND `category` = ?';
          params.push(category);
        }
        sql += ' ORDER BY `name` ASC';

        const [items] = await db.query(sql, params);
        return res.json({ success: true, data: items });
      }

      case 'get_inventory': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const search = (req.query.search || '').trim();
        const category = (req.query.category || '').trim();

        let sql = 'SELECT * FROM `atk_items` WHERE 1=1';
        const params = [];

        if (search) {
          sql += ' AND (`name` LIKE ? OR `code` LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
          sql += ' AND `category` = ?';
          params.push(category);
        }
        sql += ' ORDER BY `id` DESC';

        const [items] = await db.query(sql, params);
        return res.json({ success: true, data: items });
      }

      case 'get_low_stock': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const [items] = await db.query('SELECT * FROM `atk_items` WHERE `stock` <= `min_stock` ORDER BY `stock` ASC');
        return res.json({ success: true, data: items });
      }

      case 'save_atk': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const { id, name, category, unit, stock, min_stock, code, condition, description } = req.body;

        if (!name || !category || !unit || !code) {
          return res.json({ success: false, message: 'Semua kolom bertanda bintang wajib diisi.' });
        }

        if (id) {
          // Update
          await db.query(
            'UPDATE `atk_items` SET `code` = ?, `name` = ?, `category` = ?, `stock` = ?, `min_stock` = ?, `unit` = ?, `description` = ?, `condition_status` = ? WHERE `id` = ?',
            [code, name, category, parseInt(stock) || 0, parseInt(min_stock) || 5, unit, description || '', condition || 'Baik', id]
          );
          return res.json({ success: true, message: 'Barang ATK berhasil diperbarui.' });
        } else {
          // Insert
          await db.query(
            'INSERT INTO `atk_items` (`code`, `name`, `category`, `stock`, `min_stock`, `unit`, `description`, `condition_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, name, category, parseInt(stock) || 0, parseInt(min_stock) || 5, unit, description || '', condition || 'Baik']
          );
          return res.json({ success: true, message: 'Barang ATK baru berhasil ditambahkan.' });
        }
      }

      case 'delete_atk': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const { id } = req.body;
        if (!id) return res.json({ success: false, message: 'ID tidak ditemukan.' });

        await db.query('DELETE FROM `atk_items` WHERE `id` = ?', [id]);
        return res.json({ success: true, message: 'Barang ATK berhasil dihapus.' });
      }

      case 'add_request': {
        if (!req.session.user) return res.status(401).json({ success: false });
        const user = req.session.user;
        const { items: itemsJson, purpose } = req.body;

        let items;
        try {
          items = JSON.parse(itemsJson);
        } catch (e) {
          return res.json({ success: false, message: 'Data keranjang tidak valid.' });
        }

        if (!items || items.length === 0 || !purpose) {
          return res.json({ success: false, message: 'Keranjang pengajuan atau alasan keperluan kosong.' });
        }

        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();

          // Check stock levels first
          for (const item of items) {
            const [rows] = await conn.query('SELECT `stock`, `name`, `unit` FROM `atk_items` WHERE `id` = ?', [item.id]);
            if (rows.length === 0) {
              throw new Error(`Barang ID ${item.id} tidak ditemukan di database.`);
            }
            const dbItem = rows[0];
            if (dbItem.stock < item.quantity) {
              throw new Error(`Stok untuk "${dbItem.name}" tidak mencukupi. Tersedia: ${dbItem.stock} ${dbItem.unit}`);
            }
          }

          // Generate unique REQ code
          const [[{ max_id }]] = await conn.query('SELECT MAX(`id`) AS max_id FROM `requests`');
          const nextId = (max_id || 0) + 1;
          const requestCode = `REQ-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

          // Insert request
          const [result] = await conn.query(
            'INSERT INTO `requests` (`request_code`, `user_id`, `purpose`, `status`, `remarks`) VALUES (?, ?, ?, \'pending\', \'\')',
            [requestCode, user.id, purpose]
          );
          const requestDbId = result.insertId;

          // Insert items
          for (const item of items) {
            await conn.query(
              'INSERT INTO `request_items` (`request_id`, `atk_item_id`, `quantity`) VALUES (?, ?, ?)',
              [requestDbId, item.id, item.quantity]
            );
          }

          // Insert timeline history
          await conn.query(
            'INSERT INTO `request_history` (`request_id`, `status`, `by_user_name`, `remarks`) VALUES (?, \'pending\', ?, \'Pengajuan dibuat oleh pegawai\')',
            [requestDbId, user.name]
          );

          await conn.commit();
          return res.json({ success: true, request: { id: requestCode } });

        } catch (err) {
          await conn.rollback();
          return res.json({ success: false, message: err.message });
        } finally {
          conn.release();
        }
      }

      case 'get_requests': {
        if (!req.session.user) return res.status(401).json({ success: false });
        const user = req.session.user;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const start_date = (req.query.start_date || '').trim();
        const end_date = (req.query.end_date || '').trim();
        const division = (req.query.division || '').trim();

        let sql = `
          SELECT r.*, u.name as requester_name, u.division 
          FROM \`requests\` r 
          JOIN \`users\` u ON r.user_id = u.id 
          WHERE 1=1
        `;
        const params = [];

        if (user.role === 'pegawai') {
          sql += ' AND r.user_id = ?';
          params.push(user.id);
        }
        if (search) {
          sql += ' AND (r.request_code LIKE ? OR u.name LIKE ? OR u.division LIKE ?)';
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
          sql += ' AND r.status = ?';
          params.push(status);
        }
        if (start_date) {
          sql += ' AND DATE(r.created_at) >= ?';
          params.push(start_date);
        }
        if (end_date) {
          sql += ' AND DATE(r.created_at) <= ?';
          params.push(end_date);
        }
        if (division) {
          sql += ' AND u.division = ?';
          params.push(division);
        }

        sql += ' ORDER BY r.id DESC';

        const [requests] = await db.query(sql, params);
        const resultData = [];

        for (const reqRec of requests) {
          const [items] = await db.query(`
            SELECT ri.quantity, ai.name, ai.unit 
            FROM \`request_items\` ri 
            JOIN \`atk_items\` ai ON ri.atk_item_id = ai.id 
            WHERE ri.request_id = ?
          `, [reqRec.id]);

          resultData.push({
            id: reqRec.request_code,
            date: reqRec.created_at,
            name: reqRec.requester_name,
            division: reqRec.division,
            items: items.map(it => ({ name: it.name, quantity: it.quantity, unit: it.unit })),
            purpose: reqRec.purpose,
            status: reqRec.status,
            remarks: reqRec.remarks
          });
        }

        return res.json({ success: true, data: resultData });
      }

      case 'get_request_detail': {
        if (!req.session.user) return res.status(401).json({ success: false });
        const { id } = req.query;
        if (!id) return res.json({ success: false, message: 'ID tidak valid.' });

        const [reqRows] = await db.query(`
          SELECT r.*, u.name as requester_name, u.division 
          FROM \`requests\` r 
          JOIN \`users\` u ON r.user_id = u.id 
          WHERE r.request_code = ?
        `, [id]);

        if (reqRows.length === 0) {
          return res.json({ success: false, message: 'Pengajuan tidak ditemukan.' });
        }

        const reqRec = reqRows[0];
        if (req.session.user.role === 'pegawai' && reqRec.user_id !== req.session.user.id) {
          return res.json({ success: false, message: 'Akses ditolak.' });
        }

        const [items] = await db.query(`
          SELECT ri.quantity, ai.code, ai.name, ai.unit 
          FROM \`request_items\` ri 
          JOIN \`atk_items\` ai ON ri.atk_item_id = ai.id 
          WHERE ri.request_id = ?
        `, [reqRec.id]);

        const [history] = await db.query(`
          SELECT * FROM \`request_history\` 
          WHERE \`request_id\` = ? 
          ORDER BY \`id\` ASC
        `, [reqRec.id]);

        return res.json({
          success: true,
          data: {
            id: reqRec.request_code,
            date: reqRec.created_at,
            name: reqRec.requester_name,
            division: reqRec.division,
            purpose: reqRec.purpose,
            status: reqRec.status,
            remarks: reqRec.remarks,
            items,
            statusHistory: history.map(h => ({
              status: h.status,
              date: h.created_at,
              by: h.by_user_name,
              remarks: h.remarks
            }))
          }
        });
      }

      case 'update_request_status': {
        if (!req.session.user) return res.status(401).json({ success: false });
        const user = req.session.user;
        const { id, status, remarks } = req.body;

        if (!id || !status) {
          return res.json({ success: false, message: 'ID pengajuan dan status baru harus diisi.' });
        }

        if (user.role === 'pegawai' && status !== 'rejected') {
          return res.json({ success: false, message: 'Tindakan tidak valid bagi pegawai.' });
        }

        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();

          const [reqRows] = await conn.query('SELECT * FROM `requests` WHERE `request_code` = ?', [id]);
          if (reqRows.length === 0) {
            throw new Error(`Pengajuan ${id} tidak ditemukan.`);
          }
          const reqRec = reqRows[0];

          let resolvedRemarks = remarks || '';
          if (user.role === 'pegawai') {
            if (reqRec.user_id !== user.id) throw new Error('Akses ditolak.');
            if (reqRec.status !== 'pending') throw new Error('Pengajuan tidak dapat dibatalkan karena sudah diproses.');
            resolvedRemarks = 'Dibatalkan oleh Pengaju (Pegawai).';
          }

          if (user.role === 'admin' && status === 'approved' && reqRec.status === 'pending') {
            // Deduct stock
            const [reqItems] = await conn.query('SELECT `atk_item_id`, `quantity` FROM `request_items` WHERE `request_id` = ?', [reqRec.id]);
            for (const it of reqItems) {
              const [atkRows] = await conn.query('SELECT `stock`, `name`, `unit` FROM `atk_items` WHERE `id` = ? FOR UPDATE', [it.atk_item_id]);
              const dbItem = atkRows[0];
              if (dbItem.stock < it.quantity) {
                throw new Error(`Stok untuk "${dbItem.name}" tidak mencukupi untuk disetujui. Tersedia: ${dbItem.stock} ${dbItem.unit}`);
              }
              await conn.query('UPDATE `atk_items` SET `stock` = `stock` - ? WHERE `id` = ?', [it.quantity, it.atk_item_id]);
            }
          }

          // Update status
          await conn.query('UPDATE `requests` SET `status` = ?, `remarks` = ? WHERE `id` = ?', [status, resolvedRemarks, reqRec.id]);

          // Write history
          await conn.query(
            'INSERT INTO `request_history` (`request_id`, `status`, `by_user_name`, `remarks`) VALUES (?, ?, ?, ?)',
            [reqRec.id, status, user.name, resolvedRemarks]
          );

          await conn.commit();
          return res.json({ success: true });

        } catch (err) {
          await conn.rollback();
          return res.json({ success: false, message: err.message });
        } finally {
          conn.release();
        }
      }

      case 'reset_database': {
        if (!req.session.user) return res.status(401).json({ success: false });
        await setupDatabase(true);
        req.session.destroy();
        return res.json({ success: true });
      }

      case 'get_users': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const [users] = await db.query('SELECT `id`, `username`, `name`, `role`, `division`, `created_at` FROM `users` ORDER BY `id` ASC');
        return res.json({ success: true, data: users });
      }

      case 'save_user': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const { id, name, username, role, division, password } = req.body;

        if (!name || !username || !division) {
          return res.json({ success: false, message: 'Nama, username, dan seksi wajib diisi.' });
        }

        if (id) {
          // Update
          if (password) {
            if (password.length < 6) return res.json({ success: false, message: 'Password minimal 6 karakter.' });
            const hashed = bcrypt.hashSync(password, 10);
            await db.query(
              'UPDATE `users` SET `name`=?, `username`=?, `role`=?, `division`=?, `password`=? WHERE `id`=?',
              [name, username, role, division, hashed, id]
            );
          } else {
            await db.query(
              'UPDATE `users` SET `name`=?, `username`=?, `role`=?, `division`=? WHERE `id`=?',
              [name, username, role, division, id]
            );
          }
          return res.json({ success: true, message: 'Data pengguna berhasil diperbarui.' });
        } else {
          // Insert
          if (!password || password.length < 6) return res.json({ success: false, message: 'Password baru minimal 6 karakter.' });
          
          const [chk] = await db.query('SELECT COUNT(*) AS cnt FROM `users` WHERE `username` = ?', [username]);
          if (chk[0].cnt > 0) {
            return res.json({ success: false, message: `Username "${username}" sudah digunakan. Pilih username lain.` });
          }

          const hashed = bcrypt.hashSync(password, 10);
          await db.query(
            'INSERT INTO `users` (`name`, `username`, `password`, `role`, `division`) VALUES (?, ?, ?, ?, ?)',
            [name, username, hashed, role, division]
          );
          return res.json({ success: true, message: `Pengguna "${name}" berhasil ditambahkan.` });
        }
      }

      case 'delete_user': {
        if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ success: false });
        const { id } = req.body;
        if (!id) return res.json({ success: false, message: 'ID pengguna tidak valid.' });

        if (parseInt(id) === req.session.user.id) {
          return res.json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
        }

        await db.query('DELETE FROM `users` WHERE `id` = ?', [id]);
        return res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
      }

      case 'change_password': {
        if (!req.session.user) return res.status(401).json({ success: false });
        const { old_password, new_password, confirm_password } = req.body;

        if (!old_password || !new_password || !confirm_password) {
          return res.json({ success: false, message: 'Semua kolom wajib diisi.' });
        }
        if (new_password !== confirm_password) {
          return res.json({ success: false, message: 'Konfirmasi password baru tidak cocok.' });
        }
        if (new_password.length < 6) {
          return res.json({ success: false, message: 'Password baru minimal 6 karakter.' });
        }

        const userId = req.session.user.id;
        const [rows] = await db.query('SELECT `password` FROM `users` WHERE `id` = ?', [userId]);
        if (rows.length === 0) return res.json({ success: false, message: 'Pengguna tidak ditemukan.' });

        const user = rows[0];
        const isMatch = bcrypt.compareSync(old_password, user.password);
        if (!isMatch) {
          return res.json({ success: false, message: 'Password lama salah.' });
        }

        const hashed = bcrypt.hashSync(new_password, 10);
        await db.query('UPDATE `users` SET `password` = ? WHERE `id` = ?', [hashed, userId]);
        return res.json({ success: true, message: 'Password Anda berhasil diperbarui.' });
      }

      default:
        return res.json({ success: false, message: 'Action tidak dikenali.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
