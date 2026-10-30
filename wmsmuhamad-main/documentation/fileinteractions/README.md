# File Interactions Documentation — Warehouse Management System

This documentation maps how every source file in the WMS project interacts with other files. It is designed to help onboarding developers understand the codebase architecture quickly.

The interactions are categorized into two types:

## 📂 Documents

| Document | Description |
|----------|-------------|
| [Internal Module Dependencies](./internal_dependencies.md) | Local `import`/`use` relationships between files within the same runtime (no HTTP). Covers both Frontend (JS/JSX) and Backend (PHP). |
| [Network API Interactions](./network_api_interactions.md) | HTTP-based communication between the React Frontend and the Laravel Backend via REST API endpoints. |

---

## Architecture Overview

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
        pages["Page Components (9)"]
        styles["CSS Stylesheets (5)"]
    end

    subgraph "Server Runtime (Backend)"
        apiRoutes["routes/api.php"]
        middleware["Sanctum + RoleMiddleware"]
        controllers["Controllers (8)"]
        models["Eloquent Models (18)"]
        helpers["Helpers (2)"]
        db["MySQL Database"]
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

## Quick Reference: File Counts

| Layer | Count | Location |
|-------|:-----:|----------|
| Frontend Pages | 9 | `frontend/src/pages/` |
| Frontend Services | 2 | `frontend/src/services/` |
| Frontend Layout/Components | 3 | `frontend/src/layout/` + `frontend/src/component/` |
| Frontend Styles | 5 | `frontend/src/styles/` + `frontend/src/` |
| Backend Controllers | 8 | `backend/app/Http/Controllers/` |
| Backend Models | 18 | `backend/app/Models/` |
| Backend Helpers | 2 | `backend/app/Helpers/` |
| Backend Migrations | 19 | `backend/database/migrations/` |
| Test/QA Scripts | 2 | `frontend/scripts/` + `scripts/` |
