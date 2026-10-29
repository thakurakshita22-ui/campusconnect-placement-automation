# CampusConnect — College Placement Management System

An enterprise-grade, full-stack college placement automation system combining a modern **React + Vite + TypeScript + Tailwind CSS** frontend with a robust **Node.js Express** backend and an **Oracle PL/SQL** database layer.

Designed for college DBMS / PL/SQL mini-project academic submissions, viva demonstrations, and practical placement office automation.

---

## 1. Quick Windows Setup (1-Click Launch for You & Friends)

If you are running this on your Windows laptop or sharing it with a friend:

### Required Software
1. **Node.js** (v18.0.0 or higher): Download from [https://nodejs.org/](https://nodejs.org/) (LTS recommended).
2. **Modern Web Browser**: Google Chrome, Microsoft Edge, or Mozilla Firefox.
3. *Optional*: Git (if cloning from a repository).

> [!NOTE]
> **No Local Oracle Database Installation Required!**
> CampusConnect runs out of the box in **Demo Mode**, using a high-fidelity in-memory PL/SQL engine that executes the exact 5-criteria eligibility rules and audit triggers without needing Oracle installed on your machine.

---

### Step-by-Step Instructions

#### Option A: 1-Click Batch Files (Recommended for Windows)

1. **Extract the ZIP archive** (or open the project folder):
   ```text
   CampusConnect-Placement-System/
   ```
2. **Install Dependencies** (Run once):
   - Double-click **`setup.bat`** (or open PowerShell in the project folder and type `.\setup.bat`).
   - This automatically verifies Node.js, installs both backend and frontend packages, and tests compilation.
3. **Start the Application**:
   - Double-click **`start.bat`**.
   - This launches the backend (`http://localhost:5000`), starts the frontend (`http://localhost:5173`), and automatically opens your web browser!

---

#### Option B: Manual Command Line (PowerShell / Command Prompt)

1. Open PowerShell in the root project folder:
   ```powershell
   # 1. Install dependencies for both backend and frontend
   npm run install:all
   
   # Or individually:
   cd server; npm install; cd ..
   cd client; npm install; cd ..
   ```

2. Validate builds:
   ```powershell
   npm run build
   ```

3. Run API integration health tests:
   ```powershell
   npm test
   ```

4. Launch both frontend and backend concurrently:
   ```powershell
   npm run dev
   ```

5. Open your browser at:
   👉 **`http://localhost:5173`**

---

## 2. User Roles & Demo Credentials

CampusConnect includes an interactive **Role & Persona Switcher** located in the top navigation bar. No passwords or authentication walls are required to evaluate the system:

### 1. Training & Placement Officer (Admin Portal)
- **Role**: `Placement Officer (Admin)`
- **Capabilities**:
  - Full CRUD on Student Profiles & Skills
  - Register corporate recruiters & placement partners
  - Create and configure job openings (min CGPA, max backlogs, eligible batches, prerequisite skills)
  - Run the automated 5-criteria Eligibility Checker on all registered candidates
  - Advance applications through the state machine: `APPLIED` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `SELECTED`
  - View immutable trigger-generated status audit logs
  - Generate placement analytics, branch-wise reports, and export CSVs

### 2. Student Portal (Persona Switcher)
- **Role**: `Student Portal`
- **Interactive Personas**:
  - **Aarav Sharma** (ID `1001`, CGPA 9.45, 0 Backlogs, 2025 Batch, 6 Skills, Placed at Google Cloud)
  - **Diya Patel** (ID `1002`, CGPA 8.80, 0 Backlogs, 2025 Batch, Placed at Infosys)
  - **Rohan Iyer** (ID `1003`, CGPA 8.20, 0 Backlogs, 2025 Batch, Placed at TCS)
  - **Neha Verma** (ID `1006`, CGPA 5.80, 3 Backlogs, 2025 Batch — ideal for testing disqualification diagnostics)
- **Capabilities**:
  - View personalized job opportunities with real-time **Eligible** / **Ineligible** badges
  - 1-click apply for qualifying positions
  - Track active application stages and rejection reasons

---

## 3. Database Architecture: FreeSQL vs. Demo vs. Live Oracle

### How Database Modes Work

| Mode | Intended Use | How it Works | Status Indicator |
| :--- | :--- | :--- | :--- |
| **Demo Mode** *(Default)* | Oracle FreeSQL users, local testing, classroom demonstration | In-memory PL/SQL engine faithfully emulates `PLACEMENT_PKG`, views, triggers, and constraints. Zero database installation required. | Top Navbar displays: **Demo Mode (FreeSQL/Local)** in blue badge. |
| **Live Oracle Mode** | Local Oracle XE / 21c / 23c Free, or Oracle Cloud Autonomous Database | Connects via official `oracledb` driver directly to your Oracle schema, executing procedures and queries. | Top Navbar displays: **Live Oracle DB (PL/SQL)** in green badge. |

> [!IMPORTANT]
> **Why Demo Mode is Recommended for Oracle FreeSQL:**
> Oracle FreeSQL is a browser-hosted sandbox that does not provide an external public TCP port for Node.js drivers to connect over the internet.
> To keep Oracle FreeSQL as your intended database without requiring a heavy local Oracle installation, CampusConnect runs in **Demo Mode** by default.
> All business rules, cutoffs, status transitions, and audit logs precisely mirror your `College-Placement-Automation/` PL/SQL scripts.

### Connecting to a Live Oracle Database (Optional)
If you have an accessible Oracle Database instance (e.g., local Oracle 21c/23c Free or Oracle Cloud Wallet):
1. Copy `.env.example` to `server/.env`:
   ```properties
   PORT=5000
   NODE_ENV=development
   DB_MODE=oracle
   ORACLE_USER=placement_admin
   ORACLE_PASSWORD=YourPassword123
   ORACLE_CONNECT_STRING=localhost:1521/FREEPDB1
   ```
2. Install the native driver in `server`:
   ```powershell
   cd server
   npm install oracledb
   ```
3. Run the SQL scripts in your Oracle schema:
   ```sql
   @College-Placement-Automation/run_all.sql
   ```
4. Restart the backend:
   ```powershell
   npm run dev
   ```

---

## 4. Main Application Features & Verification

All core requirements have been implemented and verified:

1. **Executive Placement Dashboard (`/`)**:
   - Total Students, Registered Recruiter Companies, Active Placement Openings, Overall Placement Rate, Highest LPA, Average LPA.
   - Stage distribution funnel chart (Applied, Shortlisted, Selected, Rejected).
   - Recent recruitment activities timeline.

2. **Student Directory (`/students`)**:
   - Filter by name, email, department, or minimum CGPA.
   - Add new student profile with graduation batch, active backlogs, and multi-skill tags.
   - Placement status indicator badges (`PLACED`, `SEEKING`, `OPTED_OUT`).

3. **Corporate Recruiters (`/companies`)**:
   - Recruiter directory with company name, industry, contact email, and active drive counters.
   - Add/edit recruiter records.

4. **Job Openings & Placement Drives (`/jobs`)**:
   - Job cards displaying Package (LPA), minimum CGPA cutoffs, maximum backlogs, eligible passing years, and mandatory technical skills.
   - In Student Mode: dynamic eligibility diagnosis directly on each card with a 1-click **Apply** button.

5. **Automated Eligibility Checker Workbench (`/eligibility`)**:
   - Select any job drive to evaluate all registered students simultaneously.
   - Executes the 5-point evaluation algorithm from `PLACEMENT_PKG.CHECK_ELIGIBILITY`:
     1. Active Placement Drive status (`is_active = 'Y'`)
     2. CGPA $\ge$ Minimum Required CGPA
     3. Active Backlogs $\le$ Maximum Allowed Backlogs
     4. Student Passing Batch $\in$ Eligible Batches
     5. Student possesses **ALL** Mandatory Prerequisite Skills
   - Displays clear diagnostic reasons for qualified vs. disqualified candidates.

6. **Recruitment Applications Tracker (`/applications`)**:
   - Filter by application status (`APPLIED`, `SHORTLISTED`, `SELECTED`, `REJECTED`, `WITHDRAWN`).
   - Advance candidate stages in compliance with the state machine.
   - **Audit Timeline Modal**: Inspect historical status transitions logged by the automated audit trigger (`changed_at`, `old_status`, `new_status`, `changed_by`).

7. **Placement Analytics & Reports (`/reports`)**:
   - Recruiter breakdown table (Applicants, Shortlisted, Selected).
   - Selection funnel chart.
   - One-click **Export CSV** for report generation.

8. **System Settings & Reset (`/settings`)**:
   - Active database connection details and environment status.
   - 1-click **Reset Demo Data** button to reseed initial sample data anytime.

---

## 5. Project Structure

```text
College-Placement-System/
├── package.json                         # Root launcher & scripts
├── run-dev.js                           # Unified concurrent server + client launcher
├── package-project.js                   # Packaging script to generate clean ZIP
├── test-health.js                       # API integration test suite
├── setup.bat                            # 1-Click Windows dependency installer
├── start.bat                            # 1-Click Windows launcher & browser opener
├── .gitignore                           # Excludes node_modules, build outputs, and secrets
├── .env.example                         # Environment configuration template
├── README.md                            # Complete documentation
│
├── server/                              # Node.js Express Backend
│   ├── .env.example                     # Backend env template
│   ├── .gitignore                       # Backend gitignore
│   ├── tsconfig.json                    # Backend TypeScript config
│   └── src/
│       ├── config/                      # Database pool & environment loader
│       ├── types/                       # Shared TypeScript interfaces & models
│       ├── repositories/                # Database Repository Pattern
│       │   ├── IPlacementRepository.ts  # Contract for all database operations
│       │   ├── DemoPlacementRepository.ts # In-memory PL/SQL engine (FreeSQL default)
│       │   ├── OraclePlacementRepository.ts # Native Oracle PL/SQL driver calls
│       │   └── index.ts                 # Dynamic repository factory
│       ├── routes/                      # REST API routes
│       ├── app.ts                       # Express application setup
│       └── server.ts                    # Backend entrypoint (port 5000)
│
├── client/                              # React + Vite + TypeScript Frontend
│   ├── index.html                       # HTML shell
│   ├── vite.config.ts                   # Vite config with API proxy
│   └── src/
│       ├── components/                  # Common UI components & layouts
│       ├── context/                     # Role switcher & global state context
│       ├── pages/                       # 8 application views
│       ├── services/                    # API service layer
│       ├── types/                       # Frontend types
│       └── App.tsx                      # App root & navigation
│
└── College-Placement-Automation/        # Core Oracle PL/SQL Submission Files
    ├── run_all.sql                      # Master SQL script
    ├── 01_schema.sql                    # DDL: Tables, constraints, indexes
    ├── 02_sample_data.sql               # DML: Realistic student & company data
    ├── 03_package_spec.sql              # PLACEMENT_PKG specification
    ├── 04_package_body.sql              # PLACEMENT_PKG implementation
    ├── 05_triggers.sql                  # Audit & timestamp triggers
    ├── 06_views_and_reports.sql         # Analytical views & reporting queries
    ├── 07_test_cases.sql                # 20 automated PL/SQL test cases
    ├── 08_demo.sql                      # Viva presentation walkthrough script
    └── docs/                            # Project Report, ER Diagram, Viva Q&A
```

---

## 6. How to Share with a Friend (Packaging Instructions)

To package the project so your friend can run it on their Windows laptop:

### Method 1: Use the Included ZIP File
The file **`CampusConnect-Placement-System.zip`** is already generated in the root workspace. It contains all source code, SQL files, batch scripts, and documentation, with `node_modules` and secret files excluded (~187 KB).
Simply send this `.zip` file to your friend via email, Google Drive, or USB drive.

### Method 2: Regenerate the ZIP Anytime
Run the packaging command from the project root:
```powershell
npm run package
```
This automatically compiles the staging directory, excludes all `node_modules`, `.git`, `.env`, and temporary files, and outputs a clean `CampusConnect-Placement-System.zip`.

### What Your Friend Needs to Do:
1. Extract `CampusConnect-Placement-System.zip` to any folder (e.g. `C:\Projects\CampusConnect`).
2. Make sure **Node.js** is installed.
3. Double-click **`setup.bat`** (installs dependencies).
4. Double-click **`start.bat`** (starts the app and opens the browser).

---

## 7. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port 5000 or 5173 is already in use** | Another service or terminal is running on the port. | Kill the process occupying port 5000: `npx kill-port 5000` or port 5173: `npx kill-port 5173`, then re-run `start.bat`. |
| **`node` is not recognized** | Node.js is not installed or not added to your system `PATH`. | Download and run the Node.js installer from [nodejs.org](https://nodejs.org/). Restart your terminal after installing. |
| **PowerShell script execution disabled** | Windows security policy restricts `.ps1` execution. | Open PowerShell as Administrator and run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, or simply use `cmd.exe` / `setup.bat`. |
| **Dependencies fail to install** | Network timeout during `npm install`. | Run `npm cache clean --force` and try running `setup.bat` again. |
| **Browser shows blank screen** | Frontend hasn't finished compiling yet. | Wait 5 seconds and refresh the browser (`Ctrl+F5`). Ensure backend is running at `http://localhost:5000/api/health`. |

---

## 8. Academic Viva Preparation

The `College-Placement-Automation/docs/` directory includes comprehensive academic submission material:
- **`PROJECT_REPORT.md`**: Complete report with introduction, SRS, ER diagram, module descriptions, and conclusion.
- **`ER_DIAGRAM.md`**: Visual Mermaid entity-relationship diagram and complete schema data dictionary.
- **`VIVA_QUESTIONS.md`**: 30 questions and detailed answers covering normalization, PL/SQL packages, triggers, cursor usage, and ACID properties.
- **`08_demo.sql`**: Step-by-step viva presentation script to walk external examiners through schema execution, eligibility checking, and trigger verification.
