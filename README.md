# 📦 Kiwix Onboarding

> **From Installation to Useful Knowledge** — A full-stack onboarding prototype for Kiwix built with Express + React.

---

## Project structure

```
kiwix-onboarding/
├── backend/                   # Express API (port 5000)
│   ├── server.js              # All routes + simulated download engine
│   ├── data/catalogue.json    # 20 ZIM file entries with sizes, languages, categories
│   └── package.json
└── frontend/                  # React app (port 3000)
    ├── src/
    │   ├── App.jsx            # Step orchestrator + shared state
    │   ├── index.css          # Design system (tokens, components)
    │   └── components/steps/
    │       ├── WelcomeStep.jsx          # Intro & feature overview
    │       ├── InterestsStep.jsx        # Category selection (fetched from API)
    │       ├── LanguageStep.jsx         # Language selection (fetched from API)
    │       ├── StorageStep.jsx          # StorageManager API + manual fallback
    │       ├── RecommendationsStep.jsx  # Personalised ZIM recommendations
    │       ├── DownloadStep.jsx         # Progress, pause, resume, cancel
    │       └── CompleteStep.jsx         # Offline-ready state
    └── package.json           # Proxy → http://localhost:5000
```

## Quick start

### 1. Start the Express backend

```bash
cd backend
npm install
npm start
# API running at http://localhost:5000
```

### 2. Start the React frontend (new terminal)

```bash
cd frontend
npm install
npm start
# App opens at http://localhost:3000
```

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/catalogue` | Full ZIM catalogue (filter by `?category=` or `?language=`) |
| `GET`  | `/api/categories` | Interest categories with icons |
| `GET`  | `/api/languages` | Available languages |
| `POST` | `/api/session` | Create/update session with preferences |
| `GET`  | `/api/recommendations?sessionId=` | Personalised ZIM recommendations |
| `GET`  | `/api/storage` | Storage hint (delegates to StorageManager) |
| `POST` | `/api/download/start` | Start a simulated download |
| `GET`  | `/api/download/:id` | Poll download progress |
| `POST` | `/api/download/:id/pause` | Pause download |
| `POST` | `/api/download/:id/resume` | Resume download |
| `POST` | `/api/download/:id/cancel` | Cancel download |
| `GET`  | `/api/downloads` | List all downloads (for recovery) |

## Onboarding flow

```
Welcome → Interests → Language → Storage → Recommendations → Download → Complete
```

1. **Welcome** — Feature overview
2. **Interests** — Multi-select category chips (API-driven)
3. **Language** — Multi-select language list (API-driven)  
4. **Storage** — StorageManager API detection + manual fallback + connection speed picker
5. **Recommendations** — Scored, ranked ZIM packs fitting your storage; checkable
6. **Download** — Simulated downloads with per-item pause/resume/cancel + progress bars
7. **Complete** — Offline-ready summary with next steps

## Important constraints met

- ✅ No static mockup — fully functional interactive flow  
- ✅ Storage estimated only where StorageManager API permits; manual fallback provided  
- ✅ Download times presented as estimates with connection speed assumption stated  
- ✅ Recommendations adapt when preferences or storage change (Refresh button)  
- ✅ Interrupted downloads demonstrate pause/resume recovery
