// Visitor-side logic: evaluate link, log event, redirect or fallback
async function handleVisit(slug, opts){
  const gistId = opts.gistId;
  showMessage('Loading link configuration...');
  if (!gistId) return showMessage('Admin has not configured the Gist ID.');
  try{
    const token = localStorage.getItem('tg_token') || undefined;
    const res = await Gist.read(gistId, token);
    const state = res.data || { links: [], logs: [] };
    const link = state.links.find(l => l.slug === slug);
    if (!link) return showMessage('Link not found.');

    showMessage('Checking visitor information...');
    let ip = '0.0.0.0';
    let country = 'XX';
    try{
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipJson = await ipRes.json(); ip = ipJson.ip || ip;
      const geoRes = await fetch('https://ipapi.co/' + ip + '/json/');
      const geo = await geoRes.json(); country = (geo && (geo.country || geo.country_code) ) || 'XX';
    }catch(e){ console.warn('Geo lookup failed', e); }

    const ua = navigator.userAgent || '';
    const device = Utils.detectDevice(ua);
    const ref = document.referrer || '';
    const source = (function(){ try{ if(!ref) return ''; const u = new URL(ref); return u.hostname.replace('www.',''); }catch(e){return ''} })();

    let countryAllowed = true;
    if (link.allowedCountries && link.allowedCountries.enabled){
      const cfg = link.allowedCountries;
      const code = country.toUpperCase();
      const { tierLists } = Utils;
      countryAllowed = false;
      if (cfg.tier1 && tierLists.tier1.includes(code)) countryAllowed = true;
      if (cfg.tier2 && tierLists.tier2.includes(code)) countryAllowed = true;
      if (cfg.tier3 && tierLists.tier3.includes(code)) countryAllowed = true;
      if (cfg.custom && cfg.custom.length && cfg.custom.includes(code)) countryAllowed = true;
    }

    let deviceAllowed = true;
    if (link.devices && link.devices.length) deviceAllowed = link.devices.includes(device);

    let sourceAllowed = true;
    if (link.sources && link.sources.length){ sourceAllowed = link.sources.some(s => source.includes(s) ); }

    let ipExceeded = false;
    if (link.maxPerIp && link.maxPerIp > 0){
      const windowMin = link.timeframe || 1440;
      const cutoff = Date.now() - windowMin*60*1000;
      const recent = (state.logs || []).filter(x=> x.slug===slug && x.ip===ip && (new Date(x.timestamp)).getTime() >= cutoff);
      if (recent.length >= link.maxPerIp) ipExceeded = true;
    }

    const blocked = !(countryAllowed && deviceAllowed && sourceAllowed) || ipExceeded;
    const entry = { timestamp: new Date().toISOString(), slug, ip, country, device, source, status: blocked? 'blocked' : 'allowed' };

    state.logs = state.logs || [];
    state.logs.push(entry);
    const adminToken = localStorage.getItem('tg_token');
    if (adminToken){
      try{ await Gist.write(gistId, state, adminToken); }catch(e){ console.warn('Gist write failed', e); }
    }

    if (blocked){
      const fallback = link.fallback || localStorage.getItem('tg_global_fallback') || '';
      if (fallback){ showMessage('Access limited — redirecting to fallback...'); setTimeout(()=> window.location.href = fallback, 900); }
      else showMessage('Access blocked. No fallback configured.');
      return;
    }

    showMessage('Access allowed — redirecting...');
    setTimeout(()=> window.location.href = link.target, 900);
  }catch(e){ console.error(e); showMessage('Error: ' + (e.message||e)); }
}

function showMessage(m){ const el = document.getElementById('msg'); if (el) el.innerText = m; }
