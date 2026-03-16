// ============================================================
// pages/git.js - Git Operations Page
// ============================================================
const PageGit = (() => {

  async function render(view_mode = 'status') {
    const view = document.getElementById('page-view');

    const res = await Api.get('git', { action: 'status' });

    const tabs = `
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <button class="btn ${view_mode === 'status' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="PageGit.switchTab('status')">🌿 Status & Branch</button>
        <button class="btn ${view_mode === 'pull' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="PageGit.switchTab('pull')">🔄 Pull Now</button>
      </div>`;

    if (!res || !res.success) {
      view.innerHTML = tabs + `
        <div class="card">
          <div class="alert alert-warning">
            <span>⚠</span>
            <div>
              <strong>Repository belum dikonfigurasi</strong><br>
              <span class="text-sm">${res?.message || 'Pastikan Git Directory sudah diset di Settings.'}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('settings')">⚙ Buka Settings</button>
        </div>`;
      return;
    }

    const g = res.data;

    const statusContent = `
      <div class="grid-2 mb-4">
        <div class="card">
          <div class="card-title">🌿 Branch Info</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <div class="text-muted text-sm mb-3">Branch aktif</div>
              <span class="badge badge-indigo" style="font-size:14px;padding:6px 14px">⎇ ${g.branch}</span>
            </div>
            <div>
              <div class="text-muted text-sm mb-3">Remote URL</div>
              <code class="font-mono" style="word-break:break-all;font-size:11px;color:#94a3b8">${g.remote_url || 'Tidak ada'}</code>
            </div>
            <div>
              <div class="text-muted text-sm mb-3">Git Directory</div>
              <code class="font-mono" style="font-size:11px;color:#94a3b8">${g.git_dir}</code>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📝 Last Commit</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div><div class="text-muted text-sm">Hash</div><code class="font-mono">${g.last_commit?.hash?.substring(0,8) || '-'}</code></div>
            <div><div class="text-muted text-sm">Author</div><span>${g.last_commit?.author || '-'}</span></div>
            <div><div class="text-muted text-sm">Pesan</div><span>${g.last_commit?.message || '-'}</span></div>
            <div><div class="text-muted text-sm">Tanggal</div><span class="text-sm text-muted">${g.last_commit?.date || '-'}</span></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📄 Git Status</div>
        <div class="terminal">${g.status ? escapeHtml(g.status) : '<span style="color:var(--success)">Working tree clean</span>'}</div>
        <div class="card-title mt-4">📜 Recent Commits</div>
        <div class="terminal">${g.log ? escapeHtml(g.log) : 'No commits'}</div>
      </div>`;

    const pullContent = `
      <div class="card">
        <div class="card-title">🔄 Manual Git Pull</div>
        <p class="text-muted text-sm mb-4">Klik tombol di bawah untuk menjalankan <code>git pull</code> pada repository yang dikonfigurasi.</p>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
          <button id="pull-btn" class="btn btn-success" onclick="PageGit.doPull()">
            🔄 Pull Now
          </button>
          <span class="text-muted text-sm">Branch: <code class="font-mono">${g.branch}</code></span>
        </div>
        <div id="pull-output" style="display:none">
          <div class="card-title" style="margin-bottom:10px">📤 Output</div>
          <div id="pull-terminal" class="terminal">Menunggu…</div>
          <div id="pull-status" style="margin-top:12px"></div>
        </div>
      </div>`;

    view.innerHTML = tabs + (view_mode === 'status' ? statusContent : pullContent);
  }

  async function doPull() {
    const btn         = document.getElementById('pull-btn');
    const outputWrap  = document.getElementById('pull-output');
    const terminal    = document.getElementById('pull-terminal');
    const statusDiv   = document.getElementById('pull-status');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:14px;height:14px"></span> Pulling…';
    outputWrap.style.display = 'block';
    terminal.textContent = 'Running git pull…';
    statusDiv.innerHTML = '';

    const res = await Api.post('git?action=pull', { action: 'pull' });
    btn.disabled = false;
    btn.innerHTML = '🔄 Pull Now';

    if (!res) {
      terminal.textContent = 'Error: Tidak ada respon dari server';
      return;
    }

    terminal.textContent = res.data?.output || res.message || '(no output)';
    const ok = res.data?.status === 'success';
    statusDiv.innerHTML = ok
      ? '<div class="alert alert-success">✓ Git pull berhasil!</div>'
      : '<div class="alert alert-error">✕ Git pull gagal. Periksa output di atas.</div>';

    if (ok) Toast.success('Git pull berhasil!');
    else Toast.error('Git pull gagal');
  }

  function switchTab(tab) {
    window.location.hash = tab === 'pull' ? 'git-pull' : 'git-status';
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render, doPull, switchTab };
})();
