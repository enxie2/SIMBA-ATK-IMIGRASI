<?php
require_once '../backend/config.php';

// Verify database connection and check if table 'users' exists (otherwise prompt install)
$db = getDBConnection();
$is_installed = false;

if ($db !== null) {
    try {
        $result = $db->query("SELECT 1 FROM `users` LIMIT 1");
        $is_installed = true;
    } catch (PDOException $e) {
        $is_installed = false;
    }
}

// Redirect or show install prompt if not installed
if (!$is_installed) {
    include_once 'includes/install_prompt.php';
    exit;
}

// User session state
$user = isset($_SESSION['user']) ? $_SESSION['user'] : null;

// Header boilerplate
include_once 'includes/header.php';
?>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="toast-container"></div>

  <!-- ================= PAGE: LOGIN ================= -->
  <?php include_once 'includes/login.php'; ?>

  <!-- ================= MAIN APP CONTAINER (SIDEBAR + CONTENT) ================= -->
  <div id="app-container" class="app-layout <?php echo !$user ? 'hidden' : ''; ?>">
    
    <!-- SIDEBAR -->
    <?php include_once 'includes/sidebar.php'; ?>

    <!-- MAIN CONTENT AREA -->
    <main class="main-content">
      
      <!-- TOPBAR / HEADER -->
      <?php include_once 'includes/topbar.php'; ?>

      <!-- CONTENT PANELS -->
      <div class="content-body">
        <?php include_once 'includes/sections.php'; ?>
      </div>
    </main>
  </div>

  <!-- ================= MODALS ================= -->
  <?php include_once 'includes/modals.php'; ?>

  <!-- ================= FOOTER & SCRIPTS ================= -->
  <?php include_once 'includes/footer.php'; ?>
