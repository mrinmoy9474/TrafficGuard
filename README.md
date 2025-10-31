# TrafficGuard (GitHub Pages) — Final Package

TrafficGuard is a frontend-only link manager + traffic controller that uses a private GitHub Gist for persistent storage (links + logs). This package includes per-link fallbacks, per-IP limits, tiered country selection and a Leaflet map for country analytics.

## Setup checklist

1. Create a private Gist named `trafficguard-data.json` with initial content:
```
{
  "links": [],
  "logs": []
}
```

2. Create a GitHub Personal Access Token (classic) with `gist` scope and copy it.

3. Create a GitHub repository (private if you prefer) and upload the files from this package to the repository root:
- index.html
- admin.html
- css/style.css
- js/gist.js
- js/utils.js
- js/traffic.js
- js/dashboard.js
- README.md

4. Enable GitHub Pages (Settings → Pages) on branch `main` with folder `/ (root)` (or deploy to Netlify later).

5. Open `${'https://mrinmoy9474.github.io/trafficguard/admin.html'}` in browser, paste your Gist ID and token in admin settings, save.

6. Create links using the admin UI and test them:
- Short link: `https://<your-pages-domain>/?id=<slug>`

## Notes
- Gist write rate is limited (5,000 requests/hour per token). Avoid extremely high write frequency.
- Clear Logs in admin overwrites `logs` array but preserves `links`.
- Keep the token private; it is stored only in your browser localStorage.

