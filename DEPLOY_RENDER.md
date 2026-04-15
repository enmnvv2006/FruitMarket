# Deploy Backend to Render + Connect GitHub Pages

## 1. Create Render service
1. Open Render Dashboard -> New + -> Blueprint.
2. Select repository `enmnvv2006/FruitMarket`.
3. Render will detect `render.yaml` and create service `fruitmarket-auth`.
4. In service settings, set `ADMIN_PASSWORD` to your own strong password.

## 2. Get backend URL
After deploy, copy backend URL, for example:
`https://fruitmarket-auth.onrender.com`

## 3. Connect frontend (GitHub Pages)
In GitHub repo:
1. Settings -> Secrets and variables -> Actions -> Variables.
2. Create variable:
   - Name: `VITE_AUTH_API_BASE_URL`
   - Value: `https://fruitmarket-auth.onrender.com/api/auth`
3. Re-run workflow `Deploy GitHub Pages` (or push any commit to `main`).

## 4. Verify
- Frontend: `https://enmnvv2006.github.io/FruitMarket/`
- Backend health: `https://fruitmarket-auth.onrender.com/`
- Registration/login should now work from `github.io` domain.
