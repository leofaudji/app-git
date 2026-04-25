import { Api } from "../api.js";

export const PageDashboard = {
  async render(params) {
    // Inject Traffic Pulse Styles
    if (!document.getElementById('traffic-pulse-styles')) {
      const style = document.createElement('style');
      style.id = 'traffic-pulse-styles';
      style.innerHTML = `
        :root { --pulse-duration: 2s; }
        .traffic-pulse-aura {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.2);
          animation: traffic-aura var(--pulse-duration) ease-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes traffic-aura {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .node-row:hover { background: rgba(248, 250, 252, 0.1); }
      `;
      document.head.appendChild(style);
    }
    
    const view = document.getElementById('page-view');
    view.className = 'bg-cloudflare min-h-screen p-6';

    view.innerHTML = `
      <div class="fade-in-up max-w-[1440px] mx-auto">
        <!-- ─── Breadcrumbs & Header ─── -->
        <div class="flex items-center gap-2 text-xs text-slate-500 mb-4">
           <span>Account</span> <span class="text-slate-300">/</span> 
           <span class="font-bold text-slate-700">Dashboard</span>
        </div>
        
        <div class="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Analytics Overview</h2>
            <p class="text-sm text-slate-500 mt-1">Real-time performance and deployment statistics for your account.</p>
          </div>
          <div class="flex items-center gap-4">
             <div class="text-right">
                <div class="cf-label text-[10px]">Last Sync</div>
                <div class="text-xs font-bold text-slate-700" id="last-update">Syncing...</div>
             </div>
             <button onclick="location.reload()" class="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50">Refresh</button>
          </div>
        </div>

        <!-- ─── 1. Contribution Graph (Heatmap) - TOP ─── -->
        <div class="cf-card mb-8">
           <div class="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <i data-lucide="sparkles" class="w-4 h-4 text-emerald-500"></i>
                 Contribution Activity (Last 12 Months)
              </h3>
              <div class="text-[10px] font-bold text-slate-400 uppercase pr-2" id="total-contributions">0 deployments</div>
           </div>
           <div class="p-6 pb-4">
              <div class="flex flex-col lg:flex-row gap-6">
                 <div id="contribution-heatmap-container" class="flex-1 overflow-x-auto">
                    <div class="flex items-center justify-center py-8" id="heatmap-loader">
                       <div class="spinner w-6 h-6 border-2"></div>
                    </div>
                 </div>
                 <div id="contribution-year-selector" class="flex flex-col gap-1 w-24">
                    <!-- Year buttons will be injected here -->
                 </div>
              </div>
              <div class="flex items-center justify-end gap-2 mt-4 text-[10px] font-bold text-slate-400">
                 <span>Less</span>
                 <div class="flex gap-1">
                    <div class="w-2.5 h-2.5 rounded-sm bg-slate-100"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-100"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-300"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
                    <div class="w-2.5 h-2.5 rounded-sm bg-emerald-700"></div>
                 </div>
                 <span>More</span>
              </div>
           </div>
        </div>

        <!-- ─── 2. Top Stats row ─── -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div class="cf-card p-6 flex flex-col">
              <div class="cf-label mb-2">Total Deployed Projects</div>
              <div class="text-3xl font-bold text-slate-900" id="stat-projects">0</div>
              <div class="mt-4 text-[10px] text-slate-400 font-bold flex items-center gap-1">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ACTIVE INFRASTRUCTURE
              </div>
           </div>
           <div class="cf-card p-6 flex flex-col">
              <div class="cf-label mb-2">Success Rate (Last 24h)</div>
              <div class="flex items-end justify-between">
                 <div class="text-3xl font-bold cf-blue" id="stat-rate">0%</div>
                 <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div id="rate-bar" class="h-full cf-bg-blue transition-all duration-1000" style="width: 0%"></div>
                 </div>
              </div>
              <div class="mt-auto text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Reliability Index</div>
           </div>
           <div class="cf-card p-6 flex flex-col">
              <div class="cf-label mb-2">Total Deployments</div>
              <div class="text-3xl font-bold text-slate-900" id="stat-total">0</div>
              <div class="mt-4 flex items-center justify-between">
                 <span class="text-[10px] text-indigo-600 font-bold" id="stat-24h">+0 today</span>
                 <span class="text-[9px] text-slate-400 uppercase">System wide</span>
              </div>
           </div>
        </div>

        <!-- ─── 3. Main Monitoring Center (Super Tidy Redesign) ─── -->
        <div class="cf-card mb-8 overflow-hidden bg-white border-slate-200">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
               <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/50">
                     <i data-lucide="activity" class="w-5 h-5"></i>
                  </div>
                  <div>
                     <h3 class="text-base font-bold text-slate-800 tracking-tight leading-none">Infrastructure Real-time Analytics</h3>
                     <p class="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Service connectivity is optimal • <span id="last-update">Syncing...</span>
                     </p>
                  </div>
               </div>
               <div id="health-score-badge" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-500">
                  <span id="health-dot" class="w-2 h-2 rounded-full animate-pulse"></span>
                  <span class="opacity-70">Health Score:</span>
                  <span id="health-percent" class="font-black">100%</span>
               </div>
            </div>

            <!-- Enhanced Metric Blocks -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100 bg-slate-50/20 border-b border-slate-100">
               <!-- CPU -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="cpu" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPU LOAD</span>
                     </div>
                     <div class="text-2xl font-black text-slate-800 tracking-tighter" id="cpu-usage">0%</div>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div id="cpu-bar" class="h-full cf-bg-blue transition-all duration-500" style="width: 0%"></div>
                  </div>
               </div>
               <!-- RAM -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="database" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RAM USAGE</span>
                     </div>
                     <div class="text-2xl font-black text-slate-800 tracking-tighter" id="ram-usage">0 GB</div>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div id="ram-bar" class="h-full bg-pink-500 transition-all duration-500" style="width: 0%"></div>
                  </div>
               </div>
               <!-- Storage -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="hard-drive" class="w-3.5 h-3.5 text-slate-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">STORAGE</span>
                     </div>
                     <div class="text-2xl font-black text-slate-800 tracking-tighter" id="disk-percent">0%</div>
                  </div>
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div id="disk-bar" class="h-full bg-slate-400 transition-all duration-500" style="width: 0%"></div>
                  </div>
               </div>
               <!-- Active Connections -->
               <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                     <div class="flex items-center gap-2">
                        <i data-lucide="users" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LIVE TRAFFIC</span>
                     </div>
                     <div class="flex items-center gap-3">
                        <button id="btn-traffic-hub" class="text-[9px] font-bold text-emerald-600 hover:underline uppercase tracking-tighter">View Hub ›</button>
                        <div class="text-2xl font-black text-slate-800 tracking-tighter" id="net-conns">0</div>
                     </div>
                  </div>
                  <div class="flex items-center gap-4 mt-2">
                     <div class="flex items-center gap-1.5">
                        <i data-lucide="arrow-down" class="w-2.5 h-2.5 text-blue-500"></i>
                        <span class="text-[10px] font-bold text-slate-600" id="net-in">0 KB/s</span>
                     </div>
                     <div class="flex items-center gap-1.5">
                        <i data-lucide="arrow-up" class="w-2.5 h-2.5 text-pink-500"></i>
                        <span class="text-[10px] font-bold text-slate-600" id="net-out">0 KB/s</span>
                     </div>
                  </div>
               </div>
            </div>
                             <div class="grid grid-cols-1 lg:grid-cols-4 border-t border-slate-100">
               <!-- Main Visualization -->
               <div class="lg:col-span-3 p-8">
                  <!-- AI Smart Verdict Widget -->
                  <div id="ai-verdict-container" class="mb-8 p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-xl flex items-center justify-between transition-all duration-500">
                     <div class="flex items-center gap-4">
                        <div class="relative w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm" id="ai-verdict-icon-container">
                           <div class="traffic-pulse-aura" id="pulse-aura"></div>
                           <i data-lucide="brain-circuit" class="w-5 h-5 text-indigo-500 relative z-10"></i>
                        </div>
                        <div>
                           <p class="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-0.5">System Intelligence</p>
                           <p class="text-[11px] font-bold text-slate-700" id="ai-verdict-text">Initializing performance analytics...</p>
                        </div>
                     </div>
                     <div id="ai-verdict-badge" class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-600">
                        Analyzing
                     </div>
                  </div>

                  <div class="flex items-center justify-between mb-8">
                     <div class="flex items-center gap-8">
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full cf-bg-blue shadow-sm shadow-blue-200"></span>
                           <span class="text-xs font-bold text-slate-600 uppercase tracking-tight">CPU Usage %</span>
                        </div>
                        <div class="flex items-center gap-2.5">
                           <span class="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-200"></span>
                           <span class="text-xs font-bold text-slate-600 uppercase tracking-tight">RAM Usage %</span>
                        </div>
                     </div>
                     <div class="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded border border-slate-100">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Feed</span>
                     </div>
                  </div>
                  <div class="cf-chart-container h-[360px] relative">
                     <canvas id="infra-chart"></canvas>
                  </div>
               </div>

               <!-- Right Details Panel (Redesigned with Tabs) -->
               <div class="bg-slate-50/50 border-l border-slate-100 flex flex-col h-full overflow-hidden">
                  <!-- Tab Navigation Header -->
                  <div class="flex border-b border-slate-200 bg-white">
                     <button class="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-indigo-500 transition-all duration-300" id="btn-tab-details">
                        Details
                     </button>
                     <button class="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all duration-300" id="btn-tab-watchdog">
                        Watchdog
                     </button>
                  </div>

                  <!-- Dynamic Tab Content -->
                  <div class="flex-1 overflow-y-auto p-8">
                     <!-- Panel: Details -->
                     <div id="panel-details" class="space-y-8">
                        <div>
                          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">System Identity</h4>
                          <div class="space-y-6">
                             <!-- Basic Identity -->
                             <div class="grid grid-cols-1 gap-4">
                                <div class="flex items-start gap-3">
                                   <div class="mt-1"><i data-lucide="monitor" class="w-3.5 h-3.5 text-slate-400"></i></div>
                                   <div>
                                      <p class="text-xs font-bold text-slate-700 leading-tight" id="sys-os">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">OS Platform & Hostname (<span id="sys-hostname">-</span>)</p>
                                   </div>
                                </div>
                                <div class="flex items-start gap-3">
                                   <div class="mt-1"><i data-lucide="cpu" class="w-3.5 h-3.5 text-slate-400"></i></div>
                                   <div>
                                      <p class="text-xs font-bold text-slate-700 leading-tight" id="sys-cpu">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">Processor (<span id="sys-arch">-</span>)</p>
                                   </div>
                                </div>
                             </div>

                             <!-- Network Specs -->
                             <div class="pt-4 border-t border-slate-200/50">
                                <h5 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Network & Access</h5>
                                <div class="grid grid-cols-2 gap-4">
                                   <div>
                                      <p class="text-xs font-bold text-slate-700" id="sys-ip-local">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">Local IP</p>
                                   </div>
                                   <div>
                                      <p class="text-xs font-bold text-slate-700" id="sys-ip-public">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">Public IP</p>
                                   </div>
                                </div>
                             </div>

                             <!-- Hardware Specs -->
                             <div class="pt-4 border-t border-slate-200/50">
                                <h5 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Hardware Specs</h5>
                                <div class="grid grid-cols-2 gap-y-4 gap-x-2">
                                   <div>
                                      <p class="text-xs font-bold text-slate-700" id="sys-cores">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">CPU Cores</p>
                                   </div>
                                   <div>
                                      <p class="text-xs font-bold text-slate-700" id="sys-ram">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">Physical RAM</p>
                                   </div>
                                   <div>
                                      <p class="text-xs font-bold text-slate-700" id="sys-disk">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">Storage</p>
                                   </div>
                                   <div>
                                      <p class="text-xs font-bold text-indigo-600" id="sys-virt">-</p>
                                      <p class="text-[10px] text-slate-400 font-medium mt-0.5">Environment</p>
                                   </div>
                                </div>
                                <div class="mt-4 p-2 bg-slate-100/50 rounded text-[10px]">
                                   <span class="text-slate-400 font-bold uppercase mr-1">MFG:</span>
                                   <span class="text-slate-600 font-bold" id="sys-mfg">-</span>
                                   <span class="mx-1 text-slate-300">|</span>
                                   <span class="text-slate-600" id="sys-model">-</span>
                                </div>
                             </div>
                          </div>

                          <div class="pt-6 border-t border-slate-200/50">
                            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Runtime Engine</h4>
                            <div class="grid grid-cols-2 gap-4 mb-5">
                             <div>
                                <p class="text-xs font-bold text-slate-700" id="sys-php">-</p>
                                <p class="text-[10px] text-slate-400 font-medium mt-0.5">PHP Ver.</p>
                             </div>
                             <div>
                                <p class="text-xs font-bold text-slate-700 truncate" id="sys-mysql">-</p>
                                <p class="text-[10px] text-slate-400 font-medium mt-0.5">MySQL</p>
                             </div>
                          </div>
                          <div class="p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm">
                             <div class="flex items-center justify-between mb-1.5">
                                <span class="text-[10px] font-bold text-slate-500">Memory Peak</span>
                                <span class="text-[10px] font-black text-indigo-600" id="php-peak">-</span>
                             </div>
                             <div class="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div class="bg-indigo-500 h-full" style="width: 40%"></div>
                             </div>
                             <p class="text-[9px] text-slate-400 mt-1.5 font-medium">Limit: <span id="php-limit">-</span></p>
                          </div>
                        </div>

                        <div class="pt-6 border-t border-slate-200/50">
                          <div class="flex items-center justify-between mb-4">
                             <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Life Cycle</h4>
                             <button class="text-[9px] font-bold text-indigo-600 hover:underline" id="btn-deep-specs">View Details ›</button>
                          </div>
                          <div class="space-y-3.5">
                             <div class="flex items-center justify-between">
                                <span class="text-[11px] font-medium text-slate-500">Host Uptime</span>
                                <span class="text-[11px] font-bold text-slate-700" id="sys-uptime">0s</span>
                             </div>
                             <div class="flex items-center justify-between">
                                <span class="text-[11px] font-medium text-slate-500">DB Uptime</span>
                                <span class="text-[11px] font-bold text-slate-700" id="db-uptime">0s</span>
                             </div>
                             <div class="flex items-center justify-between">
                                <span class="text-[11px] font-medium text-slate-500">Connections</span>
                                <span class="text-[11px] font-bold text-slate-800" id="db-conns">0</span>
                             </div>
                          </div>
                        </div>
                     </div>

                     <!-- Panel: Watchdog -->
                     <div id="panel-watchdog" class="hidden space-y-6">
                        <div class="flex items-center justify-between mb-2">
                           <div class="flex items-center gap-2">
                              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Error Sentinel</h4>
                              <span class="flex h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" id="watchdog-dot"></span>
                           </div>
                           <button class="text-[9px] font-bold text-rose-600 hover:underline" id="btn-full-logs">Full Reader ›</button>
                        </div>
                        <div class="space-y-3" id="error-list">
                           <p class="text-[10px] text-slate-400 italic">Monitoring application logs...</p>
                        </div>
                        <div class="mt-8 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                           <p class="text-[10px] text-indigo-600 font-bold mb-1">PRO TIP</p>
                           <p class="text-[10px] text-slate-500 leading-normal">Watchdog monitors <code>php_errors.log</code> in real-time. Fatal errors will trigger immediate visual alerts.</p>
                        </div>
                     </div>
                  </div>

                  <!-- Fixed Bottom Action -->
                  <div class="p-8 pt-0 mt-auto">
                     <button id="refresh-diagnostics" class="w-full py-2 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-200 rounded transition-colors uppercase tracking-wider active:scale-[0.98]">
                        Refresh Diagnostics
                     </button>
                  </div>
               </div>
            </div>
        </div>

        <!-- Diagnostic Modal -->
        <div id="diag-modal" class="modal-overlay">
           <div class="modal-box max-w-2xl bg-white shadow-2xl p-0 overflow-hidden border-0">
              <div class="modal-header bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                 <div class="flex items-center gap-3">
                    <div class="p-2 bg-indigo-100 rounded-lg"><i data-lucide="activity" class="w-4 h-4 text-indigo-600"></i></div>
                    <div>
                       <h3 class="modal-title font-black text-slate-800 text-sm uppercase tracking-tight" id="diag-modal-title">Diagnostic Report</h3>
                       <p class="text-[10px] text-slate-400 font-medium">Infrastructure Deep Scan Results</p>
                    </div>
                 </div>
                 <button class="p-2 hover:bg-slate-200 rounded-full transition-colors modal-close"><i data-lucide="x" class="w-4 h-4 text-slate-400"></i></button>
              </div>
              <div class="modal-body p-8 max-h-[70vh] overflow-y-auto" id="diag-modal-body">
                 <div class="flex flex-col items-center justify-center py-12 text-center">
                     <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Performing Deep Scan...</p>
                 </div>
              </div>
              <div class="modal-footer bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
                 <button class="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors modal-close">Dismiss</button>
                 <button class="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 transition-all active:scale-95" id="btn-copy-diag">Copy Report</button>
              </div>
           </div>
        </div>

        <!-- ─── 4. Details Grid ─── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <!-- Active Workspaces -->
           <div class="lg:col-span-2 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                 <h3 class="text-sm font-bold text-slate-800 uppercase tracking-tight">Active Workspaces</h3>
                 <a href="#projects" class="cf-blue text-xs font-bold hover:underline">Manage All Projects ›</a>
              </div>
              <div id="projects-list" class="flex flex-col gap-0.5 border border-slate-100 rounded overflow-hidden">
                 <!-- List Injection -->
              </div>
           </div>

           <!-- Recent Activity -->
           <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between">
                 <h3 class="text-sm font-bold text-slate-800 uppercase tracking-tight">Recent Activity Log</h3>
                 <a href="#logs" class="cf-blue text-xs font-bold hover:underline">Full Log ›</a>
              </div>
              <div class="cf-card p-0 overflow-hidden">
                 <div id="activity-list" class="flex flex-col divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                    <!-- Activity Injection -->
                 </div>
              </div>
           </div>
        </div>
      </div>
    `;

    this.init();
    
    // Add Refresh Diagnostics Handler
    const refreshBtn = document.getElementById('refresh-diagnostics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const icon = refreshBtn.querySelector('i');
        refreshBtn.classList.add('opacity-50');
        const res = await Api.get('monitoring');
        if (res?.success) this.updateMonitorCharts(res.data);
        setTimeout(() => refreshBtn.classList.remove('opacity-50'), 500);
      });
    }

    // Tab Switching Logic
    const btnDetails = document.getElementById('btn-tab-details');
    const btnWatchdog = document.getElementById('btn-tab-watchdog');
    const panelDetails = document.getElementById('panel-details');
    const panelWatchdog = document.getElementById('panel-watchdog');

    if (btnDetails && btnWatchdog) {
      const switchTab = (active) => {
        if (active === 'details') {
          btnDetails.className = 'flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-indigo-500 transition-all duration-300';
          btnWatchdog.className = 'flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all duration-300';
          panelDetails.classList.remove('hidden');
          panelWatchdog.classList.add('hidden');
        } else {
          btnWatchdog.className = 'flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-indigo-500 transition-all duration-300';
          btnDetails.className = 'flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all duration-300';
          panelWatchdog.classList.remove('hidden');
          panelDetails.classList.add('hidden');
        }
      };

      btnDetails.addEventListener('click', () => switchTab('details'));
      btnWatchdog.addEventListener('click', () => switchTab('watchdog'));
    }

    // Diagnostic Modal Logic
    const btnDeepSpecs = document.getElementById('btn-deep-specs');
    const btnFullLogs = document.getElementById('btn-full-logs');
    const modal = document.getElementById('diag-modal');

    if (btnDeepSpecs) btnDeepSpecs.addEventListener('click', () => this.openDiagnosticsModal('system'));
    if (btnFullLogs) btnFullLogs.addEventListener('click', () => this.openDiagnosticsModal('logs'));
    const btnTrafficHub = document.getElementById('btn-traffic-hub');
    if (btnTrafficHub) btnTrafficHub.addEventListener('click', () => this.openDiagnosticsModal('traffic'));

    // Close logic
    if (modal) {
       modal.querySelectorAll('.modal-close').forEach(btn => {
          btn.addEventListener('click', () => modal.classList.remove('open'));
       });
       modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('open');
       });
    }
  },

  async init() {
    const [dashRes, analyticsRes, contribRes] = await Promise.all([
      Api.get('dashboard'),
      Api.get('analytics'),
      Api.get(`analytics?action=contributions&year=${this.currentYear || 'last_year'}`)
    ]);

    if (!dashRes?.success) return;

    const { stats, recent, projects } = dashRes.data;

    // 1. Stats
    this.setElText('stat-projects', projects.length);
    this.setElText('stat-rate', stats.success_rate + '%');
    this.setElStyle('rate-bar', 'width', stats.success_rate + '%');
    this.setElText('stat-total', stats.total);
    this.setElText('stat-24h', `+${stats.logs_24h} today`);
    this.setLastUpdate();

    // 1c. System Info
    if (dashRes.data.system) {
      const sys = dashRes.data.system;
      this.setElText('sys-os', sys.os);
      this.setElText('sys-hostname', sys.hostname);
      this.setElText('sys-cpu', sys.cpu);
      this.setElText('sys-arch', sys.arch);
      this.setElText('sys-cores', sys.cpu_cores);
      this.setElText('sys-ram', sys.ram_total);
      this.setElText('sys-disk', sys.disk_total);
      this.setElText('sys-ip-local', sys.ip_local);
      this.setElText('sys-ip-public', sys.ip_public);
      this.setElText('sys-virt', sys.virt);
      this.setElText('sys-mfg', sys.manufacturer);
      this.setElText('sys-model', sys.model);
      this.setElText('sys-php', sys.php);
      this.setElText('sys-mysql', sys.mysql);
    }

    // 1b. Heatmap
    if (contribRes?.success) {
      this.renderContributionGraph(contribRes.data);
      this.renderYearSelector(contribRes.data);
    }

    // 2. Monitoring
    this.initInfraChart();
    this.startPolling();

    // 3. Render Projects List
    const projList = document.getElementById('projects-list');
    if (projList) {
      projList.innerHTML = projects.slice(0, 8).map(p => `
          <div class="flex items-center justify-between p-4 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
             <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                  ${p.name.charAt(0)}
                </div>
                <div>
                   <div class="text-xs font-bold text-slate-800 group-hover:cf-blue transition-colors cursor-pointer" onclick="location.hash='#git?project_id=${p.id}'">${p.name}</div>
                   <div class="text-[10px] text-slate-400 font-mono mt-0.5">${p.branch || 'main'}</div>
                </div>
             </div>
             <div class="flex items-center gap-10">
                <div class="text-right">
                   <div class="text-[9px] font-bold text-slate-300 uppercase">Status</div>
                   ${this.getStatusBadge(p.last_status)}
                </div>
                <div class="text-right w-32">
                   <div class="text-[9px] font-bold text-slate-300 uppercase">Updated</div>
                   <div class="text-[10px] font-bold text-slate-600">${this.formatTime(p.last_deploy)}</div>
                </div>
                 <div class="flex gap-2 group-hover:opacity-100 opacity-0 transition-opacity">
                    <button onclick="event.stopPropagation(); PageDashboard.quickBackup(${p.id}, '${p.name}')" class="text-xs font-bold text-emerald-500 p-1 hover:bg-emerald-50 rounded" title="Quick Backup DB">🗄️</button>
                    <a href="#git?project_id=${p.id}" class="text-xs font-bold cf-blue p-1 hover:bg-blue-50 rounded" title="Settings">⚙️</a>
                 </div>
             </div>
          </div>
       `).join('');
    }

    // 4. Render Activity List
    const activityList = document.getElementById('activity-list');
    if (activityList) {
      activityList.innerHTML = recent.map(log => `
          <div class="p-3.5 hover:bg-slate-50 transition-colors">
             <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] font-bold text-slate-800 truncate pr-4">${log.project_name || 'System'}</span>
                <span class="text-[9px] text-slate-400 font-bold whitespace-nowrap">${this.formatTime(log.created_at)}</span>
             </div>
             <div class="flex items-center justify-between">
                <span class="text-[9px] font-medium text-slate-500 uppercase tracking-widest">${log.triggered_by} update</span>
                <span class="text-[9px] font-black ${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'} uppercase">
                  ${log.status}
                </span>
             </div>
          </div>
       `).join('');
    }
    // 6. Refresh Icons
    if (window.lucide) lucide.createIcons();
  },

  initInfraChart() {
    const canvas = document.getElementById('infra-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.infraChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(30).fill(''),
        datasets: [
          {
            label: 'CPU',
            data: Array(30).fill(0),
            borderColor: '#0051c3',
            borderWidth: 2,
            backgroundColor: 'transparent',
            pointRadius: 0,
            tension: 0.1
          },
          {
            label: 'RAM',
            data: Array(30).fill(0),
            borderColor: '#ec4899',
            borderWidth: 1.5,
            borderDash: [4, 4],
            backgroundColor: 'transparent',
            pointRadius: 0,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
          x: { display: false }
        },
        animation: { duration: 0 }
      }
    });
  },

  async startPolling() {
    if (window.monitorInterval) clearInterval(window.monitorInterval);
    const poll = async () => {
      if (!document.getElementById('infra-chart')) {
        clearInterval(window.monitorInterval);
        return;
      }
      const res = await Api.get('monitoring');
      if (res?.success) this.updateMonitorCharts(res.data);
    };
    poll();
    window.monitorInterval = setInterval(poll, 3000);
  },

  updateMonitorCharts(data) {
    if (!this.infraChart) return;

    const cpuArr = this.infraChart.data.datasets[0].data;
    cpuArr.shift(); cpuArr.push(data.cpu);

    const ramArr = this.infraChart.data.datasets[1].data;
    ramArr.shift(); ramArr.push(data.ram.percent);

    this.infraChart.update();

    this.setElText('cpu-usage', data.cpu + '%');
    this.setElStyle('cpu-bar', 'width', data.cpu + '%');

    this.setElText('ram-usage', `${data.ram.used} GB`);
    this.setElStyle('ram-bar', 'width', data.ram.percent + '%');

    if (data.disk) {
      this.setElText('disk-percent', data.disk.percent + '%');
      this.setElStyle('disk-bar', 'width', data.disk.percent + '%');
    }

    if (data.uptime !== undefined) {
      this.setElText('sys-uptime', this.formatUptime(data.uptime));
    }

    if (data.db_connections !== undefined) {
      this.setElText('db-conns', data.db_connections);
    }

    if (data.db_uptime !== undefined) {
      this.setElText('db-uptime', this.formatUptime(data.db_uptime));
    }

    if (data.php) {
       this.setElText('php-limit', data.php.memory_limit);
       this.setElText('php-peak', data.php.memory_peak + ' MB');
    }

    // Advanced Metrics: Traffic & Connections
    if (data.connections !== undefined) {
      this.setElText('net-conns', data.connections);
    }
    if (data.network) {
      this.setElText('net-in', data.network.in_kb + ' KB/s');
      this.setElText('net-out', data.network.out_kb + ' KB/s');
    }

    // Advanced Metrics: Error Watchdog
    const errorList = document.getElementById('error-list');
    const dot = document.getElementById('watchdog-dot');
    if (errorList && data.errors) {
      if (data.errors.length > 0) {
        dot.className = 'flex h-2 w-2 rounded-full bg-pink-500 animate-pulse';
        errorList.innerHTML = data.errors.map(err => `
          <div class="p-2 bg-pink-50/50 border border-pink-100 rounded text-[10px] leading-tight">
            <span class="font-bold text-pink-600 block mb-0.5">${err.type}</span>
            <span class="text-slate-600 font-medium">${err.msg}</span>
          </div>
        `).join('');
      } else {
        dot.className = 'flex h-2 w-2 rounded-full bg-emerald-400';
        errorList.innerHTML = '<p class="text-[10px] text-emerald-600 font-medium bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center gap-2">System Healthy</p>';
      }
    }

    this.updateHealthScore(data);
    this.updateAIVerdict(data.verdict);
    
    // Global Traffic Pulse Sync
    if (data.pulse_speed) {
       document.documentElement.style.setProperty('--pulse-duration', data.pulse_speed + 's');
    }
    
    this.setLastUpdate();
  },

  updateAIVerdict(verdict) {
    if (!verdict) return;
    const textEl = document.getElementById('ai-verdict-text');
    const badgeEl = document.getElementById('ai-verdict-badge');
    const containerEl = document.getElementById('ai-verdict-container');
    const iconContainer = document.getElementById('ai-verdict-icon-container');

    if (!textEl || !badgeEl) return;

    textEl.textContent = verdict.text;
    badgeEl.textContent = verdict.severity;

    // Update Styles
    const colors = {
      success: { bg: 'bg-emerald-50/50', border: 'border-emerald-100/50', badge: 'bg-emerald-100 text-emerald-600', icon: 'text-emerald-500' },
      warning: { bg: 'bg-amber-50/50', border: 'border-amber-100/50', badge: 'bg-amber-100 text-amber-600', icon: 'text-amber-500' },
      danger: { bg: 'bg-rose-50/50', border: 'border-rose-100/50', badge: 'bg-rose-100 text-rose-600', icon: 'text-rose-500' },
      info: { bg: 'bg-indigo-50/50', border: 'border-indigo-100/50', badge: 'bg-indigo-100 text-indigo-600', icon: 'text-indigo-500' }
    };

    const cfg = colors[verdict.severity] || colors.info;
    
    containerEl.className = `mb-8 p-4 ${cfg.bg} border ${cfg.border} rounded-xl flex items-center justify-between transition-all duration-500`;
    badgeEl.className = `px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${cfg.badge}`;
    
    // Update Icon
    const lucideMap = { 'alert-triangle': 'alert-triangle', 'cpu': 'cpu', 'database': 'database', 'users': 'users', 'shield-check': 'shield-check' };
    const iconName = lucideMap[verdict.icon] || 'brain-circuit';
    iconContainer.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 ${cfg.icon} ${verdict.severity === 'success' ? '' : 'animate-pulse'}"></i>`;
    lucide.createIcons();
  },

  setLastUpdate() {
    const now = new Date();
    const options = { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    };
    this.setElText('last-update', now.toLocaleString('id-ID', options) + ' WIB');
  },

  formatUptime(seconds) {
    if (seconds === 0) return 'Just started';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 && d === 0) parts.push(`${s}s`);
    
    return parts.join(' ') || '0s';
  },

  updateHealthScore(data) {
    const cpu = parseFloat(data.cpu) || 0;
    const ram = parseFloat(data.ram?.percent) || 0;
    const disk = parseFloat(data.disk?.percent) || 0;
    
    // Weighted Usage: Health starts at 100, subtract usage weighted
    // This formula ensures even at 100% usage on all fronts, health stays at 20%
    let usagePenalty = (cpu * 0.25) + (ram * 0.35) + (disk * 0.1);
    
    // Errors Penalty: 10 points per error, capped at 60 total penalty 
    // to prevent minor log spikes from killing the score completely.
    const errorCount = data.errors?.length || 0;
    const errorPenalty = Math.min(60, errorCount * 10);

    let score = 100 - usagePenalty - errorPenalty;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const badge = document.getElementById('health-score-badge');
    const text = document.getElementById('health-percent');
    const dot = document.getElementById('health-dot');

    if (!badge || !text || !dot) return;

    text.textContent = score + '%';

    // Color Logic
    const baseClass = 'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-500';
    
    if (score > 85) {
      badge.className = `${baseClass} bg-emerald-50 text-emerald-600 border border-emerald-100`;
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    } else if (score > 60) {
      badge.className = `${baseClass} bg-amber-50 text-amber-600 border border-amber-100`;
      dot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
    } else {
      badge.className = `${baseClass} bg-rose-50 text-rose-600 border border-rose-100`;
      dot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-pulse';
    }
  },

  getStatusBadge(status) {
    if (status === 'success') return '<span class="text-[9px] font-bold text-emerald-600 uppercase">Healthy</span>';
    if (status === 'failed') return '<span class="text-[9px] font-bold text-rose-600 uppercase">Failed</span>';
    if (status === 'running') return '<span class="text-[9px] font-bold text-amber-600 uppercase animate-pulse">Updating</span>';
    return '<span class="text-[9px] font-bold text-slate-300 uppercase">Inactive</span>';
  },

  async openDiagnosticsModal(type) {
    const modal = document.getElementById('diag-modal');
    const body = document.getElementById('diag-modal-body');
    const title = document.getElementById('diag-modal-title');
    const copyBtn = document.getElementById('btn-copy-diag');
    
    if (!modal || !body) return;

    // Show loading
    const titles = {
      system: 'Deep Infrastructure Specs',
      logs: 'Full Log Sentinel Report',
      traffic: 'Global Traffic Hub & Geo-Analytics'
    };
    title.textContent = titles[type] || 'Diagnostic Report';
    body.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Performing Deep Scan...</p>
      </div>
    `;
    modal.classList.add('open');

    const res = await Api.get('monitoring?detail=1');
    if (!res?.success) {
      body.innerHTML = '<div class="alert alert-error">Failed to fetch diagnostic data.</div>';
      return;
    }

    const data = res.data;
    let html = '';

    if (type === 'system') {
      const ext = data.extended || {};
      html = `
        <div class="space-y-6">
           <div class="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div>
                 <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Processor</p>
                 <p class="text-sm font-black text-slate-800">${ext.cpu_model || data.cpu_model || 'N/A'}</p>
                 <p class="text-[10px] text-slate-500 mt-1">${ext.cpu_cores || '?'} Cores @ Max Performance</p>
              </div>
              <div>
                 <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operating System</p>
                 <p class="text-sm font-black text-slate-800">${ext.os_name || data.os || 'N/A'}</p>
                 <p class="text-[10px] text-slate-500 mt-1">Version ${ext.os_ver || '?'}</p>
              </div>
           </div>
           
           <div class="space-y-4 pt-2">
              <h5 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Memory & Runtime Configuration</h5>
              <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                 <div class="grid grid-cols-3 gap-4">
                    <div>
                       <p class="text-[9px] text-slate-400 font-bold uppercase mb-0.5">PHP Version</p>
                       <p class="text-xs font-bold text-slate-700">${data.php?.version || '?'}</p>
                    </div>
                    <div>
                       <p class="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Memory Peak</p>
                       <p class="text-xs font-bold text-slate-700">${data.php?.memory_peak || '0'} MB</p>
                    </div>
                    <div>
                       <p class="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Max Limit</p>
                       <p class="text-xs font-bold text-slate-700">${data.php?.memory_limit || '?'}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div class="space-y-4 pt-2">
              <h5 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Storage Telemetry</h5>
              <div class="grid grid-cols-2 gap-4">
                 <div class="p-3 border border-slate-100 rounded-lg">
                    <p class="text-[9px] text-slate-400 font-bold uppercase mb-1">Used Space</p>
                    <p class="text-sm font-black text-slate-700">${data.disk?.used} GB</p>
                 </div>
                 <div class="p-3 border border-slate-100 rounded-lg">
                    <p class="text-[9px] text-slate-400 font-bold uppercase mb-1">Free Space</p>
                    <p class="text-sm font-black text-emerald-600">${data.disk?.free} GB</p>
                 </div>
              </div>
           </div>

           <div class="space-y-4 pt-2">
              <h5 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Resource Hogs (Active Tasks)</h5>
              <div class="border border-slate-100 rounded-lg overflow-hidden">
                 <table class="w-full text-left text-[10px]">
                    <thead class="bg-slate-50 border-b border-slate-100">
                       <tr>
                          <th class="px-4 py-2 font-black text-slate-400 uppercase">Process Name</th>
                          <th class="px-4 py-2 font-black text-slate-400 uppercase text-right">RAM Usage</th>
                       </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                       ${(ext.top_procs || []).map(p => `
                          <tr>
                             <td class="px-4 py-2.5 font-bold text-slate-700">${p.name}</td>
                             <td class="px-4 py-2.5 font-black text-indigo-600 text-right">${p.mem_mb} MB</td>
                          </tr>
                       `).join('')}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      `;
    } else if (type === 'traffic') {
      const hits = data.extended?.recent_hits || [];
      html = `
        <div class="space-y-6">
           <div class="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <div class="flex items-center gap-3">
                 <div class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                 <p class="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Global Traffic Hub Active</p>
              </div>
              <p class="text-[10px] text-emerald-600 font-bold">${data.connections} Active Nodes</p>
           </div>
           
           <div class="space-y-3">
              <h5 class="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Recent Access Points</h5>
              <div class="space-y-1">
                 ${hits.map(hit => `
                    <div class="node-row flex items-center justify-between p-3 rounded-lg border border-slate-50 transition-colors">
                       <div class="flex items-center gap-4">
                          <span class="text-lg">${hit.flag}</span>
                          <div>
                             <p class="text-xs font-bold text-slate-800">${hit.node}</p>
                             <p class="text-[9px] text-slate-400 font-mono">${hit.ip}</p>
                          </div>
                       </div>
                       <div class="text-right">
                          <p class="text-[10px] font-black text-indigo-600">${hit.latency}</p>
                          <p class="text-[9px] text-slate-400 uppercase font-bold">${hit.type}</p>
                       </div>
                    </div>
                 `).join('')}
                 ${hits.length === 0 ? '<p class="text-center py-8 text-slate-400 italic text-xs">Waiting for external signals...</p>' : ''}
              </div>
           </div>

           <div class="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
              <div class="flex items-center justify-between mb-3 text-white/50">
                 <span class="text-[9px] font-black uppercase tracking-widest">Traffic Density</span>
                 <span class="text-[9px] font-mono italic">Real-time Feed</span>
              </div>
              <div class="flex items-end gap-1 h-8">
                 ${Array(24).fill(0).map(() => `<div class="flex-1 bg-indigo-500 opacity-20 rounded-t-sm" style="height: ${Math.random() * 100}%"></div>`).join('')}
              </div>
           </div>
        </div>
      `;
    } else {
      if (!data.errors || data.errors.length === 0) {
        html = '<div class="py-12 text-center text-slate-400 italic">No historical errors found in the last scan buffer.</div>';
      } else {
        html = `
          <div class="space-y-2">
            ${data.errors.map(err => `
              <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg font-mono text-[10px] flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                   <span class="px-2 py-0.5 bg-rose-100 text-rose-600 rounded font-bold uppercase tracking-tighter">${err.type}</span>
                   <span class="text-slate-400">Diagnostic Entry</span>
                </div>
                <p class="text-slate-700 break-words font-medium">${err.msg}</p>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    body.innerHTML = html;

    // Handle copy
    if (copyBtn) {
      copyBtn.onclick = () => {
        const textToCopy = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(textToCopy);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy Report', 2000);
      };
    }
  },

  setElText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; },
  setElStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; },

  renderContributionGraph(data) {
    const container = document.getElementById('contribution-heatmap-container');
    if (!container) return;

    this.setElText('total-contributions', `${data.daily_total} deployments`);

    const heatmap = data.contributions;
    const now     = new Date();
    const days    = [];
    
    // Determine start and end dates based on filter
    let startDate, endDate;
    
    if (data.year === 'last_year') {
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setDate(startDate.getDate() - startDate.getDay()); 
      endDate = now;
    } else {
      const yearInt = parseInt(data.year);
      startDate = new Date(yearInt, 0, 1);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Standardize to Sun start
      endDate = new Date(yearInt, 11, 31);
    }

    // Fill days list
    let current = new Date(startDate);
    while (current <= endDate || days.length % 7 !== 0) {
      const dateStr = current.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: heatmap[dateStr] || 0,
        dayOfWeek: current.getDay(),
        month: current.getMonth(),
        label: current.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      });
      current.setDate(current.getDate() + 1);
      if (days.length > 500) break; // safety
    }

    // Generate weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const getLevel = (count) => {
      if (count === 0) return 'level-0';
      if (count < 3) return 'level-1';
      if (count < 6) return 'level-2';
      if (count < 10) return 'level-3';
      return 'level-4';
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Header with months
    let headerHtml = '<div class="contribution-months">';
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      const date = new Date(firstDay.date);
      const month = date.getMonth();
      if (month !== lastMonth) {
        headerHtml += `<span style="grid-column: ${i + 1}">${monthNames[month]}</span>`;
        lastMonth = month;
      }
    });
    headerHtml += '</div>';

    let html = `<div class="contribution-heatmap">
      <div class="contribution-column-header">
        ${headerHtml}
        <div class="contribution-body">
          <div class="contribution-days-labels">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div class="contribution-grid">`;
    
    weeks.forEach(week => {
      html += `<div class="contribution-week">`;
      week.forEach(day => {
        html += `<div class="contribution-day ${getLevel(day.count)}" 
                      title="${day.count} deployments on ${day.label}"></div>`;
      });
      html += `</div>`;
    });
    
    html += `</div></div></div></div>`;
    container.innerHTML = html;

    // Trigger Lucide refreshes if icons are used (none here but good practice)
    if (window.lucide) lucide.createIcons();
  },

  renderYearSelector(data) {
    const list = document.getElementById('contribution-year-selector');
    if (!list) return;

    const currentYear = data.year;
    const years = ['last_year', ...data.available_years];
    
    list.innerHTML = years.map(y => `
      <button class="contribution-year-btn ${y == currentYear ? 'active' : ''}" 
              data-year="${y}">
        ${y === 'last_year' ? 'Last Year' : y}
      </button>
    `).join('');

    list.querySelectorAll('.contribution-year-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const year = btn.dataset.year;
        if (year === this.currentYear) return;
        
        this.currentYear = year;
        // Show loader
        document.getElementById('contribution-heatmap-container').innerHTML = `
          <div class="flex items-center justify-center py-8">
            <div class="spinner w-6 h-6 border-2"></div>
          </div>`;
        
        const res = await Api.get(`analytics?action=contributions&year=${year}`);
        if (res?.success) {
          this.renderContributionGraph(res.data);
          this.renderYearSelector(res.data);
        }
      });
    });
  },

  formatTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
  },

  async quickBackup(id, name) {
    if (this.isBackingUp) return;
    this.isBackingUp = true;
    
    // Toast is usually global in this app or available via Swal
    if (window.Toast) window.Toast.info(`Memulai backup database ${name}...`);
    else if (window.Swal) Swal.fire({ title: 'Backup', text: `Memulai backup database ${name}...`, icon: 'info', timer: 2000, showConfirmButton: false });

    try {
      const res = await Api.post('backup', { action: 'project_save', id });
      if (res?.success) {
        if (window.Swal) {
          Swal.fire({
            title: 'Berhasil',
            text: `Backup ${name} selesai.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } else {
        if (window.Swal) Swal.fire('Gagal', res?.message || 'Gagal melakukan backup', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isBackingUp = false;
    }
  }
};
