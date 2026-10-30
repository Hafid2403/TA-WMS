# Dokumentasi Interaksi File — Warehouse Management System

Dokumentasi ini memetakan bagaimana setiap file sumber dalam proyek WMS berinteraksi dengan file lainnya. Dirancang untuk membantu developer baru memahami arsitektur codebase dengan cepat.

Interaksi dikategorikan menjadi dua jenis:

## 📂 Dokumen

| Dokumen | Deskripsi |
|---------|-----------|
| [Dependensi Modul Internal](./internal_dependencies.id.md) | Hubungan `import`/`use` lokal antar file dalam runtime yang sama (tanpa HTTP). Mencakup Frontend (JS/JSX) dan Backend (PHP). |
| [Interaksi API Jaringan](./network_api_interactions.id.md) | Komunikasi berbasis HTTP antara React Frontend dan Laravel Backend melalui endpoint REST API. |

---

## Ikhtisar Arsitektur

```mermaid
graph TB
    subgraph "Browser Runtime (Frontend)"
        main["main.jsx"]
        app["App.jsx"]
        routes["AppRoutes.jsx"]
        layout["DashboardLayout.jsx"]
        sidebar["Sidebar.jsx"]
        apiSvc["api.js (Axios)"]
        authSvc["authService.js"]
        pages["Komponen Halaman (9)"]
        styles["CSS Stylesheet (5)"]
    end

    subgraph "Server Runtime (Backend)"
        apiRoutes["routes/api.php"]
        middleware["Sanctum + RoleMiddleware"]
        controllers["Controllers (8)"]
        models["Eloquent Models (18)"]
        helpers["Helpers (2)"]
        db["Database MySQL"]
    end

    main --> app --> routes --> layout --> sidebar
    routes --> pages
    pages --> apiSvc
    pages --> authSvc
    authSvc --> apiSvc

    apiSvc -- "HTTP REST (JSON)" --> apiRoutes
    apiRoutes --> middleware --> controllers
    controllers --> models --> db
    controllers --> helpers
```

---

## Referensi Cepat: Jumlah File

| Layer | Jumlah | Lokasi |
|-------|:------:|--------|
| Halaman Frontend | 9 | `frontend/src/pages/` |
| Service Frontend | 2 | `frontend/src/services/` |
| Layout/Komponen Frontend | 3 | `frontend/src/layout/` + `frontend/src/component/` |
| Stylesheet Frontend | 5 | `frontend/src/styles/` + `frontend/src/` |
| Controller Backend | 8 | `backend/app/Http/Controllers/` |
| Model Backend | 18 | `backend/app/Models/` |
| Helper Backend | 2 | `backend/app/Helpers/` |
| Migrasi Backend | 19 | `backend/database/migrations/` |
| Skrip Test/QA | 2 | `frontend/scripts/` + `scripts/` |
