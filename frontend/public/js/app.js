// Logika utama aplikasi SPA E-ATK Terintegrasi Database MySQL
document.addEventListener("DOMContentLoaded", () => {
  // Global States
  let currentUser = typeof CURRENT_USER !== 'undefined' ? CURRENT_USER : null;
  let cart = []; // Menyimpan item pengajuan [{ id, name, quantity, unit, maxStock }]
  let activeSectionId = "";
  
  // Filter states
  let catalogSearchQuery = "";
  let catalogCategoryFilter = "";
  let historySearchQuery = "";
  let historyStatusFilter = "";
  let adminReqSearchQuery = "";
  let adminReqStatusFilter = "";
  let inventorySearchQuery = "";
  let inventoryCategoryFilter = "";

  // Report filter states
  let reportStartDate = "";
  let reportEndDate = "";
  let reportDivision = "";
  let reportStatus = "";

  // DOM Elements
  const pageLogin = document.getElementById("page-login");
  const appContainer = document.getElementById("app-container");
  
  // Login Form
  const formLogin = document.getElementById("form-login");
  const loginUsernameInput = document.getElementById("login-username");
  const loginPasswordInput = document.getElementById("login-password");
  const btnTogglePassword = document.getElementById("btn-toggle-password");
  const btnResetDb = document.getElementById("btn-reset-db");

  // Navigation Profile & Header
  const userDisplayName = document.getElementById("user-display-name");
  const userDisplayRole = document.getElementById("user-display-role");
  const pageTitle = document.getElementById("page-title");
  const pageSubtitle = document.getElementById("page-subtitle");
  const currentDateEl = document.getElementById("current-date");
  const btnLogout = document.getElementById("btn-logout");

  // Modals
  const modalDetailRequest = document.getElementById("modal-detail-request");
  const modalAtkForm = document.getElementById("modal-atk-form");
  const modalRejectReason = document.getElementById("modal-reject-reason");

  // Init date
  updateSystemDate();

  // Verify auth session
  fetch("api.php?action=check_session")
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        currentUser = data.user;
      } else {
        currentUser = null;
      }
      checkSession();
    })
    .catch(err => {
      console.error("Session verification failed:", err);
      currentUser = null;
      checkSession();
    });

  // Toggle Password Visibility
  if (btnTogglePassword) {
    btnTogglePassword.addEventListener("click", () => {
      const icon = btnTogglePassword.querySelector("i");
      if (loginPasswordInput.type === "password") {
        loginPasswordInput.type = "text";
        icon.setAttribute("data-lucide", "eye-off");
      } else {
        loginPasswordInput.type = "password";
        icon.setAttribute("data-lucide", "eye");
      }
      lucide.createIcons();
    });
  }

  // Handle Login Submission
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = loginUsernameInput.value.trim();
      const password = loginPasswordInput.value;

      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      fetch("api.php?action=login", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Selamat datang, ${data.user.name}!`, "success");
          formLogin.reset();
          // Reload page to re-render using PHP session state
          window.location.reload();
        } else {
          showToast(data.message, "danger");
        }
      })
      .catch(err => {
        showToast("Terjadi kesalahan koneksi server.", "danger");
        console.error(err);
      });
    });
  }

  // Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      fetch("api.php?action=logout")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast("Anda telah keluar dari sistem.", "warning");
          window.location.reload();
        }
      });
    });
  }

  // Handle Reset Database
  if (btnResetDb) {
    btnResetDb.addEventListener("click", () => {
      if (confirm("Apakah Anda yakin ingin menyetel ulang database ke data awal? Semua riwayat pengajuan akan dihapus.")) {
        fetch("api.php?action=reset_database", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showToast("Database sistem berhasil di-reset!", "success");
            window.location.reload();
          } else {
            showToast("Gagal melakukan reset database.", "danger");
          }
        });
      }
    });
  }

  // Validate session presence
  function checkSession() {
    if (currentUser) {
      initAppLayout();
    } else {
      if (pageLogin) pageLogin.classList.remove("hidden");
      if (appContainer) appContainer.classList.add("hidden");
    }
    lucide.createIcons();
  }

  // Initialize UI navigation elements based on Role
  function initAppLayout() {
    if (pageLogin) pageLogin.classList.add("hidden");
    if (appContainer) appContainer.classList.remove("hidden");

    userDisplayName.textContent = currentUser.name;
    userDisplayRole.textContent = currentUser.division;

    const pegNavItems = document.querySelectorAll(".nav-item-pegawai");
    const admNavItems = document.querySelectorAll(".nav-item-admin");

    if (currentUser.role === "admin") {
      pegNavItems.forEach(item => item.classList.add("hidden"));
      admNavItems.forEach(item => item.classList.remove("hidden"));
      switchView("section-admin-dashboard");
    } else {
      pegNavItems.forEach(item => item.classList.remove("hidden"));
      admNavItems.forEach(item => item.classList.add("hidden"));
      switchView("section-pegawai-dashboard");
    }

    updatePendingBadge();
  }

  // Tab View Switcher
  function switchView(targetSectionId) {
    activeSectionId = targetSectionId;

    const sections = document.querySelectorAll(".content-section");
    sections.forEach(section => section.classList.add("hidden"));

    const activeSection = document.getElementById(targetSectionId);
    if (activeSection) {
      activeSection.classList.remove("hidden");
    }

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      if (link.getAttribute("data-target") === targetSectionId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    updateHeaderInfo(targetSectionId);
    renderSectionData(targetSectionId);
    lucide.createIcons();
  }

  // Set Navigation Click Listeners
  document.querySelectorAll(".nav-link, .nav-trigger-btn").forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const target = trigger.getAttribute("data-target");
      if (target) {
        switchView(target);
      }
    });
  });

  // Topbar subtitle mapping
  function updateHeaderInfo(sectionId) {
    const mapping = {
      "section-pegawai-dashboard": { title: "Dashboard Pegawai", subtitle: "Ringkasan data pengajuan ATK Anda" },
      "section-pegawai-request": { title: "Katalog & Pengajuan ATK", subtitle: "Pilih kebutuhan ATK dan kirimkan pengajuan" },
      "section-pegawai-history": { title: "Riwayat Pengajuan", subtitle: "Lacak status pengajuan ATK Anda" },
      "section-admin-dashboard": { title: "Dashboard Logistik", subtitle: "Ringkasan stok barang dan pengajuan ATK" },
      "section-admin-requests": { title: "Kelola Pengajuan ATK", subtitle: "Verifikasi pengajuan dari unit kerja pegawai" },
      "section-admin-inventory": { title: "Kelola Inventaris ATK", subtitle: "Manajemen data barang dan persediaan ATK" },
      "section-admin-reports": { title: "Laporan Pengajuan ATK", subtitle: "Cetak berkas rekapitulasi pengajuan ATK" },
      "section-admin-users": { title: "Kelola Pengguna", subtitle: "Tambah, edit, dan hapus akun pegawai & admin" },
      "section-change-password": { title: "Ubah Password", subtitle: "Perbarui password keamanan akun Anda" }
    };

    const header = mapping[sectionId] || { title: "E-ATK System", subtitle: "Kantor Imigrasi Tasikmalaya" };
    pageTitle.textContent = header.title;
    pageSubtitle.textContent = header.subtitle;
  }

  // Route Rendering Data
  function renderSectionData(sectionId) {
    switch (sectionId) {
      case "section-pegawai-dashboard":
        renderPegawaiDashboard();
        break;
      case "section-pegawai-request":
        renderPegawaiRequestCatalog();
        renderCart();
        break;
      case "section-pegawai-history":
        renderPegawaiHistory();
        break;
      case "section-admin-dashboard":
        renderAdminDashboard();
        break;
      case "section-admin-requests":
        renderAdminRequests();
        break;
      case "section-admin-inventory":
        renderAdminInventory();
        break;
      case "section-admin-reports":
        renderAdminReports();
        break;
      case "section-admin-users":
        renderAdminUsers();
        break;
      case "section-change-password":
        const formCp = document.getElementById("form-change-password");
        if (formCp) formCp.reset();
        break;
    }
  }

  // 1. PEGAWAI DASHBOARD VIEW
  function renderPegawaiDashboard() {
    document.getElementById("welcome-name").textContent = currentUser.name;

    // Fetch Stats
    fetch("api.php?action=get_stats")
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.getElementById("peg-stat-total").textContent = data.total;
        document.getElementById("peg-stat-pending").textContent = data.pending;
        document.getElementById("peg-stat-approved").textContent = data.approved;
        document.getElementById("peg-stat-rejected").textContent = data.rejected;
      }
    });

    // Fetch Recent Requests (limited to recent 5)
    fetch("api.php?action=get_requests")
    .then(r => r.json())
    .then(res => {
      const tableBody = document.querySelector("#table-peg-recent tbody");
      const emptyState = document.getElementById("peg-recent-empty");
      tableBody.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        const recentRequests = res.data.slice(0, 5);
        recentRequests.forEach(req => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><strong class="text-primary">${req.id}</strong></td>
            <td>${formatDateTime(req.date)}</td>
            <td>${formatItemsList(req.items)}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td>
              <button class="btn btn-outline btn-sm btn-view-detail" data-id="${req.id}">
                <i data-lucide="eye"></i> Detail
              </button>
            </td>
          `;
          tableBody.appendChild(tr);
        });
        bindDetailButtons();
        lucide.createIcons();
      }
    });
  }

  // 2. PEGAWAI ATK CATALOG VIEW
  function renderPegawaiRequestCatalog() {
    const catalogGrid = document.getElementById("catalog-grid");
    const emptyState = document.getElementById("catalog-empty");
    catalogGrid.innerHTML = "";

    fetch(`api.php?action=get_catalog&search=${encodeURIComponent(catalogSearchQuery)}&category=${encodeURIComponent(catalogCategoryFilter)}`)
    .then(r => r.json())
    .then(res => {
      if (!res.success || res.data.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        res.data.forEach(item => {
          const card = document.createElement("div");
          card.className = "atk-card";
          
          const maxLimit = item.min_stock * 3;
          const stockPct = maxLimit > 0 ? Math.min((item.stock / maxLimit) * 100, 100) : 100;
          let stockClass = "stock-green";
          if (item.stock <= item.min_stock) {
            stockClass = "stock-red";
          } else if (item.stock <= item.min_stock * 2) {
            stockClass = "stock-yellow";
          }

          const isOutOfStock = item.stock <= 0;

          card.innerHTML = `
            <div class="atk-card-header">
              <span class="atk-code">${item.code}</span>
              <span class="atk-category">${item.category}</span>
            </div>
            <div class="atk-card-body">
              <h4>${item.name}</h4>
              <p title="${item.description}">${item.description || "Tidak ada deskripsi."}</p>
            </div>
            <div class="atk-stock-info">
              <div class="stock-label">
                <span>Sisa Stok:</span>
                <strong class="${item.stock <= item.min_stock ? 'text-danger' : ''}">
                  ${item.stock} ${item.unit}
                </strong>
              </div>
              <div class="stock-progress-bar">
                <div class="stock-progress ${stockClass}" style="width: ${isOutOfStock ? 0 : stockPct}%"></div>
              </div>
              <button class="btn ${isOutOfStock ? 'btn-outline' : 'btn-primary'} btn-sm mt-2 btn-add-cart" 
                      data-id="${item.id}" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Stok Habis' : 'Tambah <i data-lucide="plus-circle"></i>'}
              </button>
            </div>
          `;
          catalogGrid.appendChild(card);
        });

        // Add to Cart event binding
        catalogGrid.querySelectorAll(".btn-add-cart").forEach(btn => {
          btn.addEventListener("click", () => {
            const itemId = btn.getAttribute("data-id");
            // Find item object from retrieved results
            const matchedItem = res.data.find(i => i.id == itemId);
            if (matchedItem) addToCart(matchedItem);
          });
        });
        lucide.createIcons();
      }
    });
  }

  // Search filter catalog
  const catalogSearch = document.getElementById("catalog-search");
  if (catalogSearch) {
    catalogSearch.addEventListener("input", (e) => {
      catalogSearchQuery = e.target.value;
      renderPegawaiRequestCatalog();
    });
  }

  const catalogCatFilter = document.getElementById("catalog-category-filter");
  if (catalogCatFilter) {
    catalogCatFilter.addEventListener("change", (e) => {
      catalogCategoryFilter = e.target.value;
      renderPegawaiRequestCatalog();
    });
  }

  // CART LOGIC
  function addToCart(item) {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stock) {
        showToast(`Batas maksimal pengajuan tercapai! Stok "${item.name}" hanya tersedia ${item.stock} ${item.unit}.`, "warning");
        return;
      }
      existing.quantity += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        quantity: 1,
        unit: item.unit,
        maxStock: item.stock
      });
    }

    showToast(`"${item.name}" berhasil ditambahkan ke daftar pengajuan.`, "success");
    renderCart();
  }

  function renderCart() {
    const cartItemsEl = document.getElementById("cart-items");
    const cartForm = document.getElementById("form-submit-request");
    const cartCount = document.getElementById("cart-count");
    
    cartItemsEl.innerHTML = "";
    
    if (cart.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty-state">
          <i data-lucide="shopping-bag"></i>
          <p>Daftar pengajuan masih kosong. Klik "Tambah" pada barang di katalog.</p>
        </div>
      `;
      cartForm.classList.add("hidden");
      cartCount.textContent = "0 Barang";
    } else {
      cartForm.classList.remove("hidden");
      cartCount.textContent = `${cart.length} Barang`;

      cart.forEach((c, index) => {
        const row = document.createElement("div");
        row.className = "cart-row";
        row.innerHTML = `
          <div class="cart-item-name">${c.name}</div>
          <div class="cart-item-qty-control">
            <button type="button" class="btn-qty btn-qty-minus" data-index="${index}"><i data-lucide="minus"></i></button>
            <input type="number" class="cart-qty-input" value="${c.quantity}" min="1" max="${c.maxStock}" data-index="${index}">
            <button type="button" class="btn-qty btn-qty-plus" data-index="${index}"><i data-lucide="plus"></i></button>
          </div>
          <span class="text-xs text-muted" style="width: 30px">${c.unit}</span>
          <button type="button" class="btn-cart-remove" data-index="${index}"><i data-lucide="trash-2"></i></button>
        `;
        cartItemsEl.appendChild(row);
      });

      bindCartControls();
    }
    lucide.createIcons();
  }

  function bindCartControls() {
    // Decrement quantity
    document.querySelectorAll(".btn-qty-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        if (cart[index].quantity > 1) {
          cart[index].quantity -= 1;
          renderCart();
        }
      });
    });

    // Increment quantity
    document.querySelectorAll(".btn-qty-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const item = cart[index];
        if (item.quantity < item.maxStock) {
          item.quantity += 1;
          renderCart();
        } else {
          showToast(`Stok "${item.name}" hanya tersedia ${item.maxStock} ${item.unit}.`, "warning");
        }
      });
    });

    // Direct input edit
    document.querySelectorAll(".cart-qty-input").forEach(input => {
      input.addEventListener("change", () => {
        const index = parseInt(input.getAttribute("data-index"));
        let val = parseInt(input.value) || 1;
        const max = cart[index].maxStock;
        
        if (val < 1) val = 1;
        if (val > max) {
          showToast(`Stok "${cart[index].name}" hanya tersedia ${max} ${cart[index].unit}.`, "warning");
          val = max;
        }
        
        cart[index].quantity = val;
        renderCart();
      });
    });

    // Remove single cart row
    document.querySelectorAll(".btn-cart-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"));
        const name = cart[index].name;
        cart.splice(index, 1);
        showToast(`"${name}" dihapus dari daftar pengajuan.`, "info");
        renderCart();
      });
    });
  }

  // Cart submission form
  const formSubmitRequest = document.getElementById("form-submit-request");
  if (formSubmitRequest) {
    formSubmitRequest.addEventListener("submit", (e) => {
      e.preventDefault();
      if (cart.length === 0) return;

      const purpose = document.getElementById("req-purpose").value.trim();
      const formData = new FormData();
      formData.append("items", JSON.stringify(cart));
      formData.append("purpose", purpose);

      fetch("api.php?action=add_request", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Pengajuan ATK berhasil dikirim dengan kode ${data.request.id}!`, "success");
          cart = [];
          document.getElementById("req-purpose").value = "";
          switchView("section-pegawai-history");
        } else {
          showToast(data.message, "danger");
        }
      });
    });
  }

  // 3. PEGAWAI HISTORY VIEW
  function renderPegawaiHistory() {
    fetch(`api.php?action=get_requests&search=${encodeURIComponent(historySearchQuery)}&status=${encodeURIComponent(historyStatusFilter)}`)
    .then(r => r.json())
    .then(res => {
      const tableBody = document.querySelector("#table-peg-history tbody");
      const emptyState = document.getElementById("history-empty");
      tableBody.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        res.data.forEach(req => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><strong class="text-primary">${req.id}</strong></td>
            <td>${formatDateTime(req.date)}</td>
            <td>${formatItemsList(req.items)}</td>
            <td title="${req.purpose}">${truncateText(req.purpose, 50)}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td>
              <button class="btn btn-outline btn-sm btn-view-detail" data-id="${req.id}">
                <i data-lucide="eye"></i> Detail
              </button>
            </td>
          `;
          tableBody.appendChild(tr);
        });
        bindDetailButtons();
        lucide.createIcons();
      }
    });
  }

  const historySearch = document.getElementById("history-search");
  if (historySearch) {
    historySearch.addEventListener("input", (e) => {
      historySearchQuery = e.target.value;
      renderPegawaiHistory();
    });
  }

  document.querySelectorAll(".filter-status-peg").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-status-peg").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      historyStatusFilter = btn.getAttribute("data-status");
      renderPegawaiHistory();
    });
  });

  // 4. ADMIN DASHBOARD VIEW
  function renderAdminDashboard() {
    // Stats count
    fetch("api.php?action=get_stats")
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.getElementById("adm-stat-items").textContent = data.total_items;
        document.getElementById("adm-stat-low-stock").textContent = data.low_stock;
        document.getElementById("adm-stat-pending").textContent = data.pending;
        document.getElementById("adm-stat-completed").textContent = data.completed;
      }
    });

    // Low stock alerts list
    fetch("api.php?action=get_low_stock")
    .then(r => r.json())
    .then(res => {
      const lowStockList = document.getElementById("list-low-stock");
      const lowStockEmpty = document.getElementById("low-stock-empty");
      lowStockList.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        lowStockEmpty.classList.remove("hidden");
      } else {
        lowStockEmpty.classList.add("hidden");
        res.data.forEach(item => {
          const li = document.createElement("li");
          li.className = "list-group-item";
          li.innerHTML = `
            <div>
              <span class="low-stock-name">${item.name}</span>
              <span class="low-stock-det">Kode: ${item.code} | Kategori: ${item.category}</span>
            </div>
            <span class="badge ${item.stock === 0 ? 'badge-danger' : 'badge-warning'}">
              Stok: ${item.stock} / Min: ${item.min_stock} ${item.unit}
            </span>
          `;
          lowStockList.appendChild(li);
        });
      }
    });

    // Pending requests needing verification
    fetch("api.php?action=get_requests&status=pending")
    .then(r => r.json())
    .then(res => {
      const tableBody = document.querySelector("#table-adm-recent-pending tbody");
      const recentPendingEmpty = document.getElementById("recent-pending-empty");
      tableBody.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        recentPendingEmpty.classList.remove("hidden");
      } else {
        recentPendingEmpty.classList.add("hidden");
        res.data.slice(0, 5).forEach(req => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><strong>${req.name}</strong></td>
            <td><span class="text-xs text-muted block">${req.division}</span></td>
            <td>${formatItemsList(req.items)}</td>
            <td>
              <div class="flex-align-center gap-2">
                <button class="btn btn-primary btn-sm btn-view-detail" data-id="${req.id}">
                  Proses
                </button>
              </div>
            </td>
          `;
          tableBody.appendChild(tr);
        });
        bindDetailButtons();
        lucide.createIcons();
      }
    });
  }

  // 5. ADMIN MANAGE REQUESTS VIEW
  function renderAdminRequests() {
    fetch(`api.php?action=get_requests&search=${encodeURIComponent(adminReqSearchQuery)}&status=${encodeURIComponent(adminReqStatusFilter)}`)
    .then(r => r.json())
    .then(res => {
      const tableBody = document.querySelector("#table-admin-requests tbody");
      const emptyState = document.getElementById("admin-req-empty");
      tableBody.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        res.data.forEach(req => {
          const tr = document.createElement("tr");
          
          let actionButtons = `
            <button class="btn btn-outline btn-sm btn-view-detail" data-id="${req.id}">
              <i data-lucide="eye"></i> Detail
            </button>
          `;

          if (req.status === "pending") {
            actionButtons = `
              <div class="flex-align-center gap-1">
                <button class="btn btn-primary btn-sm btn-approve" data-id="${req.id}" title="Setujui">
                  <i data-lucide="check"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-reject" data-id="${req.id}" title="Tolak">
                  <i data-lucide="x"></i>
                </button>
                <button class="btn btn-outline btn-sm btn-view-detail" data-id="${req.id}" title="Detail">
                  <i data-lucide="info"></i>
                </button>
              </div>
            `;
          } else if (req.status === "approved") {
            actionButtons = `
              <div class="flex-align-center gap-1">
                <button class="btn btn-secondary btn-sm btn-deliver" data-id="${req.id}" style="padding: 0.4rem 0.6rem;">
                  <i data-lucide="package-check"></i> Selesai
                </button>
                <button class="btn btn-outline btn-sm btn-view-detail" data-id="${req.id}" title="Detail">
                  <i data-lucide="info"></i>
                </button>
              </div>
            `;
          }

          tr.innerHTML = `
            <td><strong class="text-primary">${req.id}</strong></td>
            <td>${formatDateTime(req.date)}</td>
            <td>
              <strong>${req.name}</strong>
              <span class="text-xs text-muted block">${req.division}</span>
            </td>
            <td>${formatItemsList(req.items)}</td>
            <td title="${req.purpose}">${truncateText(req.purpose, 35)}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td>${actionButtons}</td>
          `;
          tableBody.appendChild(tr);
        });

        bindDetailButtons();
        bindAdminQuickActions();
        lucide.createIcons();
      }
    });
  }

  const adminReqSearch = document.getElementById("admin-req-search");
  if (adminReqSearch) {
    adminReqSearch.addEventListener("input", (e) => {
      adminReqSearchQuery = e.target.value;
      renderAdminRequests();
    });
  }

  document.querySelectorAll(".filter-status-adm").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-status-adm").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      adminReqStatusFilter = btn.getAttribute("data-status");
      renderAdminRequests();
    });
  });

  // Admin Quick Actions (Approve, Reject Modal, Deliver/Complete)
  function bindAdminQuickActions() {
    // Approve Quick action
    document.querySelectorAll(".btn-approve").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (confirm(`Setujui pengajuan ${id}? Stok inventaris akan berkurang.`)) {
          const formData = new FormData();
          formData.append("id", id);
          formData.append("status", "approved");
          formData.append("remarks", "Pengajuan disetujui, silakan ambil barang di seksi logistik.");

          fetch("api.php?action=update_request_status", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast(`Pengajuan ${id} berhasil disetujui!`, "success");
              updatePendingBadge();
              renderAdminRequests();
            } else {
              showToast(data.message, "danger");
            }
          });
        }
      });
    });

    // Reject Quick trigger (opens modal)
    document.querySelectorAll(".btn-reject").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        document.getElementById("reject-req-id").value = id;
        document.getElementById("reject-remarks").value = "";
        modalRejectReason.classList.remove("hidden");
      });
    });

    // Deliver (Complete) action
    document.querySelectorAll(".btn-deliver").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (confirm(`Serahkan barang untuk pengajuan ${id} dan tandai sebagai Selesai?`)) {
          const formData = new FormData();
          formData.append("id", id);
          formData.append("status", "completed");
          formData.append("remarks", "ATK telah diserahkan sepenuhnya kepada pegawai.");

          fetch("api.php?action=update_request_status", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast(`Status pengajuan ${id} selesai diserahkan!`, "success");
              renderAdminRequests();
            } else {
              showToast(data.message, "danger");
            }
          });
        }
      });
    });
  }

  // Reject Modal Form Submit
  const formRejectReason = document.getElementById("form-reject-reason");
  if (formRejectReason) {
    formRejectReason.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("reject-req-id").value;
      const remarks = document.getElementById("reject-remarks").value.trim();

      const formData = new FormData();
      formData.append("id", id);
      formData.append("status", "rejected");
      formData.append("remarks", remarks);

      fetch("api.php?action=update_request_status", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(`Pengajuan ${id} berhasil ditolak.`, "warning");
          modalRejectReason.classList.add("hidden");
          updatePendingBadge();
          
          if (activeSectionId === "section-admin-requests") {
            renderAdminRequests();
          } else {
            renderAdminDashboard();
          }
        } else {
          showToast(data.message, "danger");
        }
      });
    });
  }

  // 6. ADMIN INVENTORY VIEW
  function renderAdminInventory() {
    fetch(`api.php?action=get_inventory&search=${encodeURIComponent(inventorySearchQuery)}&category=${encodeURIComponent(inventoryCategoryFilter)}`)
    .then(r => r.json())
    .then(res => {
      const tableBody = document.querySelector("#table-admin-inventory tbody");
      const emptyState = document.getElementById("inventory-empty");
      tableBody.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        res.data.forEach(item => {
          const tr = document.createElement("tr");
          
          let stockClass = "text-success bold";
          if (item.stock <= item.min_stock) {
            stockClass = "text-danger bold";
          } else if (item.stock <= item.min_stock * 2) {
            stockClass = "text-warning bold";
          }

          tr.innerHTML = `
            <td><code class="text-xs">${item.code}</code></td>
            <td><strong>${item.name}</strong></td>
            <td><span class="badge badge-primary">${item.category}</span></td>
            <td><span class="${stockClass}">${item.stock}</span></td>
            <td><span class="text-muted">${item.min_stock}</span></td>
            <td>${item.unit}</td>
            <td class="text-xs text-muted" title="${item.description}">${truncateText(item.description, 30) || "-"}</td>
            <td><span class="badge badge-secondary">${item.condition_status || "Baik"}</span></td>
            <td>
              <div class="flex-align-center gap-1">
                <button class="btn btn-outline btn-sm btn-edit-atk" data-id="${item.id}" title="Edit">
                  <i data-lucide="edit-2"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-delete-atk" data-id="${item.id}" title="Hapus">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </td>
          `;
          tableBody.appendChild(tr);
        });

        bindInventoryActions(res.data);
        lucide.createIcons();
      }
    });
  }

  const inventorySearch = document.getElementById("inventory-search");
  if (inventorySearch) {
    inventorySearch.addEventListener("input", (e) => {
      inventorySearchQuery = e.target.value;
      renderAdminInventory();
    });
  }

  const inventoryCatFilter = document.getElementById("inventory-category-filter");
  if (inventoryCatFilter) {
    inventoryCatFilter.addEventListener("change", (e) => {
      inventoryCategoryFilter = e.target.value;
      renderAdminInventory();
    });
  }

  // Inventory CRUD Modal bindings
  const btnOpenAddAtk = document.getElementById("btn-open-add-atk");
  if (btnOpenAddAtk) {
    btnOpenAddAtk.addEventListener("click", () => {
      document.getElementById("atk-form-title").textContent = "Tambah ATK Baru";
      document.getElementById("atk-form-id").value = "";
      document.getElementById("form-atk").reset();
      // Default condition to 'Baik'
      document.getElementById("atk-condition").value = "Baik";
      modalAtkForm.classList.remove("hidden");
    });
  }

  function bindInventoryActions(itemsData) {
    // Edit item button
    document.querySelectorAll(".btn-edit-atk").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const item = itemsData.find(i => i.id == id);
        
        if (item) {
          document.getElementById("atk-form-title").textContent = "Edit Barang ATK";
          document.getElementById("atk-form-id").value = item.id;
          document.getElementById("atk-name").value = item.name;
          document.getElementById("atk-category").value = item.category;
          document.getElementById("atk-unit").value = item.unit;
          document.getElementById("atk-stock").value = item.stock;
          document.getElementById("atk-min-stock").value = item.min_stock;
          document.getElementById("atk-code").value = item.code;
          document.getElementById("atk-condition").value = item.condition_status || "Baik";
          document.getElementById("atk-description").value = item.description || "";
          
          modalAtkForm.classList.remove("hidden");
        }
      });
    });

    // Delete item button
    document.querySelectorAll(".btn-delete-atk").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Apakah Anda yakin ingin menghapus barang ATK ini? Tindakan ini tidak dapat dibatalkan.")) {
          const formData = new FormData();
          formData.append("id", id);

          fetch("api.php?action=delete_atk", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast(data.message, "success");
              renderAdminInventory();
            } else {
              showToast(data.message, "danger");
            }
          });
        }
      });
    });
  }

  // ATK Save (Insert/Update) Form Submit
  const formAtk = document.getElementById("form-atk");
  if (formAtk) {
    formAtk.addEventListener("submit", (e) => {
      e.preventDefault();

      const id = document.getElementById("atk-form-id").value;
      const name = document.getElementById("atk-name").value.trim();
      const category = document.getElementById("atk-category").value;
      const unit = document.getElementById("atk-unit").value.trim();
      const stock = document.getElementById("atk-stock").value;
      const minStock = document.getElementById("atk-min-stock").value;
      const code = document.getElementById("atk-code").value.trim();
      const condition = document.getElementById("atk-condition").value;
      const description = document.getElementById("atk-description").value.trim();

      const formData = new FormData();
      if (id) formData.append("id", id);
      formData.append("name", name);
      formData.append("category", category);
      formData.append("unit", unit);
      formData.append("stock", stock);
      formData.append("min_stock", minStock);
      formData.append("code", code);
      formData.append("condition", condition);
      formData.append("description", description);

      fetch("api.php?action=save_atk", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(data.message, "success");
          modalAtkForm.classList.add("hidden");
          renderAdminInventory();
        } else {
          showToast(data.message, "danger");
        }
      });
    });
  }

  // 7. ADMIN REPORTS VIEW
  function renderAdminReports() {
    // Construct query parameters
    let query = `api.php?action=get_requests`;
    if (reportStartDate) query += `&start_date=${reportStartDate}`;
    if (reportEndDate) query += `&end_date=${reportEndDate}`;
    if (reportDivision) query += `&division=${encodeURIComponent(reportDivision)}`;
    if (reportStatus) query += `&status=${reportStatus}`;

    fetch(query)
    .then(r => r.json())
    .then(res => {
      const tableBody = document.querySelector("#table-report-results tbody");
      const emptyState = document.getElementById("report-empty");
      tableBody.innerHTML = "";

      if (!res.success || res.data.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
        res.data.forEach((req, idx) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong class="text-primary">${req.id}</strong></td>
            <td>${formatDateTime(req.date)}</td>
            <td>
              <strong>${req.name}</strong><br>
              <span class="text-xs text-muted">${req.division}</span>
            </td>
            <td>${formatItemsListDetail(req.items)}</td>
            <td>${req.purpose}</td>
            <td>${getStatusBadge(req.status)}</td>
          `;
          tableBody.appendChild(tr);
        });
        lucide.createIcons();
      }
    });
  }

  // Bind report filter form inputs
  const formFilterReport = document.getElementById("form-filter-report");
  if (formFilterReport) {
    const startInput = document.getElementById("rep-start-date");
    const endInput = document.getElementById("rep-end-date");
    const divSelect = document.getElementById("rep-division");
    const statSelect = document.getElementById("rep-status");

    const onFilterChange = () => {
      reportStartDate = startInput.value;
      reportEndDate = endInput.value;
      reportDivision = divSelect.value;
      reportStatus = statSelect.value;
      
      // Update filter period label
      const periodLabel = document.getElementById("report-filter-period");
      if (reportStartDate && reportEndDate) {
        periodLabel.textContent = `Periode: ${reportStartDate} s/d ${reportEndDate}`;
      } else if (reportStartDate) {
        periodLabel.textContent = `Periode: Mulai ${reportStartDate}`;
      } else if (reportEndDate) {
        periodLabel.textContent = `Periode: Selesai ${reportEndDate}`;
      } else {
        periodLabel.textContent = "Periode: Semua Riwayat";
      }

      renderAdminReports();
    };

    startInput.addEventListener("change", onFilterChange);
    endInput.addEventListener("change", onFilterChange);
    divSelect.addEventListener("change", onFilterChange);
    statSelect.addEventListener("change", onFilterChange);

    // Reset button
    const btnResetReport = document.getElementById("btn-reset-report");
    if (btnResetReport) {
      btnResetReport.addEventListener("click", () => {
        formFilterReport.reset();
        reportStartDate = "";
        reportEndDate = "";
        reportDivision = "";
        reportStatus = "";
        document.getElementById("report-filter-period").textContent = "Periode: Semua Riwayat";
        renderAdminReports();
      });
    }

    // Print button: redirects to the print layout page
    const btnPrintReport = document.getElementById("btn-print-report");
    if (btnPrintReport) {
      btnPrintReport.addEventListener("click", () => {
        // Open print popup window
        let printUrl = `print_laporan.php?`;
        if (reportStartDate) printUrl += `&start_date=${reportStartDate}`;
        if (reportEndDate) printUrl += `&end_date=${reportEndDate}`;
        if (reportDivision) printUrl += `&division=${encodeURIComponent(reportDivision)}`;
        if (reportStatus) printUrl += `&status=${reportStatus}`;
        
        window.open(printUrl, '_blank');
      });
    }
  }

  // 8. DETAIL REQUEST MODAL POPULATOR
  function bindDetailButtons() {
    document.querySelectorAll(".btn-view-detail").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        viewRequestDetail(id);
      });
    });
  }

  function viewRequestDetail(requestId) {
    fetch(`api.php?action=get_request_detail&id=${requestId}`)
    .then(r => r.json())
    .then(res => {
      if (!res.success) {
        showToast(res.message, "danger");
        return;
      }
      
      const req = res.data;
      
      document.getElementById("det-req-id").textContent = req.id;
      document.getElementById("det-req-date").textContent = formatDateTime(req.date);
      document.getElementById("det-req-name").textContent = req.name;
      document.getElementById("det-req-division").textContent = req.division;
      document.getElementById("det-req-purpose").textContent = req.purpose;
      
      // Load items table
      const tbody = document.querySelector("#table-det-items tbody");
      tbody.innerHTML = "";
      req.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><code class="text-xs">${item.code}</code></td>
          <td><strong>${item.name}</strong></td>
          <td class="text-center bold">${item.quantity}</td>
          <td>${item.unit}</td>
        `;
        tbody.appendChild(tr);
      });

      // Status Badge
      const statusBadge = document.getElementById("det-req-status-badge");
      statusBadge.className = "badge";
      if (req.status === "pending") statusBadge.classList.add("badge-warning");
      else if (req.status === "approved") statusBadge.classList.add("badge-info");
      else if (req.status === "rejected") statusBadge.classList.add("badge-danger");
      else if (req.status === "completed") statusBadge.classList.add("badge-success");
      statusBadge.textContent = req.status.toUpperCase();

      document.getElementById("det-req-remarks").textContent = req.remarks ? `— "${req.remarks}"` : "";

      // Load timeline steps
      const timeline = document.getElementById("det-req-timeline");
      timeline.innerHTML = "";
      req.statusHistory.forEach(step => {
        const stepDiv = document.createElement("div");
        stepDiv.className = `timeline-item ${step.status}`;
        
        let statusText = "Diajukan";
        let statusIcon = "send";
        
        if (step.status === "approved") {
          statusText = "Disetujui";
          statusIcon = "check-circle";
        } else if (step.status === "rejected") {
          statusText = "Ditolak";
          statusIcon = "x-circle";
        } else if (step.status === "completed") {
          statusText = "Barang Diserahkan (Selesai)";
          statusIcon = "package-check";
        }

        stepDiv.innerHTML = `
          <div class="timeline-badge">
            <i data-lucide="${statusIcon}"></i>
          </div>
          <div class="timeline-panel">
            <div class="timeline-heading">
              <h4>${statusText}</h4>
              <span class="timeline-time">${formatDateTime(step.date)}</span>
            </div>
            <div class="timeline-body">
              <p>${step.remarks || "—"}</p>
              <small class="text-muted">Oleh: ${step.by}</small>
            </div>
          </div>
        `;
        timeline.appendChild(stepDiv);
      });

      // Render Modal Footer Buttons based on Role & Status
      const footer = document.getElementById("modal-detail-footer");
      footer.innerHTML = "";

      // Pegawai actions
      if (currentUser.role === "pegawai") {
        if (req.status === "pending") {
          // Pegawai can cancel own request
          footer.innerHTML = `
            <button class="btn btn-outline btn-close-modal">Tutup</button>
            <button class="btn btn-danger" id="btn-cancel-request" data-id="${req.id}">
              Batalkan Pengajuan
            </button>
          `;
        } else {
          footer.innerHTML = `<button class="btn btn-outline btn-close-modal">Tutup</button>`;
        }
      } 
      // Admin actions
      else if (currentUser.role === "admin") {
        if (req.status === "pending") {
          footer.innerHTML = `
            <button class="btn btn-outline btn-close-modal">Tutup</button>
            <button class="btn btn-danger id-reject" data-id="${req.id}">Tolak</button>
            <button class="btn btn-primary id-approve" data-id="${req.id}">Setujui Pengajuan</button>
          `;
        } else if (req.status === "approved") {
          footer.innerHTML = `
            <button class="btn btn-outline btn-close-modal">Tutup</button>
            <button class="btn btn-secondary id-deliver" data-id="${req.id}">
              <i data-lucide="package-check"></i> Serahkan ATK & Selesai
            </button>
          `;
        } else {
          footer.innerHTML = `<button class="btn btn-outline btn-close-modal">Tutup</button>`;
        }
      }

      bindModalActionButtons(req.id);
      modalDetailRequest.classList.remove("hidden");
      lucide.createIcons();
    });
  }

  function bindModalActionButtons(requestId) {
    // Close button
    modalDetailRequest.querySelectorAll(".btn-close-modal, .btn-outline").forEach(btn => {
      btn.addEventListener("click", () => {
        modalDetailRequest.classList.add("hidden");
      });
    });

    // Pegawai Cancel request
    const btnCancel = document.getElementById("btn-cancel-request");
    if (btnCancel) {
      btnCancel.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin membatalkan pengajuan ATK ini?")) {
          const formData = new FormData();
          formData.append("id", requestId);
          formData.append("status", "rejected");
          formData.append("remarks", "Dibatalkan oleh Pengaju (Pegawai).");

          fetch("api.php?action=update_request_status", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast("Pengajuan berhasil dibatalkan.", "info");
              modalDetailRequest.classList.add("hidden");
              renderPegawaiHistory();
            } else {
              showToast(data.message, "danger");
            }
          });
        }
      });
    }

    // Admin Approve (from modal)
    const btnApprove = modalDetailRequest.querySelector(".id-approve");
    if (btnApprove) {
      btnApprove.addEventListener("click", () => {
        if (confirm(`Setujui pengajuan ${requestId}? Stok barang akan dikurangi.`)) {
          const formData = new FormData();
          formData.append("id", requestId);
          formData.append("status", "approved");
          formData.append("remarks", "Pengajuan disetujui, silakan ambil barang di gudang logistik.");

          fetch("api.php?action=update_request_status", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast("Pengajuan berhasil disetujui!", "success");
              modalDetailRequest.classList.add("hidden");
              updatePendingBadge();
              
              if (activeSectionId === "section-admin-requests") renderAdminRequests();
              else renderAdminDashboard();
            } else {
              showToast(data.message, "danger");
            }
          });
        }
      });
    }

    // Admin Reject trigger (from modal)
    const btnReject = modalDetailRequest.querySelector(".id-reject");
    if (btnReject) {
      btnReject.addEventListener("click", () => {
        modalDetailRequest.classList.add("hidden");
        document.getElementById("reject-req-id").value = requestId;
        document.getElementById("reject-remarks").value = "";
        modalRejectReason.classList.remove("hidden");
      });
    }

    // Admin Deliver Complete (from modal)
    const btnDeliver = modalDetailRequest.querySelector(".id-deliver");
    if (btnDeliver) {
      btnDeliver.addEventListener("click", () => {
        if (confirm("Serahkan ATK ini dan tandai sebagai Selesai?")) {
          const formData = new FormData();
          formData.append("id", requestId);
          formData.append("status", "completed");
          formData.append("remarks", "ATK telah diserahkan sepenuhnya kepada pegawai.");

          fetch("api.php?action=update_request_status", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast("Status pengajuan selesai diserahkan!", "success");
              modalDetailRequest.classList.add("hidden");
              
              if (activeSectionId === "section-admin-requests") renderAdminRequests();
              else renderAdminDashboard();
            } else {
              showToast(data.message, "danger");
            }
          });
        }
      });
    }
  }

  // --- GENERAL EVENT HANDLERS ---

  // Close modals trigger
  document.querySelectorAll(".btn-close-modal, .modal-wrapper").forEach(el => {
    el.addEventListener("click", (e) => {
      // Close only if click is on outer wrapper or close button
      if (e.target.classList.contains("modal-wrapper") || e.target.closest(".btn-close-modal")) {
        const wrapper = e.target.closest(".modal-wrapper");
        if (wrapper) wrapper.classList.add("hidden");
      }
    });
  });

  // --- HELPER UTILITIES ---

  function updateSystemDate() {
    if (currentDateEl) {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      
      const now = new Date();
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      
      currentDateEl.textContent = `${dayName}, ${day} ${monthName} ${year}`;
    }
  }

  function updatePendingBadge() {
    if (!currentUser || currentUser.role !== "admin") return;
    
    fetch("api.php?action=get_stats")
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const badge = document.getElementById("badge-pending-count");
        if (data.pending > 0) {
          badge.textContent = data.pending;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }
    });
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    else if (type === "warning") iconName = "alert-triangle";
    else if (type === "danger") iconName = "x-circle";

    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${iconName}"></i>
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();

    // Auto remove toast after 4 seconds
    setTimeout(() => {
      toast.style.animation = "slideInRight 0.3s ease-in reverse forwards";
      toast.addEventListener("animationend", () => {
        toast.remove();
      });
    }, 4000);
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }

  function formatItemsList(items) {
    if (!items || items.length === 0) return "-";
    if (items.length === 1) {
      return `${items[0].name} (${items[0].quantity} ${items[0].unit})`;
    }
    return `${items[0].name} (${items[0].quantity} ${items[0].unit}) dan ${items.length - 1} lainnya`;
  }

  function formatItemsListDetail(items) {
    if (!items || items.length === 0) return "-";
    return items.map(it => `• ${it.name} (${it.quantity} ${it.unit})`).join("<br>");
  }

  function truncateText(str, max) {
    if (!str) return "";
    return str.length > max ? str.substring(0, max) + "..." : str;
  }

  function getStatusBadge(status) {
    const badges = {
      "pending": '<span class="badge badge-warning">Pending</span>',
      "approved": '<span class="badge badge-info">Disetujui</span>',
      "rejected": '<span class="badge badge-danger">Ditolak</span>',
      "completed": '<span class="badge badge-success">Selesai</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
  }
  // =============================================
  // USER MANAGEMENT (Admin Only)
  // =============================================
  function renderAdminUsers() {
    fetch("api.php?action=get_users")
      .then(r => r.json())
      .then(data => {
        const tbody = document.querySelector("#table-users tbody");
        const emptyEl = document.getElementById("users-empty");
        if (!tbody) return;

        if (!data.success || data.data.length === 0) {
          tbody.innerHTML = "";
          emptyEl.classList.remove("hidden");
          return;
        }

        emptyEl.classList.add("hidden");
        tbody.innerHTML = data.data.map((u, idx) => {
          const roleBadge = u.role === "admin"
            ? `<span class="badge badge-info">Admin</span>`
            : `<span class="badge badge-warning">Pegawai</span>`;
          const isSelf = currentUser && u.id == currentUser.id;
          return `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>${u.name}</td>
              <td><code>${u.username}</code></td>
              <td>${roleBadge}</td>
              <td>${u.division}</td>
              <td>
                <button class="btn btn-sm btn-outline btn-edit-user" data-id="${u.id}"
                  data-name="${u.name}" data-username="${u.username}"
                  data-role="${u.role}" data-division="${u.division}">
                  <i data-lucide="pencil"></i> Edit
                </button>
                ${isSelf ? '' : `<button class="btn btn-sm btn-danger ml-1 btn-delete-user" data-id="${u.id}" data-name="${u.name}">
                  <i data-lucide="trash-2"></i>
                </button>`}
              </td>
            </tr>
          `;
        }).join("");

        lucide.createIcons();
        bindUserTableButtons();
      })
      .catch(() => showToast("Gagal memuat data pengguna.", "danger"));
  }

  function bindUserTableButtons() {
    document.querySelectorAll(".btn-edit-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const { id, name, username, role, division } = btn.dataset;
        openUserModal({ id, name, username, role, division });
      });
    });

    document.querySelectorAll(".btn-delete-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const { id, name } = btn.dataset;
        if (confirm(`Hapus pengguna "${name}"? Semua riwayat pengajuannya juga akan dihapus.`)) {
          const fd = new FormData();
          fd.append("id", id);
          fetch("api.php?action=delete_user", { method: "POST", body: fd })
            .then(r => r.json())
            .then(data => {
              if (data.success) {
                showToast(data.message, "success");
                renderAdminUsers();
              } else {
                showToast(data.message, "danger");
              }
            });
        }
      });
    });
  }

  function openUserModal(user = null) {
    const modal = document.getElementById("modal-user-form");
    const title = document.getElementById("user-form-title");
    const idInput = document.getElementById("user-form-id");
    const nameInput = document.getElementById("user-name");
    const usernameInput = document.getElementById("user-username");
    const roleSelect = document.getElementById("user-role");
    const divisionSelect = document.getElementById("user-division");
    const passInput = document.getElementById("user-password");
    const passHint = document.getElementById("user-pass-hint");
    const passRequired = document.getElementById("user-pass-required");
    const form = document.getElementById("form-user");

    form.reset();

    if (user && user.id) {
      title.textContent = "Edit Data Pengguna";
      idInput.value = user.id;
      nameInput.value = user.name;
      usernameInput.value = user.username;
      roleSelect.value = user.role;
      divisionSelect.value = user.division;
      passHint.classList.remove("hidden");
      passRequired.textContent = "";
      passInput.removeAttribute("required");
    } else {
      title.textContent = "Tambah Pengguna Baru";
      idInput.value = "";
      passHint.classList.add("hidden");
      passRequired.textContent = "*";
      passInput.setAttribute("required", true);
    }

    modal.classList.remove("hidden");
    lucide.createIcons();
  }

  // Bind Tambah Pengguna button
  const btnAddUser = document.getElementById("btn-add-user");
  if (btnAddUser) {
    btnAddUser.addEventListener("click", () => openUserModal());
  }

  // Bind toggle password visibility for user modal
  const btnToggleUserPass = document.getElementById("btn-toggle-user-pass");
  if (btnToggleUserPass) {
    btnToggleUserPass.addEventListener("click", () => {
      const passInput = document.getElementById("user-password");
      const icon = document.getElementById("user-pass-toggle-icon");
      if (passInput.type === "password") {
        passInput.type = "text";
        icon.setAttribute("data-lucide", "eye-off");
      } else {
        passInput.type = "password";
        icon.setAttribute("data-lucide", "eye");
      }
      lucide.createIcons();
    });
  }

  // Submit save user form
  const formUser = document.getElementById("form-user");
  if (formUser) {
    formUser.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-save-user");
      btn.disabled = true;
      btn.textContent = "Menyimpan...";

      const fd = new FormData();
      fd.append("id", document.getElementById("user-form-id").value);
      fd.append("name", document.getElementById("user-name").value.trim());
      fd.append("username", document.getElementById("user-username").value.trim());
      fd.append("role", document.getElementById("user-role").value);
      fd.append("division", document.getElementById("user-division").value);
      fd.append("password", document.getElementById("user-password").value);

      fetch("api.php?action=save_user", { method: "POST", body: fd })
        .then(r => r.json())
        .then(data => {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="save"></i> Simpan';
          lucide.createIcons();
          if (data.success) {
            showToast(data.message, "success");
            document.getElementById("modal-user-form").classList.add("hidden");
            renderAdminUsers();
          } else {
            showToast(data.message, "danger");
          }
        })
        .catch(() => {
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="save"></i> Simpan';
          lucide.createIcons();
          showToast("Terjadi kesalahan koneksi.", "danger");
        });
    });
  }

  // Submit change password form
  const formChangePassword = document.getElementById("form-change-password");
  if (formChangePassword) {
    formChangePassword.addEventListener("submit", (e) => {
      e.preventDefault();
      const oldPass = document.getElementById("chg-old-password").value;
      const newPass = document.getElementById("chg-new-password").value;
      const confirmPass = document.getElementById("chg-confirm-password").value;

      if (newPass !== confirmPass) {
        showToast("Konfirmasi password baru tidak cocok.", "danger");
        return;
      }
      if (newPass.length < 6) {
        showToast("Password baru minimal 6 karakter.", "danger");
        return;
      }

      const btn = formChangePassword.querySelector('button[type="submit"]');
      const origText = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "Memproses...";

      const fd = new FormData();
      fd.append("old_password", oldPass);
      fd.append("new_password", newPass);
      fd.append("confirm_password", confirmPass);

      fetch("api.php?action=change_password", { method: "POST", body: fd })
        .then(r => r.json())
        .then(data => {
          btn.disabled = false;
          btn.innerHTML = origText;
          lucide.createIcons();
          if (data.success) {
            showToast(data.message, "success");
            formChangePassword.reset();
          } else {
            showToast(data.message, "danger");
          }
        })
        .catch(() => {
          btn.disabled = false;
          btn.innerHTML = origText;
          lucide.createIcons();
          showToast("Terjadi kesalahan koneksi server.", "danger");
        });
    });
  }

});
