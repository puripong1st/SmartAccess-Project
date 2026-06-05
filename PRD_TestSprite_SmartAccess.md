# Product Requirements Document (PRD) — SmartAccess System
**Project Name:** Innovative System for Managing Access Rights and Controlling Classroom Access via Wireless Network (SmartAccess)  
**Document Version:** 1.0.0  
**Last Updated:** 2026-06-05  

---

## 1. Executive Summary & Product Overview
SmartAccess is an IoT-enabled classroom access control and auditing platform. The system allows students to request access to specific rooms by scanning dynamic QR codes displayed on hardware controller screens located outside classrooms. Administrators manage these access requests, monitor hardware status, configure system notification channels, and audit entry logs through a centralized web dashboard.

The system is split into three main components:
1. **Frontend Web Application (Next.js):** Client-facing interface for students (registration/status tracking) and administrators (dashboard, logs, configuration).
2. **Backend Serverless API (Next.js API Routes):** Business logic layer connecting to PostgreSQL (Supabase) and executing zero-trust communication hooks, rate limiting, and audit logs.
3. **IoT Edge Controller (ESP32 DevKit + TFT Display):** Hardware device deployed outside classrooms displaying dynamic QR codes, checking in with the server via secure HTTP Polling & MQTT, and triggering door lock relays.

---

## 2. User Roles & Permissions Matrix
The system enforces Role-Based Access Control (RBAC):

| Role | Target Interface | Permissions |
|---|---|---|
| **Student** | Public Web App (`/`) | Scan QR code, register request, view request status, access quick bypass within 5 minutes. |
| **Door Operator** | Admin Dashboard (`/admin/dashboard`) | View pending requests for assigned classrooms, approve/reject requests, trigger manual door unlock. |
| **Owner** | Admin Dashboard (`/admin/dashboard`) | Full access: Approve/reject requests, manage classrooms & ESP32 controllers, manage administrator accounts & permissions, configure Discord/Telegram/LINE webhooks, export PDF audit reports, view system health diagnostics. |

---

## 3. Key Feature Specifications & Functional Requirements

### 3.1 Student Registration & Door Unlocking Flow
*   **Access Restriction:** The public landing page (`/`) is inaccessible unless visited with a valid query parameter containing a QR token and room code (e.g., `/?scan=TOKEN&room=CE-401`). If accessed directly, a restriction screen is displayed.
*   **Form Auto-Fill:** When a student enters their Student ID, Name, and Surname, the client fires a debounced request (500ms) to `/api/students/check-match`. If matching historical data exists, the Faculty, Branch, and Academic Year are auto-filled to reduce friction.
*   **Dynamic QR Validation:** The registration API (`/api/students`) verifies that the scanned QR token is valid and unconsumed. Once registration is submitted, the token is atomically consumed.
*   **Request Stepper UI:** Upon form submission, the student enters a tracking screen containing a real-time progress stepper:
    1.  *Submitted:* Form received.
    2.  *Queued:* Request placed in the database queue.
    3.  *Verifying:* Awaiting administrator review (updates immediately if rejected).
    4.  *Door Unlocked:* Triggered upon admin approval, playing an unlocked animation.
*   **Auto-Approve Window:** If a request is made within designated hours defined in `system_settings`, it bypasses admin review and unlocks immediately.
*   **5-Minute Quick Bypass:** Upon approval, a session containing a bypass token is stored in the browser's `localStorage` (`smartaccess_user_session`). Scanning the QR code again within 5 minutes allows immediate entry without re-filling the registration form.

### 3.2 Administrator Dashboard & Operations
*   **Authentication & Rate Limiting:** Admins authenticate via `/admin/login` using JWT cookies (`smartaccess_admin_token`). Login attempts are rate-limited to 5 attempts per minute per IP using PostgreSQL atomic increments to prevent brute-force attacks.
*   **Pending Requests Tab:** Real-time list of student requests. Operators can approve or reject. Rejections require choosing or typing a reason.
*   **Rooms & ESP32 Management Tab:**
    *   Add, edit, or delete classrooms.
    *   Monitor controller status (Online/Offline) via `last_seen` heartbeat timestamp.
    *   Trigger remote unlock directly from the dashboard.
    *   Generate and copy classroom-specific `config.h` templates for flashing controllers.
*   **Student Directory Tab:**
    *   Search and filter access history.
    *   Perform manual guest unlocks.
    *   Export high-fidelity PDF audit reports using client-side generator.
*   **Admin Management Tab:** Create/delete admin accounts, assign roles (`owner`, `door_operator`), and restrict operators to managing specific rooms (`allowed_rooms`).
*   **System Settings Tab:** Configure Discord Webhook URLs for audit notifications, with support for per-room channel overrides.
*   **Server Health Tab:** Real-time health diagnostic endpoint `/api/system/health` checking database latency, memory consumption, Vercel deployments, and connectivity probes.

### 3.3 ESP32 IoT Edge Controller
*   **Boot Sequence:** Connects to Wi-Fi -> Synchronizes NTP time -> Plays buzzer startup chime -> Draws main standby screen.
*   **Polling Loop:** Every 2 seconds, the controller requests state from `/api/esp32/display?room=ROOM_CODE`.
*   **Zero-Trust API Security:** The controller signs requests with a HMAC-SHA256 signature generated using a shared secret key and current timestamp. The server verifies this signature and rejects requests outside a +/- 60s replay window.
*   **Dynamic QR Generation:** The controller draws a dynamic QR code corresponding to the retrieved token. The token rotates every 60 seconds and expires after 300 seconds.
*   **Door Actuation:** If the server response contains `door_trigger: "open"`, the controller turns GPIO12 HIGH for 5 seconds (triggering the relay/lock), plays an entry melody, and turns on the green indicator LED.

---

## 4. Key API Contracts (For Test Generation)

### 4.1 Student Actions

#### 1. Verify Scan Token
*   **Endpoint:** `POST /api/esp32/qr/verify`
*   **Payload:**
    ```json
    {
      "token": "string (32 hex characters)",
      "room": "string (e.g., CE-401)"
    }
    ```
*   **Responses:**
    *   `200 OK`: `{ "valid": true, "room": "CE-401" }`
    *   `400 Bad Request`: `{ "valid": false, "error": "Token expired or already used" }`

#### 2. Submit Registration
*   **Endpoint:** `POST /api/students`
*   **Payload:**
    ```json
    {
      "title": "string (นาย/นางสาว/นาง)",
      "firstName": "string",
      "lastName": "string",
      "studentId": "string (12-digit numeric)",
      "year": 1-4 (integer),
      "faculty": "string",
      "branch": "string",
      "scanToken": "string",
      "requestedRoom": "string"
    }
    ```
*   **Responses:**
    *   `201 Created`: `{ "id": 123, "status": "pending|approved", "bypass_token": "string" }`
    *   `403 Forbidden`: `{ "error": "Invalid or consumed QR token" }`
    *   `429 Too Many Requests`: `{ "error": "Rate limit exceeded" }`

---

### 4.2 Administrator Actions

#### 1. Admin Login
*   **Endpoint:** `POST /api/auth/login`
*   **Payload:**
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
*   **Headers Set on Success:** `Set-Cookie: smartaccess_admin_token=JWT; HttpOnly; Secure; Path=/`
*   **Responses:**
    *   `200 OK`: `{ "success": true, "role": "owner|door_operator" }`
    *   `401 Unauthorized`: `{ "error": "Invalid credentials" }`
    *   `429 Too Many Requests`: `{ "error": "Brute force limit hit" }`

#### 2. Approve Access Request
*   **Endpoint:** `POST /api/students/[id]/approve`
*   **Headers Required:** `Cookie: smartaccess_admin_token=JWT`
*   **Responses:**
    *   `200 OK`: `{ "success": true }`
    *   `403 Forbidden`: `{ "error": "Unauthorized to manage this room" }`

---

### 4.3 IoT Controller Endpoint

#### 1. Get Display State (Heartbeat & Polling)
*   **Endpoint:** `GET /api/esp32/display`
*   **Query Params:** `?room=CE-401`
*   **Security Headers:**
    *   `x-api-key`: Static key matching environment configuration
    *   `x-timestamp`: Unix epoch string
    *   `x-hmac-signature`: HMAC-SHA256 signature of `timestamp + ":" + path` using shared secret
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "pending_count": 0,
          "last_approved": "Name Surname",
          "active_token": "token_string",
          "register_url": "https://domain.com/?scan=token_string&room=CE-401",
          "door_trigger": "idle|open"
        }
        ```
    *   `401 Unauthorized`: `{ "error": "Invalid HMAC signature or timestamp drift" }`

---

## 5. Test Suite Checklist & High-Risk Test Scenarios
For comprehensive coverage in TestSprite, automated tests should validate:

### 5.1 Security & Access Control Validation
1.  **Direct Landing Page Access:** Attempt to access `/` without parameters. Verify redirection or access restriction error is rendered.
2.  **Rate Limiter Trigger:** Fire 10 consecutive requests to `/api/auth/login` within 10 seconds. Verify `429 Too Many Requests` is returned and login is blocked.
3.  **JWT Session Hijack:** Attempt to trigger `/api/students/[id]/approve` without a valid cookie or with an expired token. Verify `401 Unauthorized` is returned.
4.  **Operator Scope Access:** Log in as a `door_operator` restricted to `CE-401`. Attempt to approve a request for `CE-402`. Verify request is blocked with `403 Forbidden`.
5.  **HMAC Replay Protection:** Send a request to `/api/esp32/display` with a timestamp offset by 120 seconds. Verify the server returns `401 Unauthorized`.

### 5.2 Business Logic & Race Condition Validation
1.  **Double QR Scan (Race Condition):** Fire two simultaneous `POST /api/students` requests with the same `scanToken`. Verify that only one request is created successfully, while the other is rejected with `403 Forbidden`.
2.  **Bypass Token Expiry:** Generate a bypass token, wait 6 minutes, and attempt to call `/api/students/bypass`. Verify access is denied and the student is forced to register via the standard form.
3.  **Auto-Reject Sweep:** Insert a request with status `pending` and a timestamp older than 5 minutes. Trigger the sweep script/scheduler. Verify the status changes to `rejected` and an audit entry is created in `access_logs`.
