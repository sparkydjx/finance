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

## API endpoints

- `GET /api/health` - health check
- `GET /api/quote/:symbol` - fetch quote data from Yahoo Finance (example: `/api/quote/AAPL`)

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
