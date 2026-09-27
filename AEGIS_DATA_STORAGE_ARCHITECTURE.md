# AEGIS DATA STORAGE ARCHITECTURE
**Master Production Data Synchronization & Central Database Specification**

---

## 1. Executive Overview & Single Source of Truth
AEGIS operates across multiple client platforms:
- **AEGIS Alert Mobile & Web App:** `https://25a31a0356.github.io/aegis-alert/`
- **AEGIS Incident Intelligence Web Portal:** `https://25A31A0356.github.io/Aegis-web/`
- **AEGIS Software & API Engine:** `https://25a31a0356.github.io/aegis-software/`

All platforms connect to **ONE CANONICAL BACKEND API** backed by **ONE CENTRAL MANAGED POSTGRESQL DATABASE**. Independent local profiles and siloed user registries are strictly prohibited.

```
                  AEGIS APP (Mobile & Web)
                             |
                             | HTTPS REST / WebSockets
                             v
                    ┌─────────────────┐
                    │   BACKEND API   │
                    └────────┬────────┘
                             |
                             v
                   ┌───────────────────┐
                   │  MANAGED POSTGRES │
                   │ CENTRAL DATABASE  │
                   └─────────┬─────────┘
                             |
                   ┌─────────┴─────────┐
                   │                   │
                   v                   v
            AUTOMATED BACKUPS    OBJECT STORAGE
                                       |
                                       v
                                PROFILE PHOTOS
                   ┌───────────────────┐
                   │   BACKEND API     │
                   └─────────▲─────────┘
                             |
                             | HTTPS REST / WebSockets
                             |
                     AEGIS WEB PORTAL
```

---

## 2. Infrastructure & Hosting Details
- **Database Provider:** Managed PostgreSQL (Supabase / Google Cloud SQL / Amazon RDS)
- **Database Engine:** PostgreSQL 16+ with PostGIS Spatial Extensions
- **Database Region:** `ap-south-1` (Mumbai, India) / Multi-AZ Disaster Resilient Tier
- **Database Environment:** `aegis_production_cluster`
- **Database Purpose:** Authoritative, persistent single source of truth for all users, profiles, contacts, live locations, SOS incidents, and safety tips.

---

## 3. Relational Database Schema & Table Mappings

| Data Type | Primary Storage Entity | Table / Collection Name | Access Path (App & Web) |
| :--- | :--- | :--- | :--- |
| **User Account & Identity** | Managed PostgreSQL | `aegis_users` | `GET/POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| **User Profile & Medical** | Managed PostgreSQL | `aegis_users` (`full_name`, `phone`, `blood_group`, `medical_notes`, `people_count`) | `GET /api/v1/auth/profile`, `PUT /api/v1/auth/profile` |
| **Profile Photos** | Persistent S3-compatible Object Storage | Stored in Bucket; reference stored in `aegis_users.avatar_url` | Upload via `/api/v1/auth/upload-avatar`; fetched via CDN URL |
| **Family & Emergency Contacts** | Managed PostgreSQL | `aegis_emergency_contacts` (`user_id`, `name`, `phone`, `relationship`, `is_primary`) | `GET/POST/PUT/DELETE /api/v1/auth/contacts` |
| **User Location (Resolved / Home)** | Managed PostgreSQL + PostGIS | `aegis_user_locations` (`user_id`, `location_name` [e.g. `Gona`], `latitude`, `longitude`, `is_home`) | `GET/PUT /api/v1/auth/location` |
| **Personalized Saved User Tips** | Managed PostgreSQL | `aegis_user_tips` (`user_id`, `tip_text`, `category`, `is_saved`) | `GET/POST/PUT/DELETE /api/v1/auth/tips` |
| **Global Safety Content / Tips** | Static Content Service / Database | `aegis_global_safety_tips` | Public static safety advisory feed (No user linkage) |
| **SOS Incidents & Alerts** | Managed PostgreSQL + Redis Stream | `aegis_sos_incidents` | `POST /api/v1/sos/trigger`, `GET /api/v1/sos/active` |

---

## 4. Client-to-Backend Connectivity & Synchronization

### 4.1. AEGIS Mobile & Web App (`aegis-alert`)
- **Connection Protocol:** HTTPS REST API calls via `AegisApiService` with JWT Bearer authentication header.
- **Bi-directional Sync:** On login or profile edit, invokes `AegisApiService.updateProfile()`, synchronizing fields to central PostgreSQL. On launch or resume, fetches authoritative records via `/api/v1/auth/me` and `/api/v1/auth/profile`.
- **Offline / Local Cache Role:** SecureStore (native) / AsyncStorage (web) acts strictly as a temporary write-through and read-cache for seamless offline resilience, never the master authority.

### 4.2. AEGIS Web Portal (`Aegis-web`)
- **Connection Protocol:** HTTPS REST API via `ApiClient` service with JWT Bearer token authentication.
- **Bi-directional Sync:** `ProfileContext` listens to server updates and triggers `refreshProfileFromServer()`. Any edit in the Web profile settings pushes immediately to `/api/v1/auth/profile` and sub-endpoints.
- **Home Page Integration:** The Web Dashboard renders the exact `home_city` (`Gona` / actual location), full name, and avatar fetched from `/api/v1/auth/me`.

---

## 5. Automated Backup & Disaster Recovery Architecture

```
  PRIMARY DATABASE (PostgreSQL)
               |
      [Continuous WAL Archival]
      [Daily Automated Snapshots]
               |
               v
  ENCRYPTED REPLICATION / S3 STORAGE
  (Region: ap-south-1 & Secondary Cross-Region Failover)
               |
               v
  POINT-IN-TIME RECOVERY (PITR) (Up to 30 Days)
```

- **Automated Continuous Backups:** Daily full snapshots and continuous write-ahead log (WAL) streams.
- **Point-In-Time Recovery (PITR):** Allows database restoration to any specific second within the last 30 days.
- **High-Availability & Protection:** Production database is protected by multi-AZ automatic failover. Destructive actions such as "Delete Entire Database" are physically prohibited in admin controls.

---

## 6. User Deactivation, Soft-Delete & Data Retention Policy

### 6.1. Admin User Deactivation (Soft Delete)
When an administrator deactivates or removes a user:
- The database record is **NEVER** physically truncated or destroyed immediately.
- The record is marked as `account_status = 'DEACTIVATED'`, `deleted_at = NOW()`, `deleted_by = admin_id`.
- The user cannot log in or trigger active SOS calls, but incident logs, medical dossiers, and audit trails remain preserved for forensic safety.

### 6.2. User-Initiated Account Deletion (GDPR / Privacy Compliance)
- When a user explicitly requests permanent account deletion:
  1. Personal identifiers (Name, Email, Phone, Avatar) enter a 30-day grace/scrubbing queue.
  2. Saved personal tips in `aegis_user_tips` and emergency contacts in `aegis_emergency_contacts` are disassociated and purged.
  3. Legally mandated disaster incident archives (e.g. SOS emergency dispatch records) are anonymized according to public safety compliance standards.

---

## 7. Security & Credential Hygiene
- All database passwords, API secrets, JWT secret keys, and `DATABASE_URL` strings are strictly managed via server environment variables (`.env`).
- Frontend repositories (`aegis-alert`, `Aegis-web`, `aegis-software`) contain **ZERO** plaintext database credentials or privileged service roles.
