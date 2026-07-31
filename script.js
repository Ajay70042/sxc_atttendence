    let currentTab = 'overall', selectedSem = '';

    function showToast(msg, d = 2500) {
      const t = document.getElementById('toast');
      t.textContent = msg; t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), d);
    }

    function toggleDark() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const next = isLight ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      document.getElementById('darkToggle').checked = !isLight;
      document.getElementById('darkBtn').textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('sxc_theme', next);
    }

    function setTheme(p, d, l, el) {
      document.documentElement.style.setProperty('--p1', p);
      document.documentElement.style.setProperty('--p2', d);
      document.documentElement.style.setProperty('--p3', l);
      document.querySelectorAll('.theme-dot').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      localStorage.setItem('sxc_color', JSON.stringify({ p, d, l }));
      showToast('Theme updated!');
    }

    function openSettings() { document.getElementById('settingsPanel').classList.add('open'); }
    function closeSettings() { document.getElementById('settingsPanel').classList.remove('open'); }
    function saveRememberPref() { localStorage.setItem('sxc_remember', document.getElementById('rememberToggle').checked); }
    function saveNotifPref() { localStorage.setItem('sxc_notif', document.getElementById('notifToggle').checked); }

    function saveBackend() {
      const url = document.getElementById('backendInput').value.trim().replace(/\/+$/, '');
      if (url) { localStorage.setItem('sxc_backend', url); showToast('Backend URL saved! Daily attendance should now work.', 3000); }
      else { localStorage.removeItem('sxc_backend'); showToast('Backend URL cleared'); }
      closeSettings();
    }

    function clearSaved() {
      localStorage.removeItem('sxc_roll'); localStorage.removeItem('sxc_sem');
      document.getElementById('rollno').value = '';
      document.querySelectorAll('.sem-pill').forEach(p => p.classList.remove('active'));
      selectedSem = ''; document.getElementById('savedTag').style.display = 'none';
      showToast('Saved data cleared'); closeSettings();
    }

    function saveCredentials() {
      if (localStorage.getItem('sxc_remember') === 'false') return;
      const roll = document.getElementById('rollno').value.trim();
      if (roll) localStorage.setItem('sxc_roll', roll);
      if (selectedSem) localStorage.setItem('sxc_sem', selectedSem);
    }

    // Friends
    function openFriends() { renderFriendsList(); document.getElementById('friendsPanel').classList.add('open'); }
    function closeFriends() { document.getElementById('friendsPanel').classList.remove('open'); }
    function getFriends() { try { return JSON.parse(localStorage.getItem('sxc_friends') || '[]'); } catch (e) { return []; } }
    function saveFriends(f) { localStorage.setItem('sxc_friends', JSON.stringify(f)); }

    function addFriend() {
      const name = document.getElementById('friendName').value.trim();
      const roll = document.getElementById('friendRoll').value.trim().toUpperCase();
      const sem = document.getElementById('friendSem').value;
      if (!name) { showToast('Please enter a name'); return; }
      if (!roll) { showToast('Please enter roll number'); return; }
      if (!sem) { showToast('Please select semester'); return; }
      const friends = getFriends();
      if (friends.find(f => f.roll === roll)) { showToast('Roll number already exists!'); return; }
      friends.push({ name, roll, sem, id: Date.now() });
      saveFriends(friends);
      document.getElementById('friendName').value = '';
      document.getElementById('friendRoll').value = '';
      document.getElementById('friendSem').value = '';
      renderFriendsList(); showToast(name + ' added! 🎉');
    }

    function deleteFriend(id) {
      saveFriends(getFriends().filter(f => f.id !== id));
      renderFriendsList(); showToast('Friend removed');
    }

    function loadFriend(roll, sem) {
      document.getElementById('rollno').value = roll;
      selectedSem = sem;
      document.querySelectorAll('.sem-pill').forEach(p => p.classList.toggle('active', p.textContent.trim() === sem));
      closeFriends(); showToast('Loaded! Press Check Attendance 👇');
    }

    function editFriend(id) {
      // Toggle edit form for this friend card
      const existing = document.getElementById('edit-form-' + id);
      if (existing) { existing.remove(); return; }
      const f = getFriends().find(x => x.id === id);
      if (!f) return;
      const semOptions = ['I','II','III','IV','V','VI','VII','VIII'].map(s =>
        `<option value="${s}" ${f.sem === s ? 'selected' : ''}>${s}</option>`
      ).join('');
      const form = document.createElement('div');
      form.id = 'edit-form-' + id;
      form.style.cssText = 'padding:12px 14px;border-top:1px solid var(--glass-border);display:flex;flex-direction:column;gap:8px;';
      form.innerHTML = `
        <input id="ef-name-${id}" class="form-input" type="text" value="${f.name}" placeholder="Name" style="padding:10px 12px;font-size:13px;">
        <input id="ef-roll-${id}" class="form-input" type="text" value="${f.roll}" placeholder="Roll No." style="padding:10px 12px;font-size:13px;" autocapitalize="characters">
        <select id="ef-sem-${id}" class="form-input" style="padding:10px 12px;font-size:13px;">
          <option value="">Semester</option>${semOptions}
        </select>
        <div style="display:flex;gap:8px;">
          <button onclick="saveEditFriend(${id})" style="flex:1;background:linear-gradient(135deg,var(--p1),var(--p3));color:#fff;border:none;border-radius:8px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:Syne,sans-serif;">Save</button>
          <button onclick="document.getElementById('edit-form-${id}').remove()" style="flex:1;background:var(--glass);color:var(--text-muted);border:1px solid var(--glass-border);border-radius:8px;padding:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:Syne,sans-serif;">Cancel</button>
        </div>`;
      document.getElementById('friend-card-' + id).appendChild(form);
    }

    function saveEditFriend(id) {
      const name = document.getElementById('ef-name-' + id).value.trim();
      const roll = document.getElementById('ef-roll-' + id).value.trim().toUpperCase();
      const sem  = document.getElementById('ef-sem-' + id).value;
      if (!name) { showToast('Name cannot be empty'); return; }
      if (!roll)  { showToast('Roll number cannot be empty'); return; }
      if (!sem)   { showToast('Please select a semester'); return; }
      const friends = getFriends();
      // Check duplicate roll only if it changed to someone else's roll
      const dup = friends.find(f => f.roll === roll && f.id !== id);
      if (dup) { showToast('That roll number already exists!'); return; }
      const idx = friends.findIndex(f => f.id === id);
      if (idx !== -1) { friends[idx] = { ...friends[idx], name, roll, sem }; }
      saveFriends(friends);
      renderFriendsList();
      showToast('Updated! ✅');
    }

    function renderFriendsList() {
      const friends = getFriends();
      const c = document.getElementById('friendsList');
      if (friends.length === 0) {
        c.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:14px">No friends added yet 👋</div>';
        return;
      }
      c.innerHTML = friends.map(f => `
    <div class="friend-card" id="friend-card-${f.id}" style="flex-direction:column;align-items:stretch;padding:0;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;">
        <div class="friend-avatar">${f.name.charAt(0).toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div class="friend-name">${f.name}</div>
          <div class="friend-roll">${f.roll} · Sem ${f.sem}</div>
        </div>
        <div class="friend-actions">
          <button class="friend-view-btn" onclick="loadFriend('${f.roll}','${f.sem}')">View</button>
          <button onclick="editFriend(${f.id})" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:7px 10px;font-size:14px;cursor:pointer;">✏️</button>
          <button class="friend-del-btn" onclick="deleteFriend(${f.id})">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
    }


    function loadPreferences() {
      const theme = localStorage.getItem('sxc_theme') || 'dark';
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('darkToggle').checked = true;
        document.getElementById('darkBtn').textContent = '☀️';
      }
      const color = localStorage.getItem('sxc_color');
      if (color) {
        try {
          const { p, d, l } = JSON.parse(color);
          document.documentElement.style.setProperty('--p1', p);
          document.documentElement.style.setProperty('--p2', d);
          document.documentElement.style.setProperty('--p3', l);
        } catch (e) { }
      }
      if (localStorage.getItem('sxc_remember') === 'false') document.getElementById('rememberToggle').checked = false;
      if (localStorage.getItem('sxc_notif') === 'false') document.getElementById('notifToggle').checked = false;
      const backendUrl = localStorage.getItem('sxc_backend');
      if (backendUrl) document.getElementById('backendInput').value = backendUrl;
      const roll = localStorage.getItem('sxc_roll');
      const sem = localStorage.getItem('sxc_sem');
      if (roll) { document.getElementById('rollno').value = roll; document.getElementById('savedTag').style.display = 'flex'; }
      if (sem) {
        selectedSem = sem;
        document.querySelectorAll('.sem-pill').forEach(p => { if (p.textContent.trim() === sem) p.classList.add('active'); });
      }
    }

    function switchTab(tab, el) {
      currentTab = tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      const dg = document.getElementById('dateGroup');
      if (tab === 'daily') {
        dg.classList.add('visible');
        if (!document.getElementById('dateInput').value) document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
      } else { dg.classList.remove('visible'); }
      const labels = { overall: 'Check Overall Attendance', monthly: 'Check Monthly Attendance', daily: 'Check Daily Attendance' };
      document.getElementById('fetchLabel').textContent = labels[tab];
      clearResults();
    }

    function selectSem(el, val) {
      document.querySelectorAll('.sem-pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active'); selectedSem = val;
    }

    function clearResults() {
      ['studentCard', 'resultsSection', 'warningBanner', 'errorCard'].forEach(id => document.getElementById(id).classList.remove('visible'));
      document.getElementById('statsRow').style.display = 'none';
      document.getElementById('resultsBody').innerHTML = '';
      document.getElementById('statLabel0').textContent = '≥75%';
      document.getElementById('statLabel1').textContent = '60–74%';
      document.getElementById('statLabel2').textContent = '<60%';
    }

    function clearAll() { clearResults(); document.getElementById('rollno').value = ''; document.querySelectorAll('.sem-pill').forEach(p => p.classList.remove('active')); selectedSem = ''; }
    function showError(msg) { document.getElementById('errorText').textContent = msg; document.getElementById('errorCard').classList.add('visible'); }
    function pctClass(v) { const p = parseFloat(v); return p >= 75 ? 'green' : p >= 60 ? 'yellow' : 'red'; }

    function calcAttendance(present, total) {
      const p = parseInt(present), t = parseInt(total);
      if (isNaN(p) || isNaN(t) || t === 0) return null;
      const pct = (p / t) * 100;
      if (pct >= 75) { const canSkip = Math.floor(p / 0.75 - t); return { type: 'safe', canSkip: Math.max(0, canSkip) }; }
      else { const mustAttend = Math.ceil((0.75 * t - p) / 0.25); return { type: 'danger', mustAttend: Math.max(0, mustAttend) }; }
    }

    function makePctRing(pct, cls) {
      const R = 24, C = 2 * Math.PI * R, offset = C - (pct / 100) * C;
      return `<div class="pct-ring">
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle class="pct-ring-track" cx="28" cy="28" r="${R}"/>
      <circle class="pct-ring-fill ${cls}" cx="28" cy="28" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${offset}"/>
    </svg>
    <div class="pct-ring-text">${Math.round(pct)}%</div>
  </div>`;
    }

    function buildSubjectCards(rows, pctKey, labelKey, subKey) {
      let good = 0, warn = 0, bad = 0, html = '', lowSubjects = [];
      const showNotif = localStorage.getItem('sxc_notif') !== 'false';

      // Detect if ALL rows are aggregate/summary rows (no subjectTitle)
      const isAggregateOnly = rows.every(row => !row['subjectTitle'] && !row[labelKey]);

      if (isAggregateOnly) {
        // The SXC portal returned a combined total — not per-subject breakdown
        const row = rows[0];
        const pctRaw = row['percentage'] || row[pctKey] || '';
        const pct = parseFloat(pctRaw);
        const totalClasses = row['totalClasses'] || '—';
        const totalPresent = row['totalPresent'] || '—';
        const cls = isNaN(pct) ? 'green' : pctClass(pct);
        const ring = !isNaN(pct) ? makePctRing(pct, cls) : `<div class="pct-ring"><div class="pct-ring-text">—</div></div>`;
        const calc = (row['totalPresent'] && row['totalClasses']) ? calcAttendance(row['totalPresent'], row['totalClasses']) : null;
        let calcHtml = '';
        if (calc) {
          if (calc.type === 'safe') calcHtml = calc.canSkip > 0 ? '<span class="calc-chip can-skip">✓ Can skip ' + calc.canSkip + ' more class' + (calc.canSkip > 1 ? 'es' : '') + '</span>' : '<span class="calc-chip at-limit">⚠ At limit — attend all</span>';
          else calcHtml = '<span class="calc-chip must-attend">⚡ Need ' + calc.mustAttend + ' more class' + (calc.mustAttend > 1 ? 'es' : '') + ' for 75%</span>';
        }

        html += '<div class="subject-card">'
          + '<div class="subject-main">'
          + '<div class="subject-info"><div class="subject-name">📊 All Subjects Combined</div>'
          + '<div class="subject-sub">' + totalPresent + ' present / ' + totalClasses + ' total classes</div></div>'
          + ring + '</div>'
          + (calcHtml ? '<div class="calc-strip">' + calcHtml + '</div>' : '')
          + '</div>';

        // Info notice explaining the API limitation
        html += '<div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);border-radius:12px;padding:12px 14px;margin-top:4px;display:flex;gap:10px;align-items:flex-start;">'
          + '<div style="font-size:18px;flex-shrink:0">ℹ️</div>'
          + '<div style="font-size:12px;color:rgba(14,165,233,0.9);line-height:1.6;">'
          + '<strong style="display:block;margin-bottom:3px;">Combined total only</strong>'
          + 'The SXC portal\'s Overall tab returns a single combined total across all your subjects — per-subject breakdown is not available from this API. '
          + 'Try the <strong>Monthly</strong> tab to see individual subject-wise attendance.'
          + '</div></div>';

        document.getElementById('resultsBody').innerHTML = html;
        // Show totals in stat cards
        if (!isNaN(pct)) {
          document.getElementById('statGood').textContent = totalPresent;
          document.getElementById('statWarn').textContent = totalClasses;
          document.getElementById('statBad').textContent = Math.round(pct) + '%';
          document.getElementById('statLabel0').textContent = 'Present';
          document.getElementById('statLabel1').textContent = 'Total';
          document.getElementById('statLabel2').textContent = 'Overall';
        } else {
          document.getElementById('statGood').textContent = '—';
          document.getElementById('statWarn').textContent = '—';
          document.getElementById('statBad').textContent = '—';
        }
        document.getElementById('statsRow').style.display = 'grid';
        return;
      }

      // Normal per-subject rows
      rows.forEach((row, i) => {
        const name = row['subjectTitle'] || row[labelKey] || 'Subject ' + (i + 1);
        const code = row['subjectCode'] || (subKey ? row[subKey] : '') || '';
        const pctRaw = row['percentage'] || row[pctKey] || '';
        const totalClasses = row['totalClasses'] || '';
        const totalPresent = row['totalPresent'] || '';
        const pct = parseFloat(pctRaw);
        const cls = isNaN(pct) ? 'green' : pctClass(pct);
        const classInfo = (totalPresent && totalClasses) ? totalPresent + ' / ' + totalClasses + ' classes' : '';

        if (!isNaN(pct)) {
          if (pct >= 75) good++;
          else if (pct >= 60) warn++;
          else { bad++; lowSubjects.push(name.split('[')[0].trim()); }
        }

        const calc = (totalPresent && totalClasses) ? calcAttendance(totalPresent, totalClasses) : null;
        let calcHtml = '';
        if (calc) {
          if (calc.type === 'safe') calcHtml = calc.canSkip > 0 ? '<span class="calc-chip can-skip">✓ Can skip ' + calc.canSkip + ' more class' + (calc.canSkip > 1 ? 'es' : '') + '</span>' : '<span class="calc-chip at-limit">⚠ At limit — attend all</span>';
          else calcHtml = '<span class="calc-chip must-attend">⚡ Need ' + calc.mustAttend + ' more class' + (calc.mustAttend > 1 ? 'es' : '') + ' for 75%</span>';
        }

        const ring = !isNaN(pct) ? makePctRing(pct, cls) : `<div class="pct-ring"><div class="pct-ring-text">—</div></div>`;

        html += '<div class="subject-card" style="animation-delay:' + (i * 0.06) + 's">'
          + '<div class="subject-main">'
          + '<div class="subject-info"><div class="subject-name">' + name + '</div><div class="subject-sub">' + code + (classInfo ? ' · ' + classInfo : '') + '</div></div>'
          + ring + '</div>'
          + (calcHtml ? '<div class="calc-strip">' + calcHtml + '</div>' : '')
          + '</div>';
      });

      document.getElementById('resultsBody').innerHTML = html;
      document.getElementById('statGood').textContent = good;
      document.getElementById('statWarn').textContent = warn;
      document.getElementById('statBad').textContent = bad;
      document.getElementById('statsRow').style.display = 'grid';

      if (showNotif && lowSubjects.length > 0) {
        document.getElementById('warningText').textContent = lowSubjects.length + ' subject(s) below 75%: ' + lowSubjects.join(', ') + '. Check red chips on each card.';
        document.getElementById('warningBanner').classList.add('visible');
      }
    }

    function buildDailyCards(rows) {
      if (!rows || rows.length === 0) { showError('No attendance data for this date.'); return; }
      let present = 0, absent = 0, validRows = 0, html = '';
      const dateLabel = rows[0].dateOf_attendance ? rows[0].dateOf_attendance.split(' ')[0] : document.getElementById('dateInput').value;

      rows.forEach((row, i) => {
        const att = (row['attendance'] || '').trim().toUpperCase();
        if (att !== 'P' && att !== 'A') return; // Skip if it's not explicitly Present or Absent

        validRows++;
        const name = row['subjectTitle'] || 'Subject ' + (i + 1);
        const code = row['subjectCode'] || '';
        const period = row['period'] || '';
        const isP = att === 'P';

        if (isP) present++; else absent++;

        html += '<div class="daily-att-card" style="animation-delay:' + (validRows * 0.06) + 's">'
          + '<div class="daily-att-main">'
          + '<div class="att-badge ' + (isP ? 'present' : 'absent') + '">' + (isP ? '✓' : '✗') + '</div>'
          + '<div class="subject-info"><div class="subject-name">' + name + '</div><div class="subject-sub">' + code + (period ? ' · ' + period : '') + '</div></div>'
          + '</div></div>';
      });

      if (validRows === 0) {
        showError('No classes recorded for this date.');
        return;
      }

      const total = present + absent;
      html = '<div class="daily-summary">'
        + '<div style="font-size:13px;color:var(--text-muted);flex:1">📅 ' + dateLabel + '</div>'
        + '<div style="font-size:13px;font-weight:700;color:var(--green)">' + present + ' Present</div>'
        + '<div style="font-size:13px;font-weight:700;color:var(--red)">' + absent + ' Absent</div>'
        + '</div>' + html;

      document.getElementById('resultsBody').innerHTML = html;
      document.getElementById('statGood').textContent = present;
      document.getElementById('statWarn').textContent = total;
      document.getElementById('statBad').textContent = absent;
      document.getElementById('statLabel0').textContent = 'Present';
      document.getElementById('statLabel1').textContent = 'Total';
      document.getElementById('statLabel2').textContent = 'Absent';
      document.getElementById('statsRow').style.display = 'grid';
    }

    function buildGenericTable(rows) {
      if (!rows || rows.length === 0) { showError('No data returned.'); return; }
      const keys = Object.keys(rows[0]);
      let html = '<div style="overflow-x:auto"><table class="data-table"><thead><tr>';
      keys.forEach(k => { html += '<th>' + k.replace(/([A-Z])/g, ' $1').trim() + '</th>'; });
      html += '</tr></thead><tbody>';
      rows.forEach(row => {
        html += '<tr>';
        keys.forEach(k => {
          const v = row[k] != null ? row[k] : '—';
          const isP = k.toLowerCase().includes('percent');
          if (isP) { const cls = pctClass(v); const colors = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' }; html += '<td style="color:' + colors[cls] + ';font-weight:600">' + v + (String(v).includes('%') ? '' : '%') + '</td>'; }
          else html += '<td>' + v + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      document.getElementById('resultsBody').innerHTML = html;
    }

    function normalize(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        // First try known key names
        for (const key of ['AttendanceDetails', 'Details', 'Data', 'Records', 'Result', 'response', 'subjects', 'Subjects', 'SubjectList', 'subjectList'])
          if (Array.isArray(data[key]) && data[key].length > 0) return data[key];
        // Then try ANY key that contains an array — pick the largest one (most likely the subject list)
        let bestArr = null;
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key]) && (!bestArr || data[key].length > bestArr.length))
            bestArr = data[key];
        }
        if (bestArr && bestArr.length > 0) return bestArr;
        return [data];
      }
      return [];
    }

    function fillStudentCard(data) {
      const rows = Array.isArray(data) ? data : [data];
      const f = rows[0] || {};
      const rollFromForm = document.getElementById('rollno').value.trim();

      // Try API response fields first
      const apiName   = f.student_Name || f.StudentName || f.Name || '';
      const apiCourse = f.course_Name  || f.CourseName  || f.Course || '';
      const apiRoll   = f.classRoll_No || f.ClassRollNo || f.RollNo || '';
      const apiSem    = f.semester     || f.Semester     || '';

      // Cache real student info whenever Monthly gives us a proper name
      if (apiName) {
        localStorage.setItem('sxc_student_info', JSON.stringify({
          name: apiName, course: apiCourse, roll: apiRoll || rollFromForm, sem: apiSem || selectedSem
        }));
      }

      // Load from cache if API didn't return a name (Daily / Overall endpoints)
      const cached = JSON.parse(localStorage.getItem('sxc_student_info') || 'null');
      const name   = apiName   || (cached && cached.name)   || rollFromForm || 'Student';
      const course = apiCourse || (cached && cached.course) || 'SXC \u00b7 St. Xavier\'s College';
      const roll   = apiRoll   || (cached && cached.roll)   || rollFromForm;
      const sem    = apiSem    || (cached && cached.sem)    || selectedSem;

      document.getElementById('sName').textContent   = name;
      document.getElementById('sCourse').textContent = course;
      document.getElementById('sRoll').textContent   = roll;
      document.getElementById('sSem').textContent    = 'Sem ' + sem;
      // First LETTER of name for avatar (skip digits from roll number fallback)
      const avatarChar = (name.match(/[A-Za-z]/) || ['S'])[0].toUpperCase();
      document.getElementById('sAvatar').textContent = avatarChar;
      document.getElementById('studentCard').classList.add('visible');
    }


    async function fetchAttendance() {
      const roll = document.getElementById('rollno').value.trim();
      if (!roll) { showError('Please enter your Form No. / Exam Roll No.'); return; }
      if (!selectedSem) { showError('Please select a semester.'); return; }

      saveCredentials();
      document.getElementById('savedTag').style.display = 'flex';
      clearResults();
      document.getElementById('loader').classList.add('visible');
      document.getElementById('fetchBtn').disabled = true;
      document.getElementById('debugCard').style.display = 'none';

      const BACKEND = localStorage.getItem('sxc_backend') || 'https://sxc-backend-1.onrender.com';
      const base = 'https://sxcran.ac.in/Student/';

      // Build params for each endpoint
      const overallParams = new URLSearchParams();
      overallParams.append('examRollNo', roll); overallParams.append('semester', selectedSem);

      const now = new Date();
      const monthlyParams = new URLSearchParams();
      monthlyParams.append('examRollNo', roll); monthlyParams.append('semester', selectedSem);
      monthlyParams.append('date', (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear());

      const dailyDate = document.getElementById('dateInput').value || now.toISOString().split('T')[0];
      const dailyParams = new URLSearchParams();
      dailyParams.append('examRollNo', roll); dailyParams.append('semester', selectedSem); dailyParams.append('adNew', dailyDate);

      const paramMap = { overall: overallParams, monthly: monthlyParams, daily: dailyParams };
      const endpointMap = { overall: 'showOverallAttendance', monthly: 'showMonthlyAttendance', daily: 'showDailyAttendance' };

      if (currentTab === 'daily') showToast('Sending: ' + roll + ' · ' + dailyDate, 3000);

      async function tryFetch(url, opts, timeoutMs = 8000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { ...opts, signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const t = await res.text();
          if (!t || t.trim() === '' || t.trim() === 'null' || t.trim() === 'undefined') throw new Error('Empty response');
          const trimmed = t.trim();
          if (trimmed.startsWith('<!') || trimmed.startsWith('<html') || trimmed.startsWith('<')) throw new Error('HTML/XML response');
          if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) throw new Error('Not JSON response');
          return trimmed;
        } catch (e) {
          clearTimeout(timer);
          if (e.name === 'AbortError') throw new Error('Timeout after ' + (timeoutMs/1000) + 's');
          throw e;
        }
      }

      async function fetchEndpoint(tab, params) {
        const targetUrl = base + endpointMap[tab];
        const getUrl = targetUrl + '?' + params.toString();
        const postOpts = { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }, body: params.toString() };
        const strategies = [];
        // Backend gets 35s — Render free tier cold start can take up to 30s
        if (BACKEND) strategies.push(['Backend', () => tryFetch(BACKEND + '/attendance/' + tab, postOpts, 35000)]);
        // Free CORS proxies get 8s each
        strategies.push(
          ['POST corsproxy', () => tryFetch('https://corsproxy.io/?' + encodeURIComponent(targetUrl), postOpts, 8000)],
          ['POST allorigins', () => tryFetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl), postOpts, 8000)],
          ['GET corsproxy', () => tryFetch('https://corsproxy.io/?' + encodeURIComponent(getUrl), { method: 'GET' }, 8000)],
          ['GET allorigins', () => tryFetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(getUrl), { method: 'GET' }, 8000)],
          ['GET codetabs', () => tryFetch('https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(getUrl), { method: 'GET' }, 8000)],
        );
        let text = '', worked = false, lastErr = '';
        for (const [name, fn] of strategies) {
          try {
            if (name === 'Backend') {
              const loaderEl = document.getElementById('loaderText');
              let secs = 35;
              loaderEl.textContent = window._backendReady ? 'Connecting to backend...' : '⏳ Waking up server... ' + secs + 's';
              const countInterval = !window._backendReady ? setInterval(() => {
                secs--;
                if (secs > 0) loaderEl.textContent = '⏳ Waking up server... ' + secs + 's';
                else clearInterval(countInterval);
              }, 1000) : null;
              try {
                text = await fn();
                if (countInterval) clearInterval(countInterval);
                worked = true; break;
              } catch(e) {
                if (countInterval) clearInterval(countInterval);
                throw e;
              }
            } else {
              document.getElementById('loaderText').textContent = 'Trying ' + name + '...';
              text = await fn(); worked = true; break;
            }
          } catch (e) { lastErr += name + ': ' + e.message + ' | '; }
        }
        if (!worked) throw new Error('All proxies failed: ' + lastErr);
        return JSON.parse(text);
      }

      try {
        let data, subjectRows = null;

        if (currentTab === 'overall') {
          // Fetch BOTH: overall aggregate + monthly for subject-wise breakdown
          document.getElementById('loaderText').textContent = 'Fetching overall summary...';
          data = await fetchEndpoint('overall', overallParams);

          // Now also fetch monthly data for subject-wise breakdown + student info
          try {
            document.getElementById('loaderText').textContent = 'Fetching subject-wise data...';
            const monthlyData = await fetchEndpoint('monthly', monthlyParams);
            // Monthly response has real student name — use it for the name card
            fillStudentCard(monthlyData);
            const monthlyRows = normalize(monthlyData);
            // Keep only rows that have a subjectTitle (subject-wise rows, not aggregate)
            const subjectWise = monthlyRows.filter(r => r['subjectTitle'] || r['subjectCode']);
            if (subjectWise.length > 0) subjectRows = subjectWise;
          } catch (e) {
            console.log('[SXC] Monthly fetch failed (will show overall only):', e.message);
          }
        } else {
          data = await fetchEndpoint(currentTab, paramMap[currentTab]);
        }

        document.getElementById('loader').classList.remove('visible');
        document.getElementById('loaderText').textContent = 'Fetching your attendance...';

        if (data === null || data === undefined || (Array.isArray(data) && data.length === 0)) {
          showError('No data found. Verify your roll number and semester.'); return;
        }

        // Fill student card from overall data (has course_Name)
        fillStudentCard(data);

        const labelMap = { overall: 'Subject-Wise Attendance', monthly: 'Monthly Attendance Summary', daily: 'Daily Attendance Details' };
        document.getElementById('resultsLabel').textContent = labelMap[currentTab];

        if (currentTab === 'overall') {
          const overallRows = normalize(data);
          // Find the aggregate row
          const aggRow = overallRows.find(r => !r['subjectTitle']) || overallRows[0];

          // Build the combined overall view
          buildOverallView(aggRow, subjectRows);

        } else if (currentTab === 'daily') {
          const rows = normalize(data);
          if (rows.length > 0) buildDailyCards(rows);

        } else {
          // monthly
          const rows = normalize(data);
          if (rows.length > 0) {
            const first = rows[0];
            const pctKey = 'percentage' in first ? 'percentage' : Object.keys(first).find(k => k.toLowerCase().includes('percent')) || '';
            const labelKey = 'subjectTitle' in first ? 'subjectTitle' : Object.keys(first).find(k => k.toLowerCase().includes('subject') || k.toLowerCase().includes('name')) || '';
            const subKey = 'subjectCode' in first ? 'subjectCode' : null;
            pctKey ? buildSubjectCards(rows, pctKey, labelKey, subKey) : buildGenericTable(rows);
          }
        }

        document.getElementById('resultsSection').classList.add('visible');

      } catch (err) {
        document.getElementById('loader').classList.remove('visible');
        document.getElementById('loaderText').textContent = 'Fetching your attendance...';
        showError(err.message || 'Failed to fetch data.');
      } finally {
        document.getElementById('fetchBtn').disabled = false;
      }
    }

    function buildOverallView(aggRow, subjectRows) {
      const pctRaw = aggRow ? (aggRow['percentage'] || '') : '';
      const pct = parseFloat(pctRaw);
      const totalClasses = aggRow ? (aggRow['totalClasses'] || '—') : '—';
      const totalPresent = aggRow ? (aggRow['totalPresent'] || '—') : '—';
      const cls = isNaN(pct) ? 'green' : pctClass(pct);

      let html = '';

      if (subjectRows && subjectRows.length > 0) {
        // Show per-subject cards from monthly data
        let good = 0, warn = 0, bad = 0, lowSubjects = [];
        const showNotif = localStorage.getItem('sxc_notif') !== 'false';

        // Overall Total — hero banner, visually distinct from subject cards
        if (aggRow && !isNaN(pct)) {
          const overallCalc = (aggRow['totalPresent'] && aggRow['totalClasses']) ? calcAttendance(aggRow['totalPresent'], aggRow['totalClasses']) : null;
          let overallCalcHtml = '';
          if (overallCalc) {
            if (overallCalc.type === 'safe') overallCalcHtml = overallCalc.canSkip > 0
              ? '<span class="calc-chip can-skip" style="font-size:13px;padding:8px 16px;">✓ Can skip ' + overallCalc.canSkip + ' more class' + (overallCalc.canSkip > 1 ? 'es' : '') + ' in total</span>'
              : '<span class="calc-chip at-limit" style="font-size:13px;padding:8px 16px;">⚠ At limit — attend all classes</span>';
            else overallCalcHtml = '<span class="calc-chip must-attend" style="font-size:13px;padding:8px 16px;">⚡ Need ' + overallCalc.mustAttend + ' more class' + (overallCalc.mustAttend > 1 ? 'es' : '') + ' to reach 75%</span>';
          }
          const clrMap = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };
          const clr = clrMap[cls] || '#10b981';
          html += '<div style="'
            + 'background:linear-gradient(135deg,rgba(124,58,237,0.18),rgba(14,165,233,0.12));'
            + 'border:1px solid rgba(124,58,237,0.3);'
            + 'border-radius:20px;padding:22px 20px 18px;margin-bottom:16px;'
            + 'display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;'
            + 'box-shadow:0 8px 32px rgba(124,58,237,0.15);'
            + '">'
            // Label
            + '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,240,255,0.5)">📊 Overall Total</div>'
            // Big percentage
            + '<div style="font-size:52px;font-weight:800;line-height:1;font-family:Syne,sans-serif;color:' + clr + ';text-shadow:0 0 24px ' + clr + '55;">' + Math.round(pct) + '%</div>'
            // Present / Total pills
            + '<div style="display:flex;gap:10px;justify-content:center;">'
            +   '<div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:6px 14px;font-size:13px;font-weight:600;color:#10b981;">✓ ' + totalPresent + ' Present</div>'
            +   '<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:13px;font-weight:600;color:rgba(240,240,255,0.7);">📚 ' + totalClasses + ' Total</div>'
            + '</div>'
            // Calc chip
            + (overallCalcHtml ? '<div>' + overallCalcHtml + '</div>' : '')
            + '</div>';
        }

        subjectRows.forEach((row, i) => {
          const name = row['subjectTitle'] || 'Subject ' + (i + 1);
          const code = row['subjectCode'] || '';
          const sRaw = row['percentage'] || '';
          const sPct = parseFloat(sRaw);
          const sCls = isNaN(sPct) ? 'green' : pctClass(sPct);
          const sClasses = row['totalClasses'] || '';
          const sPresent = row['totalPresent'] || '';
          const classInfo = (sPresent && sClasses) ? sPresent + ' / ' + sClasses + ' classes' : '';

          if (!isNaN(sPct)) {
            if (sPct >= 75) good++;
            else if (sPct >= 60) warn++;
            else { bad++; lowSubjects.push(name.split('[')[0].trim()); }
          }

          const calc = (sPresent && sClasses) ? calcAttendance(sPresent, sClasses) : null;
          let calcHtml = '';
          if (calc) {
            if (calc.type === 'safe') calcHtml = calc.canSkip > 0 ? '<span class="calc-chip can-skip">✓ Can skip ' + calc.canSkip + ' more class' + (calc.canSkip > 1 ? 'es' : '') + '</span>' : '<span class="calc-chip at-limit">⚠ At limit — attend all</span>';
            else calcHtml = '<span class="calc-chip must-attend">⚡ Need ' + calc.mustAttend + ' more class' + (calc.mustAttend > 1 ? 'es' : '') + ' for 75%</span>';
          }

          const ring = !isNaN(sPct) ? makePctRing(sPct, sCls) : `<div class="pct-ring"><div class="pct-ring-text">—</div></div>`;

          html += '<div class="subject-card" style="animation-delay:' + (i * 0.06) + 's">'
            + '<div class="subject-main">'
            + '<div class="subject-info"><div class="subject-name">' + name + '</div>'
            + '<div class="subject-sub">' + code + (classInfo ? ' · ' + classInfo : '') + '</div></div>'
            + ring + '</div>'
            + (calcHtml ? '<div class="calc-strip">' + calcHtml + '</div>' : '')
            + '</div>';
        });

        document.getElementById('statGood').textContent = good;
        document.getElementById('statWarn').textContent = warn;
        document.getElementById('statBad').textContent = bad;
        document.getElementById('statsRow').style.display = 'grid';

        if (showNotif && lowSubjects.length > 0) {
          document.getElementById('warningText').textContent = lowSubjects.length + ' subject(s) below 75%: ' + lowSubjects.join(', ') + '. Check red chips.';
          document.getElementById('warningBanner').classList.add('visible');
        }

      } else {
        // Fallback: only aggregate available
        const ring = !isNaN(pct) ? makePctRing(pct, cls) : `<div class="pct-ring"><div class="pct-ring-text">—</div></div>`;
        const calc = (aggRow && aggRow['totalPresent'] && aggRow['totalClasses']) ? calcAttendance(aggRow['totalPresent'], aggRow['totalClasses']) : null;
        let calcHtml = '';
        if (calc) {
          if (calc.type === 'safe') calcHtml = calc.canSkip > 0 ? '<span class="calc-chip can-skip">✓ Can skip ' + calc.canSkip + ' more class' + (calc.canSkip > 1 ? 'es' : '') + '</span>' : '<span class="calc-chip at-limit">⚠ At limit — attend all</span>';
          else calcHtml = '<span class="calc-chip must-attend">⚡ Need ' + calc.mustAttend + ' more class' + (calc.mustAttend > 1 ? 'es' : '') + ' for 75%</span>';
        }

        html += '<div class="subject-card">'
          + '<div class="subject-main">'
          + '<div class="subject-info"><div class="subject-name">📊 All Subjects Combined</div>'
          + '<div class="subject-sub">' + totalPresent + ' present / ' + totalClasses + ' total classes</div></div>'
          + ring + '</div>'
          + (calcHtml ? '<div class="calc-strip">' + calcHtml + '</div>' : '')
          + '</div>';

        html += '<div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);border-radius:12px;padding:12px 14px;margin-top:4px;display:flex;gap:10px;align-items:flex-start;">'
          + '<div style="font-size:18px;flex-shrink:0">ℹ️</div>'
          + '<div style="font-size:12px;color:rgba(14,165,233,0.9);line-height:1.6;">'
          + '<strong style="display:block;margin-bottom:3px;">Subject-wise data unavailable</strong>'
          + 'Could not retrieve per-subject breakdown this time. Try the <strong>Monthly</strong> tab.'
          + '</div></div>';

        if (!isNaN(pct)) {
          document.getElementById('statGood').textContent = totalPresent;
          document.getElementById('statWarn').textContent = totalClasses;
          document.getElementById('statBad').textContent = Math.round(pct) + '%';
          document.getElementById('statLabel0').textContent = 'Present';
          document.getElementById('statLabel1').textContent = 'Total';
          document.getElementById('statLabel2').textContent = 'Overall';
        }
        document.getElementById('statsRow').style.display = 'grid';
      }

      document.getElementById('resultsBody').innerHTML = html;
    }


    document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('rollno').addEventListener('keydown', e => { if (e.key === 'Enter') fetchAttendance(); });
    loadPreferences();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('/sxc_atttendence/sw.js').catch(() => { }); });
    }

    // Wake up the Render backend on page load with retries.
    // Render free tier sleeps after ~15 min — retry until awake.
    window._backendReady = false;
    (async function warmUpBackend() {
      const backendUrl = localStorage.getItem('sxc_backend') || 'https://sxc-backend-1.onrender.com';
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const r = await fetch(backendUrl + '/health', { method: 'GET', signal: AbortSignal.timeout(20000) });
          if (r.ok) { window._backendReady = true; console.log('[SXC] Backend warmed up ✅ (attempt ' + attempt + ')'); return; }
        } catch (e) { console.log('[SXC] Warm-up attempt ' + attempt + ' pending...'); }
        if (attempt < 5) await new Promise(res => setTimeout(res, 10000));
      }
      console.log('[SXC] Backend warm-up: server may still be cold');
    })();
  