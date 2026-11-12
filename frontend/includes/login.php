  <!-- ================= PAGE: LOGIN ================= -->
  <div id="page-login" class="login-wrapper <?php echo $user ? 'hidden' : ''; ?>">
    <div class="login-card">
      <div class="login-header">
        <!-- Lambang Kantor Imigrasi Tasikmalaya (Sesuai Foto) -->
        <div class="logo-container">
          <img src="images/logo-kanim.jpg" alt="Logo Imigrasi Tasikmalaya" class="immigration-logo" style="border-radius: 50%; object-fit: cover;">
        </div>
        <h1>E-ATK IMIGRASI</h1>
        <p>Kantor Imigrasi Kelas I Non TPI Kota Tasikmalaya</p>
      </div>

      <form id="form-login" class="login-form">
        <div class="form-group">
          <label for="login-username">Nama Pengguna (Username)</label>
          <div class="input-with-icon">
            <i data-lucide="user"></i>
            <input type="text" id="login-username" placeholder="Masukkan username..." required autocomplete="username">
          </div>
        </div>

        <div class="form-group">
          <label for="login-password">Kata Sandi (Password)</label>
          <div class="input-with-icon">
            <i data-lucide="lock"></i>
            <input type="password" id="login-password" placeholder="Masukkan password..." required autocomplete="current-password">
            <button type="button" id="btn-toggle-password" class="password-toggle">
              <i data-lucide="eye" id="password-toggle-icon"></i>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block">
          Masuk ke Sistem <i data-lucide="log-in"></i>
        </button>
      </form>

      <div class="login-footer">
        <p>&copy; 2026 Kanim Tasikmalaya - Sub Bagian Umum</p>
        <button id="btn-reset-db" class="btn-text">Reset Sistem ke Data Awal</button>
      </div>
    </div>
  </div>
