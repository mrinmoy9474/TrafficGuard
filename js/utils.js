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
    return [cols.join(','), ...rows].join('\n');
  }

  function countriesFullList(){
    return [
      {code:'US',name:'United States'},{code:'CA',name:'Canada'},{code:'GB',name:'United Kingdom'},{code:'AU',name:'Australia'},{code:'NZ',name:'New Zealand'},{code:'DE',name:'Germany'},{code:'FR',name:'France'},{code:'NL',name:'Netherlands'},{code:'CH',name:'Switzerland'},{code:'SE',name:'Sweden'},{code:'NO',name:'Norway'},{code:'DK',name:'Denmark'},
      {code:'IT',name:'Italy'},{code:'ES',name:'Spain'},{code:'PT',name:'Portugal'},{code:'GR',name:'Greece'},{code:'JP',name:'Japan'},{code:'SG',name:'Singapore'},{code:'KR',name:'South Korea'},{code:'AE',name:'UAE'},{code:'IL',name:'Israel'},{code:'HK',name:'Hong Kong'},{code:'SA',name:'Saudi Arabia'},{code:'IE',name:'Ireland'},
      {code:'IN',name:'India'},{code:'BR',name:'Brazil'},{code:'ID',name:'Indonesia'},{code:'MX',name:'Mexico'},{code:'PH',name:'Philippines'},{code:'VN',name:'Vietnam'},{code:'TH',name:'Thailand'},{code:'TR',name:'Turkey'},{code:'EG',name:'Egypt'},{code:'ZA',name:'South Africa'},{code:'BD',name:'Bangladesh'},{code:'PK',name:'Pakistan'},{code:'NG',name:'Nigeria'}
    ];
  }

  return { tierLists, detectDevice, csvFromLogs, countriesFullList };
})();
