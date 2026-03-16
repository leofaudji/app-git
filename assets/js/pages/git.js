// ============================================================
// pages/git.js - Git Operations Page
// ============================================================
import { Api, Toast } from "../api.js";

export const PageGit = (() => {

  let currentParams = null;

  async function render(view_mode = 'status', params) {
    currentParams = params;
    const projectId = params.get('project_id');
    const view = document.getElementById('page-view');

    if (!projectId) {
      view.innerHTML = `
        <div class="card p-10 text-center">
          <div class="text-4xl mb-4">🔍</div>
          <h4 class="text-lg font-bold mb-2">Project tidak dipilih</h4>
          <p class="text-muted mb-4">Silakan pilih project dari dashboard atau menu Manage Projects.</p>
          <a href="#dashboard" class="btn btn-primary inline-flex">Kembali ke Dashboard</a>
        </div>`;
      return;
    }

    const res = await Api.get('git', { action: 'status', project_id: projectId });

    const tabs = `
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">${res?.data?.project?.name || 'Git Operations'}</h2>
        <div class="flex gap-2">
          <button class="btn ${view_mode === 'status' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="PageGit.switchTab('status')">🌿 Status</button>
          <button class="btn ${view_mode === 'pull' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="PageGit.switchTab('pull')">🔄 Pull Now</button>
        </div>
      </div>`;

    if (!res || !res.success) {
      view.innerHTML = tabs + `
        <div class="card">
          <div class="alert alert-warning">
            <span>⚠</span>
            <div>
              <strong>Gagal memuat status Git</strong><br>
              <span class="text-sm">${res?.message || 'Pastikan folder project valid dan merupakan repository Git.'}</span>
            </div>
          </div>
          <a href="#projects" class="btn btn-primary btn-sm mt-4">⚙ Periksa Konfigurasi Project</a>
        </div>`;
      return;
    }

    const g = res.data;

    const statusContent = `
      <div class="grid-2 mb-4">
        <div class="card">
          <div class="card-title">🌿 Branch Info</div>
          <div class="flex flex-col gap-3">
            <div>
              <div class="text-muted text-xs mb-1 uppercase">Branch aktif</div>
              <span class="badge badge-indigo">⎇ ${g.branch}</span>
            </div>
            <div>
              <div class="text-muted text-xs mb-1 uppercase">Remote URL</div>
              <code class="text-xs break-all">${g.remote_url || 'Tidak ada'}</code>
            </div>
            <div>
              <div class="text-muted text-xs mb-1 uppercase">Project Path</div>
              <code class="text-xs break-all">${g.path}</code>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📝 Last Commit</div>
          <div class="flex flex-col gap-2 scale-90 origin-top-left">
            <div><div class="text-muted text-xs uppercase">Hash</div><code>${g.last_commit?.hash?.substring(0,8) || '-'}</code></div>
            <div><div class="text-muted text-xs uppercase">Author</div><span class="font-medium">${g.last_commit?.author || '-'}</span></div>
            <div><div class="text-muted text-xs uppercase">Pesan</div><span class="text-sm">${g.last_commit?.message || '-'}</span></div>
            <div><div class="text-muted text-xs uppercase">Tanggal</div><span class="text-xs text-muted">${g.last_commit?.date || '-'}</span></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="p-4 border-b"><h3 class="font-bold">📄 Git Status</h3></div>
        <div class="terminal">${g.status ? escapeHtml(g.status) : '<span class="text-green-500">Working tree clean</span>'}</div>
        <div class="p-4 border-b border-t"><h3 class="font-bold">📜 Recent Commits</h3></div>
        <div class="terminal">${g.log ? escapeHtml(g.log) : 'No commits'}</div>
      </div>`;

    const pullContent = `
      <div class="card">
        <div class="p-4 border-b">
          <h3 class="font-bold">🔄 Manual Git Pull</h3>
        </div>
        <div class="p-4">
          <p class="text-muted text-sm mb-4">Menjalankan <code>git pull origin ${g.branch}</code> untuk project <strong>${g.project.name}</strong>.</p>
          <div class="flex items-center gap-4 mb-6">
            <button id="pull-btn" class="btn btn-success" onclick="PageGit.doPull()">
              🔄 Pull Now
            </button>
            <span class="text-muted text-sm">Branch: <span class="badge badge-ghost">${g.branch}</span></span>
          </div>
          <div id="pull-output" style="display:none" class="mt-4">
            <div class="text-sm font-bold mb-2">📤 Output:</div>
            <div id="pull-terminal" class="terminal bg-black text-green-400 p-4 rounded-md font-mono text-sm">Menunggu…</div>
            <div id="pull-status" class="mt-4"></div>
          </div>
        </div>
      </div>`;

    view.innerHTML = tabs + (view_mode === 'status' ? statusContent : pullContent);
  }

  async function doPull() {
    const projectId = currentParams.get('project_id');
    const btn       = document.getElementById('pull-btn');
    const outputW   = document.getElementById('pull-output');
    const terminal  = document.getElementById('pull-terminal');
    const statusD   = document.getElementById('pull-status');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Pulling…';
    outputW.style.display = 'block';
    terminal.textContent = 'Running git pull…';
    statusD.innerHTML = '';

    const res = await Api.post('git?action=pull', { action: 'pull', project_id: projectId });
    btn.disabled = false;
    btn.innerHTML = '🔄 Pull Now';

    if (!res) {
      terminal.textContent = 'Error: Tidak ada respon dari server';
      return;
    }

    terminal.textContent = res.data?.output || res.message || '(no output)';
    const ok = res.data?.status === 'success';
    statusD.innerHTML = ok
      ? '<div class="alert alert-success">✓ Git pull berhasil!</div>'
      : '<div class="alert alert-error">✕ Git pull gagal. Periksa output di atas.</div>';

    if (ok) Toast.success('Git pull berhasil!');
    else Toast.error('Git pull gagal');
  }

  function switchTab(tab) {
    const projectId = currentParams.get('project_id');
    window.location.hash = (tab === 'pull' ? 'git-pull' : 'git-status') + '?project_id=' + projectId;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render, doPull, switchTab };
})();
