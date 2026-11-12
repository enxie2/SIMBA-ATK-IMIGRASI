<?php
header('Content-Type: application/json');
require_once 'config.php';

$db = getDBConnection();
if ($db === null) {
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal. Silakan jalankan instalasi.']);
    exit;
}

// Helper: check if request is post
function isPost() {
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

// Helper: check auth
function checkAuth() {
    if (!isset($_SESSION['user'])) {
        echo json_encode(['success' => false, 'message' => 'Sesi berakhir, silakan masuk kembali.']);
        exit;
    }
}

// Helper: check admin
function checkAdmin() {
    checkAuth();
    if ($_SESSION['user']['role'] !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya Admin yang dapat melakukan tindakan ini.']);
        exit;
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'login':
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        
        $username = isset($_POST['username']) ? trim($_POST['username']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Username dan Password harus diisi.']);
            break;
        }
        
        try {
            $stmt = $db->prepare("SELECT * FROM `users` WHERE `username` = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user'] = [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'division' => $user['division']
                ];
                echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Username atau password salah.']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    case 'get_stats':
        checkAuth();
        $user = $_SESSION['user'];
        try {
            if ($user['role'] === 'admin') {
                // ATK count
                $stmt1 = $db->query("SELECT COUNT(*) FROM `atk_items`");
                $total_items = $stmt1->fetchColumn();
                
                // Low stock
                $stmt2 = $db->query("SELECT COUNT(*) FROM `atk_items` WHERE `stock` <= `min_stock`");
                $low_stock = $stmt2->fetchColumn();
                
                // Pending requests
                $stmt3 = $db->query("SELECT COUNT(*) FROM `requests` WHERE `status` = 'pending'");
                $pending = $stmt3->fetchColumn();
                
                // Completed requests
                $stmt4 = $db->query("SELECT COUNT(*) FROM `requests` WHERE `status` = 'completed'");
                $completed = $stmt4->fetchColumn();
                
                echo json_encode([
                    'success' => true,
                    'total_items' => $total_items,
                    'low_stock' => $low_stock,
                    'pending' => $pending,
                    'completed' => $completed
                ]);
            } else {
                // Pegawai stats
                $stmt1 = $db->prepare("SELECT COUNT(*) FROM `requests` WHERE `user_id` = ?");
                $stmt1->execute([$user['id']]);
                $total = $stmt1->fetchColumn();
                
                $stmt2 = $db->prepare("SELECT COUNT(*) FROM `requests` WHERE `user_id` = ? AND `status` = 'pending'");
                $stmt2->execute([$user['id']]);
                $pending = $stmt2->fetchColumn();
                
                $stmt3 = $db->prepare("SELECT COUNT(*) FROM `requests` WHERE `user_id` = ? AND (`status` = 'approved' OR `status` = 'completed')");
                $stmt3->execute([$user['id']]);
                $approved = $stmt3->fetchColumn();
                
                $stmt4 = $db->prepare("SELECT COUNT(*) FROM `requests` WHERE `user_id` = ? AND `status` = 'rejected'");
                $stmt4->execute([$user['id']]);
                $rejected = $stmt4->fetchColumn();
                
                echo json_encode([
                    'success' => true,
                    'total' => $total,
                    'pending' => $pending,
                    'approved' => $approved,
                    'rejected' => $rejected
                ]);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_catalog':
        checkAuth();
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';
        
        try {
            $sql = "SELECT * FROM `atk_items` WHERE 1=1";
            $params = [];
            
            if (!empty($search)) {
                $sql .= " AND (`name` LIKE ? OR `code` LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            if (!empty($category)) {
                $sql .= " AND `category` = ?";
                $params[] = $category;
            }
            
            $sql .= " ORDER BY `name` ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $items = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $items]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_inventory':
        checkAdmin();
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $category = isset($_GET['category']) ? trim($_GET['category']) : '';
        
        try {
            $sql = "SELECT * FROM `atk_items` WHERE 1=1";
            $params = [];
            
            if (!empty($search)) {
                $sql .= " AND (`name` LIKE ? OR `code` LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            if (!empty($category)) {
                $sql .= " AND `category` = ?";
                $params[] = $category;
            }
            
            $sql .= " ORDER BY `id` DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $items = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $items]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_low_stock':
        checkAdmin();
        try {
            $stmt = $db->query("SELECT * FROM `atk_items` WHERE `stock` <= `min_stock` ORDER BY `stock` ASC");
            $items = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $items]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'save_atk':
        checkAdmin();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        
        $id = isset($_POST['id']) ? trim($_POST['id']) : '';
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $category = isset($_POST['category']) ? trim($_POST['category']) : '';
        $unit = isset($_POST['unit']) ? trim($_POST['unit']) : '';
        $stock = isset($_POST['stock']) ? intval($_POST['stock']) : 0;
        $min_stock = isset($_POST['min_stock']) ? intval($_POST['min_stock']) : 5;
        $code = isset($_POST['code']) ? trim($_POST['code']) : '';
        $condition = isset($_POST['condition']) ? trim($_POST['condition']) : 'Baik';
        $description = isset($_POST['description']) ? trim($_POST['description']) : '';
        
        if (empty($name) || empty($category) || empty($unit) || empty($code)) {
            echo json_encode(['success' => false, 'message' => 'Semua kolom bertanda bintang wajib diisi.']);
            break;
        }
        
        try {
            if (!empty($id)) {
                // Update
                $stmt = $db->prepare("UPDATE `atk_items` SET `code` = ?, `name` = ?, `category` = ?, `stock` = ?, `min_stock` = ?, `unit` = ?, `description` = ?, `condition_status` = ? WHERE `id` = ?");
                $stmt->execute([$code, $name, $category, $stock, $min_stock, $unit, $description, $condition, $id]);
                echo json_encode(['success' => true, 'message' => 'Barang ATK berhasil diperbarui.']);
            } else {
                // Insert
                $stmt = $db->prepare("INSERT INTO `atk_items` (`code`, `name`, `category`, `stock`, `min_stock`, `unit`, `description`, `condition_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$code, $name, $category, $stock, $min_stock, $unit, $description, $condition]);
                echo json_encode(['success' => true, 'message' => 'Barang ATK baru berhasil ditambahkan.']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
        break;

    case 'delete_atk':
        checkAdmin();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        $id = isset($_POST['id']) ? trim($_POST['id']) : '';
        if (empty($id)) {
            echo json_encode(['success' => false, 'message' => 'ID tidak ditemukan.']);
            break;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM `atk_items` WHERE `id` = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Barang ATK berhasil dihapus.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus barang: ' . $e->getMessage()]);
        }
        break;

    case 'add_request':
        checkAuth();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        
        $user = $_SESSION['user'];
        $items_json = isset($_POST['items']) ? $_POST['items'] : '';
        $purpose = isset($_POST['purpose']) ? trim($_POST['purpose']) : '';
        
        $items = json_decode($items_json, true);
        if (empty($items) || empty($purpose)) {
            echo json_encode(['success' => false, 'message' => 'Keranjang pengajuan atau alasan keperluan kosong.']);
            break;
        }
        
        try {
            $db->beginTransaction();
            
            // Check stock levels first
            $stmt_check_stock = $db->prepare("SELECT `stock`, `name`, `unit` FROM `atk_items` WHERE `id` = ?");
            foreach ($items as $item) {
                $stmt_check_stock->execute([$item['id']]);
                $db_item = $stmt_check_stock->fetch();
                if (!$db_item) {
                    throw new Exception("Barang ID " . $item['id'] . " tidak ditemukan di database.");
                }
                if ($db_item['stock'] < $item['quantity']) {
                    throw new Exception("Stok untuk \"" . $db_item['name'] . "\" tidak mencukupi. Tersedia: " . $db_item['stock'] . " " . $db_item['unit']);
                }
            }
            
            // Generate unique REQ code
            $stmt_max_id = $db->query("SELECT MAX(`id`) FROM `requests`");
            $next_id = intval($stmt_max_id->fetchColumn()) + 1;
            $request_code = "REQ-" . date('Y') . "-" . str_pad($next_id, 4, '0', STR_PAD_LEFT);
            
            // Insert request
            $stmt_req = $db->prepare("INSERT INTO `requests` (`request_code`, `user_id`, `purpose`, `status`, `remarks`) VALUES (?, ?, ?, 'pending', '')");
            $stmt_req->execute([$request_code, $user['id'], $purpose]);
            $request_db_id = $db->lastInsertId();
            
            // Insert request items
            $stmt_item = $db->prepare("INSERT INTO `request_items` (`request_id`, `atk_item_id`, `quantity`) VALUES (?, ?, ?)");
            foreach ($items as $item) {
                $stmt_item->execute([$request_db_id, $item['id'], $item['quantity']]);
            }
            
            // Insert timeline history
            $stmt_hist = $db->prepare("INSERT INTO `request_history` (`request_id`, `status`, `by_user_name`, `remarks`) VALUES (?, 'pending', ?, 'Pengajuan dibuat oleh pegawai')");
            $stmt_hist->execute([$request_db_id, $user['name']]);
            
            $db->commit();
            echo json_encode(['success' => true, 'request' => ['id' => $request_code]]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_requests':
        checkAuth();
        $user = $_SESSION['user'];
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $status = isset($_GET['status']) ? trim($_GET['status']) : '';
        $start_date = isset($_GET['start_date']) ? trim($_GET['start_date']) : '';
        $end_date = isset($_GET['end_date']) ? trim($_GET['end_date']) : '';
        $division = isset($_GET['division']) ? trim($_GET['division']) : '';
        
        try {
            $sql = "SELECT r.*, u.`name` as `requester_name`, u.`division` 
                    FROM `requests` r 
                    JOIN `users` u ON r.`user_id` = u.`id` 
                    WHERE 1=1";
            $params = [];
            
            if ($user['role'] === 'pegawai') {
                $sql .= " AND r.`user_id` = ?";
                $params[] = $user['id'];
            }
            
            if (!empty($search)) {
                $sql .= " AND (r.`request_code` LIKE ? OR u.`name` LIKE ? OR u.`division` LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
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
            
            $sql .= " ORDER BY r.`id` DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $requests = $stmt->fetchAll();
            
            // Retrieve item lists for each request
            $stmt_items = $db->prepare("
                SELECT ri.`quantity`, ai.`name`, ai.`unit` 
                FROM `request_items` ri 
                JOIN `atk_items` ai ON ri.`atk_item_id` = ai.`id` 
                WHERE ri.`request_id` = ?
            ");
            
            $result_data = [];
            foreach ($requests as $req) {
                $stmt_items->execute([$req['id']]);
                $items = $stmt_items->fetchAll();
                
                $items_formatted = [];
                foreach ($items as $it) {
                    $items_formatted[] = [
                        'name' => $it['name'],
                        'quantity' => $it['quantity'],
                        'unit' => $it['unit']
                    ];
                }
                
                $result_data[] = [
                    'id' => $req['request_code'],
                    'date' => $req['created_at'],
                    'name' => $req['requester_name'],
                    'division' => $req['division'],
                    'items' => $items_formatted,
                    'purpose' => $req['purpose'],
                    'status' => $req['status'],
                    'remarks' => $req['remarks']
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $result_data]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_request_detail':
        checkAuth();
        $id = isset($_GET['id']) ? trim($_GET['id']) : '';
        if (empty($id)) {
            echo json_encode(['success' => false, 'message' => 'ID tidak valid.']);
            break;
        }
        
        try {
            // Fetch request master
            $stmt_req = $db->prepare("
                SELECT r.*, u.`name` as `requester_name`, u.`division` 
                FROM `requests` r 
                JOIN `users` u ON r.`user_id` = u.`id` 
                WHERE r.`request_code` = ?
            ");
            $stmt_req->execute([$id]);
            $req = $stmt_req->fetch();
            
            if (!$req) {
                echo json_encode(['success' => false, 'message' => 'Pengajuan tidak ditemukan.']);
                break;
            }
            
            // Check authorization (pegawai can only view their own)
            if ($_SESSION['user']['role'] === 'pegawai' && $req['user_id'] !== $_SESSION['user']['id']) {
                echo json_encode(['success' => false, 'message' => 'Akses ditolak. Anda tidak berhak melihat pengajuan ini.']);
                break;
            }
            
            // Fetch items
            $stmt_items = $db->prepare("
                SELECT ri.`quantity`, ai.`code`, ai.`name`, ai.`unit` 
                FROM `request_items` ri 
                JOIN `atk_items` ai ON ri.`atk_item_id` = ai.`id` 
                WHERE ri.`request_id` = ?
            ");
            $stmt_items->execute([$req['id']]);
            $items = $stmt_items->fetchAll();
            
            // Fetch history timeline
            $stmt_hist = $db->prepare("
                SELECT * FROM `request_history` 
                WHERE `request_id` = ? 
                ORDER BY `id` ASC
            ");
            $stmt_hist->execute([$req['id']]);
            $history = $stmt_hist->fetchAll();
            
            $history_formatted = [];
            foreach ($history as $h) {
                $history_formatted[] = [
                    'status' => $h['status'],
                    'date' => $h['created_at'],
                    'by' => $h['by_user_name'],
                    'remarks' => $h['remarks']
                ];
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $req['request_code'],
                    'date' => $req['created_at'],
                    'name' => $req['requester_name'],
                    'division' => $req['division'],
                    'purpose' => $req['purpose'],
                    'status' => $req['status'],
                    'remarks' => $req['remarks'],
                    'items' => $items,
                    'statusHistory' => $history_formatted
                ]
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'update_request_status':
        checkAuth();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        
        $user = $_SESSION['user'];
        $id = isset($_POST['id']) ? trim($_POST['id']) : '';
        $status = isset($_POST['status']) ? trim($_POST['status']) : '';
        $remarks = isset($_POST['remarks']) ? trim($_POST['remarks']) : '';
        
        if (empty($id) || empty($status)) {
            echo json_encode(['success' => false, 'message' => 'ID pengajuan dan status baru harus diisi.']);
            break;
        }
        
        // Authorization check
        if ($user['role'] === 'pegawai') {
            // Pegawai can only cancel (change pending to status rejected/cancelled)
            if ($status !== 'rejected') {
                echo json_encode(['success' => false, 'message' => 'Tindakan tidak valid bagi pegawai.']);
                break;
            }
        }
        
        try {
            $db->beginTransaction();
            
            // Get request record
            $stmt_req = $db->prepare("SELECT * FROM `requests` WHERE `request_code` = ?");
            $stmt_req->execute([$id]);
            $req = $stmt_req->fetch();
            
            if (!$req) {
                throw new Exception("Pengajuan $id tidak ditemukan.");
            }
            
            // Pegawai verification
            if ($user['role'] === 'pegawai') {
                if ($req['user_id'] !== $user['id']) {
                    throw new Exception("Akses ditolak.");
                }
                if ($req['status'] !== 'pending') {
                    throw new Exception("Pengajuan tidak dapat dibatalkan karena sudah diproses.");
                }
                $remarks = "Dibatalkan oleh Pengaju (Pegawai).";
            }
            
            // Process Admin Approval
            if ($user['role'] === 'admin') {
                if ($status === 'approved' && $req['status'] === 'pending') {
                    // Deduct stock for all items
                    $stmt_items = $db->prepare("SELECT `atk_item_id`, `quantity` FROM `request_items` WHERE `request_id` = ?");
                    $stmt_items->execute([$req['id']]);
                    $items = $stmt_items->fetchAll();
                    
                    $stmt_update_stock = $db->prepare("UPDATE `atk_items` SET `stock` = `stock` - ? WHERE `id` = ?");
                    $stmt_check_stock = $db->prepare("SELECT `stock`, `name`, `unit` FROM `atk_items` WHERE `id` = ? FOR UPDATE");
                    
                    foreach ($items as $item) {
                        $stmt_check_stock->execute([$item['atk_item_id']]);
                        $db_item = $stmt_check_stock->fetch();
                        
                        if ($db_item['stock'] < $item['quantity']) {
                            throw new Exception("Stok untuk \"" . $db_item['name'] . "\" tidak mencukupi untuk disetujui. Tersedia: " . $db_item['stock'] . " " . $db_item['unit']);
                        }
                        
                        $stmt_update_stock->execute([$item['quantity'], $item['atk_item_id']]);
                    }
                }
            }
            
            // Update request status
            $stmt_update = $db->prepare("UPDATE `requests` SET `status` = ?, `remarks` = ? WHERE `id` = ?");
            $stmt_update->execute([$status, $remarks, $req['id']]);
            
            // Write history
            $stmt_hist = $db->prepare("INSERT INTO `request_history` (`request_id`, `status`, `by_user_name`, `remarks`) VALUES (?, ?, ?, ?)");
            $stmt_hist->execute([$req['id'], $status, $user['name'], $remarks]);
            
            $db->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'reset_database':
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        // Run install.php operations silently
        ob_start();
        include 'install.php';
        ob_end_clean();
        
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    case 'get_users':
        checkAdmin();
        try {
            $stmt = $db->query("SELECT `id`, `username`, `name`, `role`, `division`, `created_at` FROM `users` ORDER BY `id` ASC");
            $users = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $users]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'save_user':
        checkAdmin();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }

        $id       = isset($_POST['id'])       ? trim($_POST['id'])       : '';
        $name     = isset($_POST['name'])     ? trim($_POST['name'])     : '';
        $username = isset($_POST['username']) ? trim($_POST['username']) : '';
        $role     = isset($_POST['role'])     ? trim($_POST['role'])     : 'pegawai';
        $division = isset($_POST['division']) ? trim($_POST['division']) : '';
        $password = isset($_POST['password']) ? $_POST['password']      : '';

        if (empty($name) || empty($username) || empty($division)) {
            echo json_encode(['success' => false, 'message' => 'Nama, username, dan seksi wajib diisi.']);
            break;
        }

        if (!in_array($role, ['admin', 'pegawai'])) {
            echo json_encode(['success' => false, 'message' => 'Role tidak valid.']);
            break;
        }

        try {
            if (!empty($id)) {
                // Update existing user
                if (!empty($password)) {
                    if (strlen($password) < 6) {
                        echo json_encode(['success' => false, 'message' => 'Password minimal 6 karakter.']);
                        break;
                    }
                    $hashed = password_hash($password, PASSWORD_BCRYPT);
                    $stmt = $db->prepare("UPDATE `users` SET `name`=?, `username`=?, `role`=?, `division`=?, `password`=? WHERE `id`=?");
                    $stmt->execute([$name, $username, $role, $division, $hashed, $id]);
                } else {
                    $stmt = $db->prepare("UPDATE `users` SET `name`=?, `username`=?, `role`=?, `division`=? WHERE `id`=?");
                    $stmt->execute([$name, $username, $role, $division, $id]);
                }
                echo json_encode(['success' => true, 'message' => 'Data pengguna berhasil diperbarui.']);
            } else {
                // Create new user
                if (empty($password) || strlen($password) < 6) {
                    echo json_encode(['success' => false, 'message' => 'Password baru minimal 6 karakter.']);
                    break;
                }
                // Check username uniqueness
                $stmt_chk = $db->prepare("SELECT COUNT(*) FROM `users` WHERE `username`=?");
                $stmt_chk->execute([$username]);
                if ($stmt_chk->fetchColumn() > 0) {
                    echo json_encode(['success' => false, 'message' => "Username \"$username\" sudah digunakan. Pilih username lain."]);
                    break;
                }
                $hashed = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $db->prepare("INSERT INTO `users` (`name`, `username`, `password`, `role`, `division`) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$name, $username, $hashed, $role, $division]);
                echo json_encode(['success' => true, 'message' => "Pengguna \"$name\" berhasil ditambahkan."]);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data: ' . $e->getMessage()]);
        }
        break;

    case 'delete_user':
        checkAdmin();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID pengguna tidak valid.']);
            break;
        }
        // Prevent admin from deleting their own account
        if ($id === (int)$_SESSION['user']['id']) {
            echo json_encode(['success' => false, 'message' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
            break;
        }
        try {
            $stmt = $db->prepare("DELETE FROM `users` WHERE `id` = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Pengguna berhasil dihapus.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus pengguna: ' . $e->getMessage()]);
        }
        break;

    case 'change_password':
        checkAuth();
        if (!isPost()) {
            echo json_encode(['success' => false, 'message' => 'Metode request tidak valid.']);
            break;
        }

        $user_id = $_SESSION['user']['id'];
        $old_pass = isset($_POST['old_password']) ? $_POST['old_password'] : '';
        $new_pass = isset($_POST['new_password']) ? $_POST['new_password'] : '';
        $confirm_pass = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

        if (empty($old_pass) || empty($new_pass) || empty($confirm_pass)) {
            echo json_encode(['success' => false, 'message' => 'Semua kolom wajib diisi.']);
            break;
        }

        if ($new_pass !== $confirm_pass) {
            echo json_encode(['success' => false, 'message' => 'Konfirmasi password baru tidak cocok.']);
            break;
        }

        if (strlen($new_pass) < 6) {
            echo json_encode(['success' => false, 'message' => 'Password baru minimal 6 karakter.']);
            break;
        }

        try {
            $stmt = $db->prepare("SELECT `password` FROM `users` WHERE `id` = ?");
            $stmt->execute([$user_id]);
            $current_hash = $stmt->fetchColumn();

            if (!$current_hash || !password_verify($old_pass, $current_hash)) {
                echo json_encode(['success' => false, 'message' => 'Password lama salah.']);
                break;
            }

            $new_hash = password_hash($new_pass, PASSWORD_BCRYPT);
            $stmt_update = $db->prepare("UPDATE `users` SET `password` = ? WHERE `id` = ?");
            $stmt_update->execute([$new_hash, $user_id]);

            echo json_encode(['success' => true, 'message' => 'Password Anda berhasil diperbarui.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Action tidak dikenali.']);
        break;
}
?>
