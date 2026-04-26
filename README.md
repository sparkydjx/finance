# Finance PWA (GitHub Pages Ready)

This folder contains a simple static Progressive Web App that can be deployed directly to GitHub Pages.

## Local development

Install dependencies:

```powershell
npm install
```

Run the app and Yahoo Finance API together:

```powershell
npm start
```

Then open <http://localhost:3000>.

> Note: GitHub Pages only hosts static files. The live `/api/*` request demo requires the Node backend (`npm start`) or a separately deployed API server.

## API endpoints

- `GET /api/health` - health check
- `GET /api/quote/:symbol` - latest quote + analyst target fields
- `GET /api/chart/:symbol` - chart data (supports `period1`, `period2`, `interval`)
- `GET /api/historical/:symbol` - historical series (supports `period1`, `period2`, `interval`, `events`)
- `GET /api/options/:symbol` - options chain
- `GET /api/search?q=` - symbol/company search
- `GET /api/quote-summary/:symbol?modules=` - fundamentals modules
- `GET /api/insights/:symbol` - insights
- `GET /api/recommendations/:symbol` - recommendations by symbol
- `GET /api/trending?region=` - trending symbols
- `GET /api/daily-gainers` - daily gainers list
- `GET /api/daily-losers` - daily losers list
- `GET /api/screener?predefined=&count=` - screener results

The PWA now includes a live request builder UI that mirrors the canvas-style demo but uses real API responses for any ticker.

## FinBERT setup

FinBERT is installed for finance headline/text sentiment analysis.

Install (if needed on another machine):

```powershell
pip install -r requirements-finbert.txt
```

Run sentiment on one input:

```powershell
python finbert_service.py "Apple beats earnings expectations and raises guidance."
```

Use in Python code:

```python
from finbert_service import analyze_finbert_sentiment

result = analyze_finbert_sentiment("Oil prices fall as supply concerns ease.")
print(result)  # {'label': 'negative', 'score': 0.99}
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In repository settings, open **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` (or run the workflow manually).

The workflow at `.github/workflows/deploy-pages.yml` publishes this static site.

## PWA files

- `manifest.webmanifest` defines install metadata.
- `service-worker.js` caches app shell files for offline use.
- `app.js` registers the service worker and powers the UI.
