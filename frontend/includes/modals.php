  <!-- ================= MODAL: DETAIL PENGAJUAN (Pegawai & Admin) ================= -->
  <div id="modal-detail-request" class="modal-wrapper hidden">
    <div class="modal-content modal-md">
      <div class="modal-header">
        <h3>Detail Pengajuan ATK</h3>
        <button class="btn-close-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div>
            <span class="text-muted block text-xs">ID Pengajuan</span>
            <strong id="det-req-id" class="text-lg text-primary">REQ-2026-0001</strong>
          </div>
          <div class="text-right-md">
            <span class="text-muted block text-xs">Tanggal Pengajuan</span>
            <span id="det-req-date">18 Juni 2026 15:15</span>
          </div>
        </div>

        <hr class="modal-divider">

        <div class="detail-grid">
          <div>
            <span class="text-muted block text-xs">Nama Pengaju</span>
            <span id="det-req-name">Dewi Lestari</span>
          </div>
          <div>
            <span class="text-muted block text-xs">Seksi / Unit Kerja</span>
            <span id="det-req-division">Seksi Lalu Lintas Keimigrasian</span>
          </div>
        </div>

        <div class="mt-3">
          <span class="text-muted block text-xs">Tujuan / Keperluan</span>
          <p id="det-req-purpose" class="text-box-detail">Untuk pencetakan paspor...</p>
        </div>

        <div class="mt-3">
          <span class="text-muted block text-xs">Daftar Barang ATK</span>
          <div class="table-responsive mt-1">
            <table class="table table-bordered table-sm" id="table-det-items">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Barang</th>
                  <th class="text-center">Jumlah</th>
                  <th>Satuan</th>
                </tr>
              </thead>
              <tbody>
                <!-- Dynamic items -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-3">
          <span class="text-muted block text-xs">Status Saat Ini</span>
          <div class="flex-align-center gap-2 mt-1">
            <span id="det-req-status-badge" class="badge">PENDING</span>
            <span id="det-req-remarks" class="text-sm italic text-muted"></span>
          </div>
        </div>

        <div class="mt-4">
          <span class="text-muted block text-xs mb-2">Riwayat Proses Status</span>
          <div class="timeline" id="det-req-timeline">
            <!-- Dynamic timeline steps -->
          </div>
        </div>
      </div>
      <div class="modal-footer flex-justify-end gap-2" id="modal-detail-footer">
        <!-- Dynamic buttons like "Cancel", "Approve", "Reject", "Deliver" -->
      </div>
    </div>
  </div>

  <!-- ================= MODAL: TAMBAH / EDIT ATK (Admin) ================= -->
  <div id="modal-atk-form" class="modal-wrapper hidden">
    <div class="modal-content modal-md">
      <div class="modal-header">
        <h3 id="atk-form-title">Tambah ATK Baru</h3>
        <button class="btn-close-modal"><i data-lucide="x"></i></button>
      </div>
      <form id="form-atk">
        <input type="hidden" id="atk-form-id">
        <div class="modal-body">
          <div class="form-group">
            <label for="atk-name">Nama Barang ATK <span class="required">*</span></label>
            <input type="text" id="atk-name" placeholder="Contoh: Kertas HVS A4 80gr" required>
          </div>

          <div class="grid-2 gap-3">
            <div class="form-group">
              <label for="atk-category">Kategori <span class="required">*</span></label>
              <select id="atk-category" required>
                <option value="">Pilih Kategori</option>
                <option value="Kertas & Dokumen">Kertas & Dokumen</option>
                <option value="Alat Tulis & Kantor">Alat Tulis & Kantor</option>
                <option value="Penyimpanan">Penyimpanan</option>
                <option value="Kebersihan & Sanitasi">Kebersihan & Sanitasi</option>
                <option value="Peralatan & IT">Peralatan & IT</option>
              </select>
            </div>
            <div class="form-group">
              <label for="atk-unit">Satuan Barang <span class="required">*</span></label>
              <input type="text" id="atk-unit" placeholder="Contoh: Rim, Pcs, Box, Pak, Roll" required>
            </div>
          </div>

          <div class="grid-2 gap-3">
            <div class="form-group">
              <label for="atk-stock">Stok Awal <span class="required">*</span></label>
              <input type="number" id="atk-stock" min="0" placeholder="0" required>
            </div>
            <div class="form-group">
              <label for="atk-min-stock">Minimal Stok (Peringatan) <span class="required">*</span></label>
              <input type="number" id="atk-min-stock" min="0" placeholder="5" required>
            </div>
          </div>

          <div class="grid-2 gap-3">
            <div class="form-group">
              <label for="atk-code">Kode Barang (Barcode/Custom) <span class="required">*</span></label>
              <input type="text" id="atk-code" placeholder="Contoh: 1010302001000006" required>
            </div>
            <div class="form-group">
              <label for="atk-condition">Kondisi Barang <span class="required">*</span></label>
              <select id="atk-condition" required>
                <option value="Baik" selected>Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="atk-description">Deskripsi Tambahan</label>
            <textarea id="atk-description" placeholder="Spesifikasi, warna, atau merk barang..." rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer flex-justify-end gap-2">
          <button type="button" class="btn btn-outline btn-close-modal">Batal</button>
          <button type="submit" class="btn btn-secondary" id="btn-save-atk">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ================= MODAL: ALASAN REJECT (Admin) ================= -->
  <div id="modal-reject-reason" class="modal-wrapper hidden">
    <div class="modal-content modal-sm">
      <div class="modal-header">
        <h3>Alasan Penolakan</h3>
        <button class="btn-close-modal"><i data-lucide="x"></i></button>
      </div>
      <form id="form-reject-reason">
        <input type="hidden" id="reject-req-id">
        <div class="modal-body">
          <div class="form-group">
            <label for="reject-remarks">Alasan Penolakan / Catatan <span class="required">*</span></label>
            <textarea id="reject-remarks" placeholder="Masukkan alasan penolakan secara jelas..." required rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer flex-justify-end gap-2">
          <button type="button" class="btn btn-outline btn-close-modal">Batal</button>
          <button type="submit" class="btn btn-danger">Tolak Pengajuan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ================= MODAL: TAMBAH / EDIT PENGGUNA (Admin) ================= -->
  <div id="modal-user-form" class="modal-wrapper hidden">
    <div class="modal-content modal-md">
      <div class="modal-header">
        <h3 id="user-form-title">Tambah Pengguna Baru</h3>
        <button class="btn-close-modal"><i data-lucide="x"></i></button>
      </div>
      <form id="form-user">
        <input type="hidden" id="user-form-id">
        <div class="modal-body">
          <div class="form-group">
            <label for="user-name">Nama Lengkap <span class="required">*</span></label>
            <input type="text" id="user-name" placeholder="Contoh: Budi Santoso" required>
          </div>

          <div class="grid-2 gap-3">
            <div class="form-group">
              <label for="user-username">Username <span class="required">*</span></label>
              <input type="text" id="user-username" placeholder="Contoh: bsantoso" required autocomplete="off">
            </div>
            <div class="form-group">
              <label for="user-role">Role <span class="required">*</span></label>
              <select id="user-role" required>
                <option value="pegawai">Pegawai</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="user-division">Seksi / Unit Kerja <span class="required">*</span></label>
            <select id="user-division" required>
              <option value="Sub Bagian Umum">Sub Bagian Umum</option>
              <option value="Seksi Lalu Lintas Keimigrasian">Seksi Lalu Lintas Keimigrasian</option>
              <option value="Seksi Izin Tinggal & Status Keimigrasian">Seksi Izin Tinggal & Status Keimigrasian</option>
              <option value="Seksi Informasi & Komunikasi Keimigrasian">Seksi Informasi & Komunikasi Keimigrasian</option>
              <option value="Seksi Intelijen & Penindakan Keimigrasian">Seksi Intelijen & Penindakan Keimigrasian</option>
            </select>
          </div>

          <div class="form-group">
            <label for="user-password">Password <span class="required" id="user-pass-required">*</span>
              <span id="user-pass-hint" class="text-muted" style="font-weight:400; font-size:0.8rem;"> (kosongkan jika tidak ingin mengubah)</span>
            </label>
            <div class="input-with-icon">
              <i data-lucide="lock"></i>
              <input type="password" id="user-password" placeholder="Minimal 6 karakter" autocomplete="new-password">
              <button type="button" id="btn-toggle-user-pass" class="password-toggle">
                <i data-lucide="eye" id="user-pass-toggle-icon"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer flex-justify-end gap-2">
          <button type="button" class="btn btn-outline btn-close-modal">Batal</button>
          <button type="submit" class="btn btn-secondary" id="btn-save-user">
            <i data-lucide="save"></i> Simpan
          </button>
        </div>
      </form>
    </div>
  </div>
