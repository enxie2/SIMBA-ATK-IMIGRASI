    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <img src="images/logo-kanim.jpg" alt="Logo Kanim Tasikmalaya" class="logo-small" style="border-radius: 50%; object-fit: cover;">
        <div class="brand-text" style="text-align: left; flex: 1;">
          <h2 style="text-transform: uppercase; text-align: left;">IMIGRASI TASIKMALAYA</h2>
          <span style="display: block; text-align: left;">E-ATK System</span>
        </div>
      </div>

      <div class="user-profile-badge">
        <div class="user-avatar">
          <i data-lucide="user"></i>
        </div>
        <div class="user-info">
          <h4 id="user-display-name"><?php echo $user ? htmlspecialchars($user['name']) : ''; ?></h4>
          <span id="user-display-role"><?php echo $user ? htmlspecialchars($user['division']) : ''; ?></span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <!-- Pegawai Nav -->
          <li class="nav-item-pegawai">
            <a href="#" class="nav-link active" data-target="section-pegawai-dashboard">
              <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
            </a>
          </li>
          <li class="nav-item-pegawai">
            <a href="#" class="nav-link" data-target="section-pegawai-request">
              <i data-lucide="shopping-bag"></i> <span>Pengajuan ATK</span>
            </a>
          </li>
          <li class="nav-item-pegawai">
            <a href="#" class="nav-link" data-target="section-pegawai-history">
              <i data-lucide="history"></i> <span>Riwayat Pengajuan</span>
            </a>
          </li>
          <li class="nav-item-pegawai">
            <a href="#" class="nav-link" data-target="section-change-password">
              <i data-lucide="key-round"></i> <span>Ubah Password</span>
            </a>
          </li>

          <!-- Admin Nav -->
          <li class="nav-item-admin">
            <a href="#" class="nav-link active" data-target="section-admin-dashboard">
              <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
            </a>
          </li>
          <li class="nav-item-admin">
            <a href="#" class="nav-link" data-target="section-admin-requests">
              <i data-lucide="clipboard-list"></i> <span>Kelola Pengajuan</span>
              <span class="badge badge-accent hidden" id="badge-pending-count">0</span>
            </a>
          </li>
          <li class="nav-item-admin">
            <a href="#" class="nav-link" data-target="section-admin-inventory">
              <i data-lucide="box"></i> <span>Kelola Inventaris</span>
            </a>
          </li>
          <li class="nav-item-admin">
            <a href="#" class="nav-link" data-target="section-admin-reports">
              <i data-lucide="file-text"></i> <span>Laporan Bulanan</span>
            </a>
          </li>
          <li class="nav-item-admin">
            <a href="#" class="nav-link" data-target="section-admin-users">
              <i data-lucide="users"></i> <span>Kelola Pengguna</span>
            </a>
          </li>
          <li class="nav-item-admin">
            <a href="#" class="nav-link" data-target="section-change-password">
              <i data-lucide="key-round"></i> <span>Ubah Password</span>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button id="btn-logout" class="btn btn-danger btn-block">
          <i data-lucide="log-out"></i> Keluar
        </button>
      </div>
    </aside>
