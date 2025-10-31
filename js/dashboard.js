// Admin dashboard: CRUD links, stats and map rendering
(async function(){
  const gistIdFld = document.getElementById('gistIdField');
  const tokenFld = document.getElementById('tokenField');
  const saveBtn = document.getElementById('saveSettings');
  const createBtn = document.getElementById('createLinkBtn');
  const linksList = document.getElementById('linksList');
  const refreshBtn = document.getElementById('refreshStats');
  const clearBtn = document.getElementById('clearLogs');
  const statsEl = document.getElementById('summary');
  const countriesContainer = document.getElementById('countriesContainer');
  const allChk = document.getElementById('allCountries');
  const t1Chk = document.getElementById('tier1Chk');
  const t2Chk = document.getElementById('tier2Chk');
  const t3Chk = document.getElementById('tier3Chk');

  let map, countryLayer;

  function uid(len=7){ return Math.random().toString(36).slice(2,2+len); }

  function loadSettingsToFields(){
    const g = localStorage.getItem('tg_gist_id'); if (g) gistIdFld.value = g;
    const t = localStorage.getItem('tg_token'); if (t) tokenFld.value = t;
    const gf = localStorage.getItem('tg_global_fallback'); if (gf) document.getElementById('globalFallback').value = gf;
  }

  function saveSettings(){
    const pass = document.getElementById('adminPass').value;
    const gistId = gistIdFld.value.trim();
    const token = tokenFld.value.trim();
    const gf = document.getElementById('globalFallback').value.trim();
    if (!pass||!gistId||!token) return alert('Fill password, gist id and token');
    localStorage.setItem('tg_admin_pass', btoa(pass));
    localStorage.setItem('tg_gist_id', gistId);
    localStorage.setItem('tg_token', token);
    localStorage.setItem('tg_global_fallback', gf);
    alert('Settings saved locally.');
    loadLinks(); loadStats();
  }

  async function loadGist(){
    const gistId = localStorage.getItem('tg_gist_id');
    const token = localStorage.getItem('tg_token');
    if (!gistId) throw new Error('Gist ID missing');
    return await Gist.read(gistId, token || undefined);
  }

  async function loadLinks(){
    try{
      const g = await loadGist();
      const state = g.data || { links: [], logs: [] };
      if (!state.links) state.links = [];
      linksList.innerHTML = state.links.map(l=>{
        const url = window.location.origin + window.location.pathname.replace(/admin.html$/,'') + '?id=' + l.slug;
        const stats = (state.logs||[]).filter(x=> x.slug===l.slug);
        const total = stats.length; const blocked = stats.filter(x=>x.status==='blocked').length; const allowed = total - blocked;
        return `<div class="link-row"><b>${l.name||l.slug}</b> — <a target="_blank" href="${url}">${url}</a><br/><small>${l.target}</small><br/>Visits: ${total} (Allowed: ${allowed} / Blocked: ${blocked})<br/><button data-slug="${l.slug}" class="copyBtn">Copy</button> <button data-slug="${l.slug}" class="editBtn">Edit</button> <button data-slug="${l.slug}" class="delBtn">Delete</button></div>`;
      }).join('') || 'No links yet';
      Array.from(document.getElementsByClassName('copyBtn')).forEach(b=>b.addEventListener('click', e=>{ const s=e.target.dataset.slug; navigator.clipboard.writeText(window.location.origin + '/?id=' + s); alert('Copied'); }));
      Array.from(document.getElementsByClassName('delBtn')).forEach(b=>b.addEventListener('click', async e=>{ if(!confirm('Delete link?'))return; const slug=e.target.dataset.slug; await deleteLink(slug); loadLinks(); }));
      Array.from(document.getElementsByClassName('editBtn')).forEach(b=>b.addEventListener('click', e=>{ const slug=e.target.dataset.slug; editLinkForm(slug); }));
    }catch(e){ linksList.innerText = 'Load links failed: ' + e.message; }
  }

  async function deleteLink(slug){
    const g = await loadGist(); const state = g.data || { links: [], logs: [] };
    state.links = state.links.filter(l=> l.slug !== slug);
    await Gist.write(localStorage.getItem('tg_gist_id'), state, localStorage.getItem('tg_token'));
    alert('Deleted');
  }

  async function createOrUpdateLink(){
    const gistId = localStorage.getItem('tg_gist_id'); const token = localStorage.getItem('tg_token');
    if (!gistId||!token) return alert('Set settings');
    const name = document.getElementById('linkName').value.trim();
    let slug = document.getElementById('linkSlug').value.trim() || uid(7);
    const target = document.getElementById('targetUrl').value.trim();
    const fallback = document.getElementById('fallbackUrl').value.trim();
    const maxPerIp = parseInt(document.getElementById('maxPerIp').value) || 0;
    const timeframe = parseInt(document.getElementById('timeframe').value) || 1440;
    const devices = document.getElementById('devices').value.split(',').map(s=>s.trim()).filter(Boolean);
    const sources = document.getElementById('sources').value.split(',').map(s=>s.trim()).filter(Boolean);
    const allowedCountries = collectCountrySelection();
    if (!target) return alert('Provide target URL');
    const g = await loadGist(); const state = g.data || { links: [], logs: [] };
    const existing = state.links.find(l=> l.slug === slug);
    const item = { slug, name, target, fallback, maxPerIp, timeframe, devices, sources, allowedCountries, created: new Date().toISOString() };
    if (existing){ Object.assign(existing, item); } else { state.links.push(item); }
    await Gist.write(localStorage.getItem('tg_gist_id'), state, localStorage.getItem('tg_token'));
    alert('Saved'); resetForm(); loadLinks();
  }

  function resetForm(){ document.getElementById('linkName').value=''; document.getElementById('linkSlug').value=''; document.getElementById('targetUrl').value=''; document.getElementById('fallbackUrl').value=''; document.getElementById('maxPerIp').value=''; document.getElementById('timeframe').value='1440'; document.getElementById('devices').value=''; document.getElementById('sources').value=''; clearCountrySelection(); }

  function editLinkForm(slug){
    (async()=>{
      const g = await loadGist(); const state = g.data || { links: [], logs: [] };
      const link = state.links.find(l=> l.slug === slug); if(!link) return alert('Link not found');
      document.getElementById('linkName').value = link.name || '';
      document.getElementById('linkSlug').value = link.slug;
      document.getElementById('targetUrl').value = link.target || '';
      document.getElementById('fallbackUrl').value = link.fallback || '';
      document.getElementById('maxPerIp').value = link.maxPerIp || '';
      document.getElementById('timeframe').value = link.timeframe || 1440;
      document.getElementById('devices').value = (link.devices||[]).join(',');
      document.getElementById('sources').value = (link.sources||[]).join(',');
      loadCountrySelection(link.allowedCountries);
    })();
  }

  function populateCountryCheckboxes(){
    const list = Utils.countriesFullList();
    countriesContainer.innerHTML = list.map(c=>`<label><input type="checkbox" class="countryChk" data-code="${c.code}"> ${c.name} (${c.code})</label>`).join('<br/>');
    t1Chk.addEventListener('change', ()=> toggleTier('tier1', t1Chk.checked));
    t2Chk.addEventListener('change', ()=> toggleTier('tier2', t2Chk.checked));
    t3Chk.addEventListener('change', ()=> toggleTier('tier3', t3Chk.checked));
    allChk.addEventListener('change', ()=>{ const v=allChk.checked; document.querySelectorAll('.countryChk').forEach(cb=>cb.checked=v); t1Chk.checked=v; t2Chk.checked=v; t3Chk.checked=v; });
  }

  function toggleTier(tier, on){ const list = Utils.tierLists[tier]; document.querySelectorAll('.countryChk').forEach(cb=>{ const code = cb.dataset.code; if(list.includes(code)) cb.checked = !!on; }); }

  function collectCountrySelection(){
    const enabled = document.querySelectorAll('.countryChk:checked').length > 0;
    const custom = Array.from(document.querySelectorAll('.countryChk:checked')).map(cb=>cb.dataset.code);
    const t1 = Utils.tierLists.tier1.every(c=> document.querySelector(`.countryChk[data-code="${c}"]`) && document.querySelector(`.countryChk[data-code="${c}"]`).checked);
    const t2 = Utils.tierLists.tier2.every(c=> document.querySelector(`.countryChk[data-code="${c}"]`) && document.querySelector(`.countryChk[data-code="${c}"]`).checked);
    const t3 = Utils.tierLists.tier3.every(c=> document.querySelector(`.countryChk[data-code="${c}"]`) && document.querySelector(`.countryChk[data-code="${c}"]`).checked);
    return { enabled, tier1: t1, tier2: t2, tier3: t3, custom };
  }

  function loadCountrySelection(cfg){
    clearCountrySelection(); if(!cfg) return;
    if (cfg.tier1) toggleTier('tier1', true); if (cfg.tier2) toggleTier('tier2', true); if (cfg.tier3) toggleTier('tier3', true);
    if (cfg.custom && cfg.custom.length) cfg.custom.forEach(code=>{ const el = document.querySelector(`.countryChk[data-code="${code}"]`); if (el) el.checked = true; });
  }
  function clearCountrySelection(){ document.querySelectorAll('.countryChk').forEach(cb=>cb.checked=false); allChk.checked=false; t1Chk.checked=false; t2Chk.checked=false; t3Chk.checked=false; }

  async function loadStats(){
    try{
      const g = await loadGist(); const state = g.data || { links: [], logs: [] };
      const logs = state.logs || [];
      const total = logs.length; const blocked = logs.filter(x=> x.status === 'blocked').length; const allowed = total - blocked;
      statsEl.innerHTML = `Total visits: ${total} <br/> Allowed: ${allowed} <br/> Blocked: ${blocked}`;
      renderMapAndTable(logs);
    }catch(e){ statsEl.innerText = 'Load stats failed: ' + e.message; }
  }

  function renderMapAndTable(logs){
    const byCountry = {};
    logs.forEach(l=>{ const c = (l.country||'XX').toUpperCase(); byCountry[c] = byCountry[c] || { allowed:0, blocked:0 }; if (l.status==='blocked') byCountry[c].blocked++; else byCountry[c].allowed++; });
    const rows = Object.keys(byCountry).map(code=>{ const nameObj = Utils.countriesFullList().find(x=>x.code===code); const name = nameObj?nameObj.name:code; const data = byCountry[code]; return `<tr><td>${name} (${code})</td><td>${data.allowed}</td><td>${data.blocked}</td></tr>`; }).join('');
    document.getElementById('countryTable').innerHTML = `<table class="small"><thead><tr><th>Country</th><th>Allowed</th><th>Blocked</th></tr></thead><tbody>${rows}</tbody></table>`;
    if (!map){ map = L.map('mapContainer', { worldCopyJump:true }).setView([20,0],2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'' }).addTo(map);
    }
    if (countryLayer) countryLayer.clearLayers(); else countryLayer = L.layerGroup().addTo(map);
    const centroids = {
      'US':[39.8283,-98.5795],'IN':[20.5937,78.9629],'GB':[55.3781,-3.4360],'CA':[56.1304,-106.3468],'AU':[-25.2744,133.7751],'DE':[51.1657,10.4515],'FR':[46.2276,2.2137],'BR':[-14.2350,-51.9253],'JP':[36.2048,138.2529],'SG':[1.3521,103.8198],'MX':[23.6345,-102.5528],'ZA':[-30.5595,22.9375]
    };
    Object.keys(byCountry).forEach(code=>{
      const d = byCountry[code]; const pos = centroids[code] || [0,0];
      const color = d.blocked > d.allowed ? 'red' : 'green';
      const marker = L.circleMarker(pos, { radius: 8+Math.log((d.allowed+d.blocked)+1)*2, color: color, fillOpacity:0.6 });
      marker.bindPopup(`<b>${code}</b><br/>Allowed: ${d.allowed}<br/>Blocked: ${d.blocked}`);
      countryLayer.addLayer(marker);
    });
  }

  async function clearLogs(){ if(!confirm('Clear all logs in gist?')) return; const g = await loadGist(); const state = g.data || { links: [], logs: [] }; state.logs = []; await Gist.write(localStorage.getItem('tg_gist_id'), state, localStorage.getItem('tg_token')); alert('Logs cleared'); loadStats(); }

  function exportCsv(){ (async()=>{ const g = await loadGist(); const logs = (g.data && g.data.logs) || []; const csv = Utils.csvFromLogs(logs); const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='trafficguard-logs.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); })(); }

  saveBtn.addEventListener('click', saveSettings);
  createBtn.addEventListener('click', createOrUpdateLink);
  refreshBtn.addEventListener('click', loadStats);
  clearBtn.addEventListener('click', clearLogs);
  document.getElementById('resetForm').addEventListener('click', resetForm);
  document.getElementById('exportCsv').addEventListener('click', exportCsv);
  document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('tg_admin_pass'); localStorage.removeItem('tg_token'); alert('logged out'); location.reload(); });

  populateCountryCheckboxes(); loadSettingsToFields(); loadLinks(); loadStats();
})();