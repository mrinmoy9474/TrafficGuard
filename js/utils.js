// Utilities: device detection, tier lists, CSV export helper
const Utils = (function(){
const tierLists = {
tier1: ['US','CA','GB','AU','NZ','DE','FR','NL','CH','SE','NO','DK'],
tier2: ['IT','ES','PT','GR','JP','SG','KR','AE','IL','HK','SA','IE'],
tier3: ['IN','BR','ID','MX','PH','VN','TH','TR','EG','ZA','BD','PK','NG']
};


function detectDevice(ua){
ua = ua.toLowerCase();
if (/mobile|iphone|android/.test(ua)){
if (/ipad|tablet/.test(ua)) return 'tablet';
return 'mobile';
}
return 'desktop';
}


function csvFromLogs(logs){
const cols = ['timestamp','slug','ip','country','device','source','status'];
const rows = logs.map(r=>cols.map(c=>`"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(','));
return [cols.join(','), ...rows].join('
');
}