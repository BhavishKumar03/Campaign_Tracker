// Simple client-side auth + campaign tracker using localStorage

(function () {
    // Utils
    const qs = (s) => document.querySelector(s);
    const qsa = (s) => document.querySelectorAll(s);

    // Elements
    const tabLogin = qs('#tab-login');
    const tabRegister = qs('#tab-register');
    const tabForgot = qs('#tab-forgot');
    const panelLogin = qs('#panel-login');
    const panelRegister = qs('#panel-register');
    const panelForgot = qs('#panel-forgot');
    const linkForgot = qs('#link-forgot');
    const btnShowLogin = qs('#btn-show-login');
    const btnShowRegister = qs('#btn-show-register');

    const formLogin = qs('#form-login');
    const formRegister = qs('#form-register');
    const formForgot1 = qs('#form-forgot-step1');
    const formForgot2 = qs('#form-forgot-step2');

    const loginMsg = qs('#login-msg');
    const regMsg = qs('#reg-msg');
    const forgotMsg = qs('#forgot-msg');

    const dashboard = qs('#dashboard');
    const authArea = qs('#auth-area');
    const dashWelcome = qs('#dash-welcome');
    const btnLogout = qs('#btn-logout');

    // Campaign elements
    const formCampaign = qs('#form-campaign');
    const campList = qs('#campaign-list');
    const searchInput = qs('#campaign-search');
    const statusFilter = qs('#status-filter');
    const campStart = qs('#camp-start');
    const campEnd = qs('#camp-end');
    const endHint = qs('#end-hint');

    // Ensure date min constraints: no past dates and end >= start
    (function initDateConstraints() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      if (campStart) campStart.setAttribute('min', todayStr);
      if (campEnd) campEnd.setAttribute('min', todayStr);
      if (endHint) endHint.textContent = '';

      if (campStart && campEnd) {
        campStart.addEventListener('change', () => {
          const s = campStart.value;
          if (!s) {
            // reset end min to today
            campEnd.setAttribute('min', todayStr);
            if (endHint) endHint.textContent = '';
            return;
          }
          // set end's minimum to start date
          campEnd.setAttribute('min', s);
          // if current end is before start, bump it up
          if (campEnd.value && campEnd.value < s) {
            campEnd.value = s;
          }
          if (endHint) endHint.textContent = `Dates before ${s} are disabled.`;
        });
      }
    })();

    // Helpers for storage
    function getUsers() {
      return JSON.parse(localStorage.getItem('ct_users') || '[]');
    }

    function saveUsers(u) {
      localStorage.setItem('ct_users', JSON.stringify(u));
    }

    function findUser(email) {
      if (!email) return null;
      return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    function setCurrent(email) {
      localStorage.setItem('ct_current', email);
    }

    function getCurrent() {
      return localStorage.getItem('ct_current');
    }

    function logout() {
      localStorage.removeItem('ct_current');
      renderAuth();
    }

    function getCampaigns(email) {
      return JSON.parse(localStorage.getItem('ct_camps_' + email) || '[]');
    }

    function saveCampaigns(email, arr) {
      localStorage.setItem('ct_camps_' + email, JSON.stringify(arr));
    }

    // UI state
    function showPanel(which) {
      panelLogin.classList.add('hidden');
      panelRegister.classList.add('hidden');
      panelForgot.classList.add('hidden');
      tabLogin.classList.remove('active');
      tabRegister.classList.remove('active');
      tabForgot.classList.remove('active');
      if (which === 'login') {
        panelLogin.classList.remove('hidden');
        tabLogin.classList.add('active');
      }
      if (which === 'register') {
        panelRegister.classList.remove('hidden');
        tabRegister.classList.add('active');
      }
      if (which === 'forgot') {
        panelForgot.classList.remove('hidden');
        tabForgot.classList.add('active');
      }
    }

    // Auth flows
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      regMsg.textContent = '';
      regMsg.style.color = '';
      const name = qs('#reg-name').value.trim();
      const email = qs('#reg-email').value.trim();
      const pass = qs('#reg-password').value;
      const q = qs('#reg-sec-question').value;
      const a = qs('#reg-sec-answer').value.trim();
      if (!name || !email || !pass || !a) {
        regMsg.textContent = 'Please fill all fields';
        return;
      }
      if (findUser(email)) {
        regMsg.textContent = 'Account already exists with that email';
        return;
      }
      const users = getUsers();
      users.push({ name, email, password: pass, secQuestion: q, secAnswer: a });
      saveUsers(users);
      regMsg.style.color = 'lightgreen';
      regMsg.textContent = 'Registration successful! You can now login.';
      formRegister.reset();
      setTimeout(() => {
        showPanel('login');
      }, 800);
    });

    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      loginMsg.textContent = '';
      loginMsg.style.color = '';
      const email = qs('#login-email').value.trim();
      const pass = qs('#login-password').value;
      const user = findUser(email);
      if (!user || user.password !== pass) {
        loginMsg.textContent = 'Invalid email or password';
        return;
      }
      setCurrent(user.email);
      loginMsg.style.color = 'lightgreen';
      loginMsg.textContent = 'Logged in! Redirecting...';
      formLogin.reset();
      setTimeout(() => renderAuth(), 500);
    });

    // Forgot password step1 -> step2
    let forgotTarget = null;
    formForgot1.addEventListener('submit', (e) => {
      e.preventDefault();
      forgotMsg.textContent = '';
      forgotMsg.style.color = '';
      const email = qs('#forgot-email').value.trim();
      const u = findUser(email);
      if (!u) {
        forgotMsg.textContent = 'No account found for that email.';
        return;
      }
      forgotTarget = u.email;
      qs('#forgot-question').textContent = getQuestionText(u.secQuestion);
      formForgot1.classList.add('hidden');
      formForgot2.classList.remove('hidden');
    });

    formForgot2.addEventListener('submit', (e) => {
      e.preventDefault();
      forgotMsg.textContent = '';
      forgotMsg.style.color = '';
      const ans = qs('#forgot-answer').value.trim();
      const np = qs('#forgot-newpass').value;
      const u = findUser(forgotTarget);
      if (!u) {
        forgotMsg.textContent = 'Unexpected error';
        return;
      }
      if (ans.toLowerCase() !== (u.secAnswer || '').toLowerCase()) {
        forgotMsg.textContent = 'Incorrect answer';
        return;
      }
      u.password = np;
      const users = getUsers().map((x) => (x.email === u.email ? u : x));
      saveUsers(users);
      forgotMsg.style.color = 'lightgreen';
      forgotMsg.textContent = 'Password reset successful. You may now login.';
      formForgot2.reset();
      setTimeout(() => {
        formForgot2.classList.add('hidden');
        formForgot1.classList.remove('hidden');
        showPanel('login');
      }, 900);
    });

    function getQuestionText(key) {
      switch (key) {
        case 'pet':
          return "What is your first pet's name?";
        case 'city':
          return 'What city were you born in?';
        case 'school':
          return "What is your elementary school's name?";
        default:
          return 'Security question';
      }
    }

    // Navigation helpers
    tabLogin.addEventListener('click', () => showPanel('login'));
    tabRegister.addEventListener('click', () => showPanel('register'));
    tabForgot.addEventListener('click', () => showPanel('forgot'));
    linkForgot.addEventListener('click', () => {
      showPanel('forgot');
    });
    btnShowLogin.addEventListener('click', () => {
      showPanel('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    btnShowRegister.addEventListener('click', () => {
      showPanel('register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Dashboard and campaigns
    function renderAuth() {
      const cur = getCurrent();
      if (cur) {
        // show dashboard, hide auth area
        authArea.classList.add('hidden');
        authArea.style.display = 'none';
        dashboard.classList.remove('hidden');
        dashboard.style.display = '';
        const user = findUser(cur);
        dashWelcome.textContent = `Hello, ${user.name}`;
        renderCampaigns();
      } else {
        // Make sure dashboard is fully hidden and auth area is shown
        dashboard.classList.add('hidden');
        dashboard.style.display = 'none';
        authArea.classList.remove('hidden');
        authArea.style.display = '';
        showPanel('login');
      }
    }

    btnLogout.addEventListener('click', () => {
      logout();
    });

    formCampaign.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#camp-name').value.trim();
      const client = qs('#camp-client').value.trim();
      const start = qs('#camp-start').value;
      const end = qs('#camp-end').value;
      const status = qs('#camp-status').value;
      const cur = getCurrent();
      if (!cur) {
        alert('Not logged in');
        return;
      }
      // Validate date ordering: end must be >= start
      if (start && end && end < start) {
        alert('End date must be the same as or after the start date.');
        return;
      }
      const arr = getCampaigns(cur);
      const id = Date.now().toString(36);
      arr.push({ id, name, client, start, end, status });
      saveCampaigns(cur, arr);
      formCampaign.reset();
      // reset end hint and date mins back to today
      if (campEnd) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        campEnd.setAttribute('min', `${yyyy}-${mm}-${dd}`);
      }
      if (endHint) endHint.textContent = '';
      renderCampaigns();
    });

    // Updates campaign counts in header: total, active, paused
    function updateCounts(arr) {
      const totalCount = arr.length;
      const activeCount = arr.filter(c => c.status === 'Active').length;
      const pausedCount = arr.filter(c => c.status === 'Paused').length;
      const totalEl = qs('#total-count');
      const activeEl = qs('#active-count');
      const pausedEl = qs('#paused-count');
      if (totalEl) totalEl.textContent = totalCount;
      if (activeEl) activeEl.textContent = activeCount;
      if (pausedEl) pausedEl.textContent = pausedCount;
    }

    function filterCampaigns(campaigns, searchText, statusFilter) {
      // Clean up search text
      const search = searchText.trim().toLowerCase();

      return campaigns.filter(c => {
        // Handle status filter first
        if (statusFilter && c.status !== statusFilter) {
          return false;
        }

        // If no search text, return all that match status
        if (!search) {
          return true;
        }

        const name = c.name.toLowerCase();
        const client = c.client.toLowerCase();
        
        // Split search into words
        const searchWords = search.split(/\s+/);
        
        // For each word, check if it matches the start of any word in name or client
        return searchWords.every(searchWord => {
          // Check if the search word matches the start of any word in name or client
          const nameWords = name.split(/\s+/);
          const clientWords = client.split(/\s+/);
          
          return nameWords.some(word => word.startsWith(searchWord)) ||
                 clientWords.some(word => word.startsWith(searchWord)) ||
                 // Also check if it matches anywhere in the full name/client
                 name.includes(searchWord) ||
                 client.includes(searchWord);
        });
      });
    }

    function renderCampaigns() {
      campList.innerHTML = '';
      const cur = getCurrent();
      if (!cur) return;
  const arr = getCampaigns(cur);
  updateCounts(arr);
      if (arr.length === 0) {
        campList.innerHTML = '<div class="muted">No campaigns yet — add one!</div>';
        return;
      }

      const searchText = searchInput ? searchInput.value : '';
      const statusValue = statusFilter ? statusFilter.value : '';
      const filteredArr = filterCampaigns(arr, searchText, statusValue);
      
      if (filteredArr.length === 0) {
        campList.innerHTML = '<div class="muted">No matching campaigns found</div>';
        return;
      }

      filteredArr.slice()
        .reverse()
        .forEach((c) => {
          const el = document.createElement('div');
          el.className = 'campaign card';
          el.innerHTML = `<h4>${escapeHtml(c.name)}</h4>
          <div class="meta">
            Client: ${escapeHtml(c.client)}<br>
            ${c.start} → ${c.end} · <strong>${c.status}</strong>
          </div>
          <div class="actions">
            <button class="btn small" data-act="edit" data-id="${c.id}">Edit</button>
            <button class="btn ghost small" data-act="del" data-id="${c.id}">Delete</button>
          </div>`;
          campList.appendChild(el);
        });
      campList.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', (ev) => {
          const id = ev.currentTarget.dataset.id;
          const act = ev.currentTarget.dataset.act;
          if (act === 'del') {
            if (confirm('Delete this campaign?')) {
              deleteCampaign(id);
            }
          }
          if (act === 'edit') {
            editCampaign(id);
          }
        });
      });
    }

    function deleteCampaign(id) {
      const cur = getCurrent();
      const arr = getCampaigns(cur).filter((x) => x.id !== id);
      saveCampaigns(cur, arr);
      renderCampaigns();
    }

    function editCampaign(id) {
      const cur = getCurrent();
      const arr = getCampaigns(cur);
      const c = arr.find((x) => x.id === id);
      if (!c) return;
      const name = prompt('Campaign name', c.name);
      if (name === null) return;
      
      // Create a custom dialog for status selection
      const dialog = document.createElement('div');
      dialog.className = 'modal';
      dialog.innerHTML = `
        <div class="modal-content">
          <h3>Edit Campaign Status</h3>
          <select id="edit-status">
            <option value="Active" ${c.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Paused" ${c.status === 'Paused' ? 'selected' : ''}>Paused</option>
            <option value="Completed" ${c.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
          <div class="modal-actions">
            <button id="save-status" class="btn">Save</button>
            <button id="cancel-status" class="btn ghost">Cancel</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      return new Promise((resolve) => {
        const saveBtn = dialog.querySelector('#save-status');
        const cancelBtn = dialog.querySelector('#cancel-status');
        const statusSelect = dialog.querySelector('#edit-status');
        
        saveBtn.onclick = () => {
          const newStatus = statusSelect.value;
          c.name = name.trim() || c.name;
          c.status = newStatus;
          saveCampaigns(cur, arr);
          renderCampaigns();
          dialog.remove();
          resolve();
        };
        
        cancelBtn.onclick = () => {
          dialog.remove();
          resolve();
        };
      });
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]+/g, function (ch) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]) || ch;
      });
    }

    // Set up search/filter handlers
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderCampaigns();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        renderCampaigns();
      });
    }

    // init
    (function initOnLoad() {
      // Clear persisted current user so dashboard won't show from a previous session
      localStorage.removeItem('ct_current');
      // Ensure elements start hidden/visible consistently
      try {
        dashboard.classList.add('hidden');
        dashboard.style.display = 'none';
        authArea.classList.remove('hidden');
        authArea.style.display = '';
      } catch (e) {
        // ignore if elements not present yet
      }
      renderAuth();
    })();
  })();