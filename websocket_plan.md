# WebSocket Live Telemetry & Demo vs. Real User Architecture Plan

This document outlines the architecture for unified routing, database seeding on startup, clean "Try Demo" login flow, targeted demo telemetry generation, and live WebSocket streaming.

---

## 1. Core Architecture Overview

```mermaid
flowchart TD
    subgraph Startup["1. Backend Startup Seeding"]
        INIT[DemoUserInitializer / CommandLineRunner] -->|Seeds on App Start| DB[(PostgreSQL Database)]
        INIT -.->|Creates Entities| B_SEED[Demo Builder: id=1]
        INIT -.->|Creates Entities| S_SEED[Demo Society: id=1]
        INIT -.->|Creates Entities| F_SEED[Demo Flats & Floors]
        INIT -.->|Creates Entities| D_SEED[Demo Devices: specific IDs 900001..]
        INIT -.->|Creates Users (BCrypt)| U_SEED[demo_resident, demo_society, demo_builder]
    end

    subgraph Frontend["2. Frontend 'Try Demo' & Unified Routing"]
        LOGIN[LogIn.tsx: 'Try Demo' or Manual Credentials] -->|Normal login API call with demo credentials| AUTH[AuthContext: Real JWT Login]
        AUTH -->|Extracts isDemoUser from email| DL[DashboardLayout]
        DL -->|Resident Role| R_VIEW[Clean Route: /flat/1]
        DL -->|Society Admin Role| S_VIEW[Clean Route: /society/1]
        DL -->|Builder Admin Role| B_VIEW[Clean Route: /builder/1]
        DL -->|If Demo User| SWITCH[Quick Demo Role Switcher Bar]
    end

    subgraph Backend["3. Dual Telemetry Pipelines"]
        WS_C[WebSocketContext: connects /ws/energy?email=...] --> WSH[EnergyWebSocketHandler]
        
        %% Real User Pipeline
        subgraph RealPipeline["Real User Pipeline (Non-Demo)"]
            IOT[Real IoT Smart Meter / Device Ingestion API] -->|Actual Reading Payload| RS[ReadingService]
            RS -->|Updates DB readings & device status| DB
            RS -->|Broadcasts DB readings| WSH
        end

        %% Demo User Pipeline
        subgraph DemoPipeline["Demo User Pipeline"]
            WSH -->|Active Demo User Connected?| DS{Demo Session Active?}
            DS -->|Yes| DGEN[DemoReadingService]
            DS -->|No| IDLE[Idle: No Mock Generation]
            DGEN -->|Generates fake readings ONLY for Demo Device IDs| DGEN
            DGEN -->|Broadcasts demo telemetry payload| WSH
        end
    end
```

---

## 2. Key Architecture Points

### A. Database Seeding On-Demand (`DemoUserInitializer`)
When a user clicks "Launch Live Demo" or authenticates with demo credentials (`/auth/demo-login` or `/auth/login`):
1. **Checks if Demo Entities Exist:** If demo builder, society, blocks, floors, flats, and devices do not exist, seeds them dynamically into PostgreSQL on-demand (zero startup overhead).
2. **Populates Demo Users for each role with BCrypt-hashed passwords:**
   - **Demo Resident:** `demoOwner@enera.com` / `demoOwner@owner2007` (Mapped to Flat 1, Society 1)
   - **Demo Society Admin:** `demoSociety@enera.com` / `demoSociety1@society2007` (Mapped to Society 1)
   - **Demo Builder Admin:** `demoBuilder@enera.com` / `demoBuilder1@builder2007` (Mapped to Builder 1)
3. **Creates Fixed Demo Devices:** Populates demo devices with dedicated IDs and serial numbers linked to Flat 1, common areas, and society meters.

---

### B. "Try Demo" Clean Login Flow & Role Switching
- **Demo Session Tracking (`isDemoMode`):**
  - The frontend maintains `isDemoMode` in `AuthContext` and `sessionStorage`.
  - This allows the entire web application to know whether the current session is a demo or a real production user.
- **"Try Demo" Login:**
  - On `LogIn.tsx`, clicking **"Try Demo"** (or selecting a demo role tab):
    - Automatically executes a login API request using the seeded demo credentials.
    - Sets `isDemoMode = true` in session state.
    - Navigates directly to the **real, clean route** (`/flat/1`, `/society/1`, `/builder/1`).
    - **No `/demo` route spaghetti or separate mock pages.** Both demo and regular users use the exact same dashboard components.
- **Interactive Role Switcher (`SwitchViewToggle`):**
  - When `isDemoMode === true`, `DashboardLayout` renders the **"Switch View (Demo)"** toolbar in both desktop and mobile sidebars.
  - Allows instant switching between **Resident** (`/flat/1`), **Society Admin** (`/society/1`), and **Builder Admin** (`/builder/1`).
  - When switched, it updates the active demo user credentials, updates the clean route, and keeps the live WebSocket telemetry stream connected.
  - For real (non-demo) users, `isDemoMode` is `false`, and this switcher is completely hidden.

---

### C. Targeted Fake Energy Reading Generation (Demo Devices Only)
- The backend `DemoReadingService` runs only when at least one active demo session is connected.
- **Strict Device Scoping:**
  - It generates synthetic kW/kWh readings **only for the specific Device IDs linked to the demo users / demo societies**.
  - Real user device IDs are **never touched** by the mock generator.
- Simulated reading payloads are broadcast via `EnergyWebSocketHandler` to the active demo browser sessions.
- When all demo sessions disconnect, the generator goes into idle mode immediately.

---

### D. Real User Telemetry (Non-Demo)
- For real users and real hardware meters:
  - Ingestion occurs via `POST /api/readings` or smart meter ingestion pipeline into `ReadingService`.
  - `ReadingService` writes the real data to the PostgreSQL `readings` table and updates `device.last_seen_at` and `device.status`.
  - `EnergyWebSocketHandler` broadcasts these real database updates to connected clients.
  - **No synthetic jitter or fake data is ever generated for real users.**

---

## 3. Files To Modify / Create

### Backend
1. `backend/src/main/java/com/enera/backend/config/DemoUserInitializer.java`
   - Seeds demo builder, society, blocks, floors, flats, devices, and users with BCrypt passwords into PostgreSQL on startup.
2. `backend/src/main/java/com/enera/backend/mock/DemoReadingService.java`
   - Scopes fake reading generation strictly to seeded demo device IDs; broadcasts every 5s when demo sessions are active.
3. `backend/src/main/java/com/enera/backend/websocket/EnergyWebSocketHandler.java`
   - Distinguishes demo vs. real sessions by user email; broadcasts live telemetry.
4. `backend/src/main/java/com/enera/backend/service/ReadingService.java` & `ReadingController.java`
   - Real reading ingestion, DB persistence, and real-time WebSocket broadcast.
5. `backend/src/main/java/com/enera/backend/security/SecurityConfig.java`
   - Secures all standard endpoints and cleans up legacy `/demo/**` endpoints.

### Frontend
1. `frontend/src/app/login/LogIn.tsx`
   - "Try Demo" buttons perform normal API login with demo credentials and route to clean URLs.
2. `frontend/src/context/AuthContext.tsx`
   - Preserves `isDemoMode` session flag, recognizes demo user accounts, and provides `switchDemoRole`.
3. `frontend/src/components/layout/DashboardLayout.tsx`
   - Preserves `SwitchViewToggle` role switcher for `isDemoMode`; standard layout for real users.
4. `frontend/src/context/WebSocketContext.tsx` & `frontend/src/lib/useEnergyWebSocket.ts`
   - Connects live WebSocket for authenticated users and updates dashboard telemetry.
5. `frontend/src/App.tsx` & `frontend/src/lib/api.ts`
   - Removes obsolete standalone `/demo` route while preserving real API integration and demo session flags.
