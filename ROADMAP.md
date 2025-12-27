# SIGEBIM - 7 Day MVP Plan

## Phase 1: Foundation (Day 1-2)

### Project Initialization
- [x] Create AGENT.md
- [x] Create ROADMAP.md
- [ ] Create Core Documentation
  - [ ] docs/PRODUCT_VISION.md
  - [ ] docs/ARCHITECTURE.md
  - [ ] docs/DATABASE_SCHEMA.md
  - [ ] docs/USER_FLOWS.md
- [x] Initialize Monorepo/Hybrid Structure
- [x] Supabase Setup (Local ports: 64xxx | Cloud: OK)
- [x] Create `init.sql` with RLS
- [x] Create projects table
- [x] Create reports table

### Core Backend MVP
- [ ] Create "Hello World CAD" Python script (DXF to JSON)
- [x] Dockerize the Python script

---

## Phase 2: Validation Engine (Day 3)
- [ ] Implement validation logic (e.g., layer standards)
- [ ] Expose logic via FastAPI
- [ ] Deploy Backend (Cloud Run / Hugging Face)

---

## Phase 3: User Interface (Day 4-5)

### Next.js + Shadcn/UI Setup
- [x] Create Next.js App
- [x] Initialize Shadcn/UI
- [x] Install Core Components (Button, Input, Table, etc.)

### Project Dashboard
- [x] Supabase Client Setup
- [x] Auth Pages (Login/Register + Onboarding Flow)
- [x] Dashboard Layout
- [ ] Implementation of file upload to Supabase Storage
- [ ] Integrate "Audit" button with Python API
- [ ] Result Visualization (Error Table)

---

## Phase 4: Polish & Launch (Day 6-7)
- [ ] Demo Video Recording
- [x] Landing Page
- [ ] Initial Outreach

---

## Today's Progress (Dec 27)
- [x] Fixed user registration flow (RLS + RPC)
- [x] Docker Compose setup (`make dev`)
- [x] Supabase CLOUD integration
- [x] Fixed logout redirect (port 3005)
