# LaganaCoach Web

Responsive Flask + Jinja web client for LaganaCoach. It renders Bootstrap 5 pages and uses modern ES modules with Fetch to call the LaganaCoach API.

## 1. Overview & Architecture
- **Stack**: Flask, Jinja2 templates, Bootstrap 5, native ES modules.
- **API-first**: All data operations call the FastAPI backend (`lagana-coach-api`).
- **Auth UX**: Login/Forgot/Reset flows handled client-side; tokens stored in `localStorage` (documented XSS risk).
- **Pages**: Dashboard, Players CRUD, Lessons CRUD, Invoice wizard & detail views.
- **Build**: Ready for Railway deployment with Gunicorn and Dockerfile.

Structure:
```
app.py             # Flask app factory & route definitions
templates/         # Page templates (auth, dashboard, players, lessons, invoices)
static/css         # Custom Bootstrap overrides
static/js          # ES modules (api helper, feature scripts)
```

## 2. Local Setup
```bash
cd lagana-coach-web
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
export $(grep -v '^#' .env | xargs)  # or use a dotenv loader
flask --app app run --port 8080 --debug
```
Ensure the API is running (default `http://localhost:8000/api/v1`). Update `.env` as needed.

## 3. Environment Variables
- `API_BASE_URL`: e.g. `http://localhost:8000/api/v1`
- `FRONTEND_BASE_URL`: Base URL that the web app is served from (used for redirects and auth flows).
- `PORT`: optional (Railway injects automatically).

## 4. Interaction with the API
- JS module `static/js/api.js` wraps Fetch requests, handles JWT storage, refresh, and logout.
- On auth routes we hit `/auth/login`, `/auth/password/forgot`, `/auth/password/reset` directly.
- Application pages read current user via `/auth/me` and enforce coach/admin behaviour client-side.

## 5. Running
- **Development**: `flask --app app run --host 0.0.0.0 --port 8080 --debug`
- **Production**: `gunicorn app:app --bind 0.0.0.0:${PORT:-8080}`
- **Docker**: Provided `Dockerfile` installs deps before launching Gunicorn.

## 6. Key Screens & Flows
- **Dashboard**: KPI cards (players, upcoming lessons, open invoices) plus next lessons table.
- **Players**: Table with live search, create/edit form (multi-coach support, admin vs coach behaviour).
- **Lessons**: Filterable list, create/edit form with stroke catalogue, multi-player selection.
- **Invoices**: Wizard (period selection → lesson selection) and detail view with totals + PDF link.

## 7. Invoice Wizard
1. Step 1 collects period and calls `/invoices/generate/prepare` storing the result in session storage.
2. Step 2 displays lessons with checkboxes, calculates totals, submits to `/invoices/generate/confirm`.
3. After creation, user is redirected to the invoice detail page for issue/mark paid actions (via API).

## 8. Deploying on Railway
### Docker (recommended)
1. Push repo to GitHub, create Railway web service from the repository.
2. Variables to set: `API_BASE_URL`, `FRONTEND_BASE_URL`, `PORT` (optional if Railway injects).
3. Dockerfile runs Gunicorn with the appropriate port binding.

### Nixpacks / Buildpacks
- Provide start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
- Ensure `requirements.txt` remains in root.

## 9. Security Notes
- Tokens stored in `localStorage` to interoperate with separate API domain. Documented XSS risk; mitigate by keeping templates clean and enabling Content Security Policy when deploying.
- Logout clears storage client-side and calls API `/auth/logout` to invalidate cookies if present.
- CORS must allow this frontend (`ALLOWED_ORIGINS` on the API).

## 10. Maintenance Tips
- Extend templates under `templates/` and add new JS modules in `static/js`.
- Shared API helper lives in `static/js/api.js` – reuse for new features.
- Update navigation in `templates/base.html` when adding pages.
- Keep CSS in `static/css/custom.css` lightweight; prefer Bootstrap utility classes.

## 11. Troubleshooting
- **401 responses**: verify API credentials; login page clears stale tokens automatically.
- **CORS errors**: update the API `ALLOWED_ORIGINS` env.
- **Missing strokes/players**: ensure seeding via API and that the current coach has associations.
- **Invoice wizard resets**: the selection step relies on `sessionStorage`; ensure same browser session.

---

### Quick Commands
- Lint: `black app.py` & `flake8 app.py`
- Smoke test: `python -m compileall app.py`
- Run dev server: `flask --app app run --debug`
