# Deployment Guide — Render (Single Service, Free)

This entire project — frontend + backend + database — deploys as **one
single Render Blueprint**. Render reads `render.yaml` automatically and
creates one web service plus one free Postgres database; you don't need to
manage the frontend and backend separately or deploy them to two different
platforms.

How it works: the build step compiles the React app into `frontend/dist`,
and the Express server (`backend/server.js`) serves those static files
alongside its own API — so there's only one URL and one service in the end.

---

## Step 1: Push the Project to GitHub

```bash
cd collab-tool-final
git init
git add .
git commit -m "initial commit"
```

Create a new repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/collab-tool.git
git push -u origin main
```

---

## Step 2: Deploy on Render

1. Create an account at [render.com](https://render.com) (sign in with GitHub)
2. Click **New → Blueprint** and select your GitHub repo
3. Render will automatically read the root `render.yaml` and:
   - Create a free PostgreSQL database (`collab-tool-db`)
   - Create a single web service that handles both build and start
   - Auto-set `DATABASE_URL` and `JWT_SECRET` for you
4. No manual environment variables are needed — everything is already
   defined in `render.yaml`
5. Click **Apply** to deploy (the first build takes 3–5 minutes since the
   frontend is built as part of it too)

Once deployed you'll get a single URL, e.g. `https://collab-tool.onrender.com`
— this one link serves both the app and the API.

Health check: `https://collab-tool.onrender.com/api/health` should return
`{"status":"ok"}`

---

## Step 3: Test It

- Open the URL, register an account, create a project
- Open a second browser (or incognito window), log in as a different user,
  and invite that user to your project
- Move/assign a task or post a comment — both screens should update live
  (this confirms WebSockets are working, since the socket connection runs
  on the same origin as the rest of the app)

Note: Render's free plan puts the service to sleep after a period of
inactivity — the first request after sleeping can take 30–50 seconds to
wake up, then it runs at normal speed.

---

## Local Development

Run two terminals (the frontend automatically talks to the backend through
a proxy, so no environment variables are required for local dev):

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # set a real JWT_SECRET
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 (Vite dev server — `/api` and `/socket.io`
are automatically proxied to the backend, see `vite.config.js`)
Backend: http://localhost:5000

To test the production build locally (the same way it runs on Render):

```bash
npm run build   # from the project root — builds the frontend, installs backend deps
npm start       # starts the backend server, which serves frontend/dist
```

Then open http://localhost:5000 — the whole app (API + UI) is served from
that single address.
