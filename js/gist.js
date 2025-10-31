// Minimal Gist wrapper used by admin and visitor flows.
const Gist = {
  async read(gistId, token){
    if (!gistId) throw new Error('No gist id');
    const url = `https://api.github.com/gists/${gistId}`;
    const res = await fetch(url, { headers: token ? { Authorization: 'token ' + token } : {} });
    if (!res.ok) throw new Error('Gist read failed: ' + res.status);
    const obj = await res.json();
    const file = obj.files['trafficguard-data.json'];
    if (!file) return { data: { links: [], logs: [] }, meta: obj };
    try{ const data = JSON.parse(file.content); return { meta: obj, data }; }catch(e){ return { meta: obj, data: { links: [], logs: [] } } }
  },

  async write(gistId, contentObjOrStr, token){
    if (!gistId) throw new Error('No gist id');
    if (!token) throw new Error('No token');
    const contentStr = typeof contentObjOrStr === 'string' ? contentObjOrStr : JSON.stringify(contentObjOrStr, null, 2);
    const url = `https://api.github.com/gists/${gistId}`;
    const body = { files: { 'trafficguard-data.json': { content: contentStr } } };
    const res = await fetch(url, { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type':'application/json', Authorization: 'token ' + token } });
    if (!res.ok) throw new Error('Gist write failed: ' + res.status);
    return await res.json();
  }
};
