# Smart Campus Placement and Eligibility Automation System Using Oracle PL/SQL

An enterprise-grade, database-centric placement automation system implemented natively in **Oracle SQL and PL/SQL**.

---

## 1. Project Overview

The **Smart Campus Placement and Eligibility Automation System** automates the entire recruitment workflow for college placement cells:
- Centralizes student academic records, CGPA, backlogs, and verified technical skills.
- Stores recruiter details and job opening prerequisites in normalized relational tables.
- **Automatic Eligibility Engine**: Evaluates 5 mandatory criteria simultaneously (CGPA cutoffs, backlog thresholds, eligible graduation batches, prerequisite technical skills, and active job status) and provides detailed ineligibility diagnostics.
- **Application State Machine**: Enforces a strict status progression (`APPLIED` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `SELECTED`), preventing unauthorized transitions or skipping stages.
- **Automated Audit Logging**: Uses Oracle database triggers to capture an immutable audit log of all status transitions with timestamps and user identities.
- **Executive Reporting & Analytics**: Delivers placement KPIs, company-wise conversion statistics, and analytical student rankings via database views and window functions.

---

## 2. Key Features

- **Pure Database Architecture**: All business logic resides in PL/SQL (`PLACEMENT_PKG`); no external web framework, ORM, or frontend required.
- **Normalized Relational Design (3NF/BCNF)**: Normalized skill mappings (`STUDENT_SKILLS`, `JOB_REQUIRED_SKILLS`) eliminate comma-separated strings and data anomalies.
- **Duplicate Prevention**: Database-level unique constraint `(student_id, job_id)` prevents double applications.
- **Concurrency Control**: Row-level locking (`SELECT ... FOR UPDATE`) guarantees race-condition-free status updates.
- **Enterprise Error Handling**: Uses custom `RAISE_APPLICATION_ERROR` codes (-20001 to -20010) with informative messages.
- **Autonomous Audit Logging**: Trigger `trg_app_status_audit` records all lifecycle transitions without relying on manual application code.
- **20 Automated Test Cases**: Self-contained regression test suite in `07_test_cases.sql`.

---

## 3. Technology Stack & Requirements

| Component | Specification |
| :--- | :--- |
| **RDBMS** | Oracle Database 19c / 21c / 23c (Express, Free, or Enterprise Edition) |
| **Client / IDE** | Oracle SQL Developer, SQL*Plus, or DBeaver |
| **Language** | Oracle SQL & PL/SQL |
| **Diagrams** | Mermaid Markdown |

---

## 4. File Structure & Manifest

```text
College-Placement-Automation/
│
├── 01_schema.sql             # Table creation, PKs, FKs, CHECK constraints, indexes
├── 02_sample_data.sql        # Realistic sample data (10 students, 5 companies, 8 jobs, 15 apps)
├── 03_package_spec.sql       # PLACEMENT_PKG specification (Public API)
├── 04_package_body.sql       # PLACEMENT_PKG body (Business logic & eligibility engine)
├── 05_triggers.sql           # Audit trail and timestamp database triggers
├── 06_views_and_reports.sql  # 8 reporting views and 3 analytical queries
├── 07_test_cases.sql         # 20 automated test cases with pass/fail tracking
├── 08_demo.sql               # 5-10 minute live viva presentation script
├── run_all.sql               # Master execution script running all files in order
├── README.md                 # Project guide & instructions
│
└── docs/
    ├── PROJECT_REPORT.md     # Full academic project report with placeholders
    ├── ER_DIAGRAM.md         # Mermaid ER diagram and relational data dictionary
    └── VIVA_QUESTIONS.md     # 30 comprehensive viva questions and technical answers
```

---

## 5. Execution Order & Installation Guide

### Option A: Master Execution (One Command)
In Oracle SQL Developer or SQL*Plus, simply run:
```sql
@run_all.sql
```

### Option B: Step-by-Step Manual Execution
Run the scripts in strict numerical dependency order:

1. **`@01_schema.sql`**  
   Drops existing project tables safely and creates all 9 normalized tables, constraints, identity columns, and performance indexes.
2. **`@02_sample_data.sql`**  
   Populates master skills, companies, diverse student profiles, job criteria, skills mappings, and initial applications.
3. **`@03_package_spec.sql`**  
   Compiles the package specification defining custom error codes, procedures, and functions.
4. **`@04_package_body.sql`**  
   Compiles the package body implementing the eligibility engine and application workflow.
5. **`@05_triggers.sql`**  
   Compiles `trg_app_timestamp` and `trg_app_status_audit`.
6. **`@06_views_and_reports.sql`**  
   Creates standard reporting views and analytical queries.
7. **`@07_test_cases.sql`**  
   Executes all 20 automated test cases and outputs a pass/fail summary.
8. **`@08_demo.sql`**  
   Runs the interactive 5–10 minute live viva demonstration.

---

## 6. How to Run in Oracle SQL Developer

1. Launch **Oracle SQL Developer** and connect to your database schema (e.g. `system`, `hr`, or a dedicated user).
2. **Enable DBMS Output**:
   - Go to top menu: `View` $\rightarrow$ `DBMS Output`.
   - In the DBMS Output panel, click the green `+` (Add) icon.
   - Select your active database connection and click **OK**.
3. **Execute Master Script**:
   - Open `run_all.sql` in SQL Developer.
   - Click the **Run Script (F5)** icon (sheet with green play icon).
   - Watch the script create schema objects, load data, and run tests.
4. **Run Live Demo**:
   - Open `08_demo.sql` and press **F5**.
   - Observe the step-by-step output in the Script Output and DBMS Output tabs.

---

## 7. Example Demonstration Walkthrough (`08_demo.sql`)

When `08_demo.sql` runs, it illustrates:
1. **Student Profiles**: Viewing students with aggregated skills via `VW_STUDENT_DIRECTORY`.
2. **Active Drives**: Viewing recruiters and cutoffs via `VW_ACTIVE_JOBS`.
3. **Eligibility PASS**: Evaluating candidate Aarav Sharma (1001) for Google Cloud (201) $\rightarrow$ Returns `[PASS] Candidate satisfies all criteria`.
4. **Eligibility REJECT**: Evaluating candidate Sneha Kulkarni (1010) for Google Cloud $\rightarrow$ Returns detailed diagnostic failure explaining CGPA deficit and missing skills.
5. **Cursor Processing**: `get_eligible_students(204)` retrieves all qualified candidates for TCS DB Developer.
6. **Duplicate Blocking**: Catching `ERR_DUPLICATE_APPLICATION (-20005)` when re-applying.
7. **State Machine & Trigger Audit**: Advancing an application from `SHORTLISTED` to `SELECTED` and querying `APPLICATION_STATUS_HISTORY` to prove the audit trigger fired.
8. **KPI Dashboard**: Viewing total selections, highest package (28.50 LPA), average package, and company breakdowns.

---

## 8. Known Limitations & Future Enhancements

- **Skill Proficiency Levels**: Currently binary (candidate has skill or does not); future releases could include competency scores (Beginner / Intermediate / Expert).
- **Multi-Round Evaluation**: Currently abstracted into the `SHORTLISTED` state; future versions could add separate tables for Aptitude, Technical, and HR rounds.
- **REST APIs & UI**: Can be exposed directly via **Oracle REST Data Services (ORDS)** or connected to Oracle APEX / Next.js without modifying any underlying PL/SQL code.
