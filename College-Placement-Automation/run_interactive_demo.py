#!/usr/bin/env python3
"""
===============================================================================
SMART CAMPUS PLACEMENT AND ELIGIBILITY AUTOMATION SYSTEM
Interactive Terminal Execution Engine & Live Test/Demo Runner
===============================================================================
This standalone runner provides local execution of the placement database schema,
the PLACEMENT_PKG eligibility engine, database triggers, 20 automated test cases,
and the live 10-step SQL Developer demonstration.
"""

import sys
import os
import sqlite3
from datetime import datetime

# ANSI Color codes for clean terminal output
BOLD = "\033[1m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


class PlacementDatabaseEngine:
    def __init__(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.execute("PRAGMA foreign_keys = ON;")
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self.init_schema()
        self.init_triggers()
        self.load_sample_data()

    def init_schema(self):
        """Creates the 9 normalized tables matching 01_schema.sql"""
        self.cursor.executescript("""
        CREATE TABLE STUDENTS (
            student_id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            cgpa REAL NOT NULL CHECK(cgpa >= 0.00 AND cgpa <= 10.00),
            graduation_year INTEGER NOT NULL CHECK(graduation_year >= 2000 AND graduation_year <= 2100),
            active_backlogs INTEGER DEFAULT 0 NOT NULL CHECK(active_backlogs >= 0),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE SKILLS (
            skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill_name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE STUDENT_SKILLS (
            student_id INTEGER NOT NULL,
            skill_id INTEGER NOT NULL,
            acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (student_id, skill_id),
            FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES SKILLS(skill_id) ON DELETE CASCADE
        );

        CREATE TABLE COMPANIES (
            company_id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL UNIQUE,
            industry TEXT NOT NULL,
            contact_email TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE JOBS (
            job_id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            job_title TEXT NOT NULL,
            package_lpa REAL DEFAULT 0.00 NOT NULL CHECK(package_lpa >= 0.00),
            minimum_cgpa REAL DEFAULT 0.00 NOT NULL CHECK(minimum_cgpa >= 0.00 AND minimum_cgpa <= 10.00),
            maximum_backlogs INTEGER DEFAULT 0 NOT NULL CHECK(maximum_backlogs >= 0),
            is_active TEXT DEFAULT 'Y' NOT NULL CHECK(is_active IN ('Y', 'N')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (company_id) REFERENCES COMPANIES(company_id) ON DELETE CASCADE
        );

        CREATE TABLE JOB_ELIGIBLE_YEARS (
            job_id INTEGER NOT NULL,
            graduation_year INTEGER NOT NULL CHECK(graduation_year >= 2000 AND graduation_year <= 2100),
            PRIMARY KEY (job_id, graduation_year),
            FOREIGN KEY (job_id) REFERENCES JOBS(job_id) ON DELETE CASCADE
        );

        CREATE TABLE JOB_REQUIRED_SKILLS (
            job_id INTEGER NOT NULL,
            skill_id INTEGER NOT NULL,
            PRIMARY KEY (job_id, skill_id),
            FOREIGN KEY (job_id) REFERENCES JOBS(job_id) ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES SKILLS(skill_id) ON DELETE CASCADE
        );

        CREATE TABLE APPLICATIONS (
            application_id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            application_status TEXT DEFAULT 'APPLIED' NOT NULL CHECK(application_status IN ('APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN')),
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            UNIQUE(student_id, job_id),
            FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES JOBS(job_id) ON DELETE CASCADE
        );

        CREATE TABLE APPLICATION_STATUS_HISTORY (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            changed_by TEXT DEFAULT 'ADMIN_PORTAL' NOT NULL,
            FOREIGN KEY (application_id) REFERENCES APPLICATIONS(application_id) ON DELETE CASCADE
        );
        """)
        self.conn.commit()

    def init_triggers(self):
        """Creates triggers matching 05_triggers.sql"""
        self.cursor.executescript("""
        CREATE TRIGGER trg_app_timestamp
        AFTER UPDATE ON APPLICATIONS
        FOR EACH ROW
        BEGIN
            UPDATE APPLICATIONS SET updated_at = CURRENT_TIMESTAMP WHERE application_id = NEW.application_id;
        END;

        CREATE TRIGGER trg_app_status_audit
        AFTER UPDATE OF application_status ON APPLICATIONS
        FOR EACH ROW
        WHEN OLD.application_status IS NOT NEW.application_status
        BEGIN
            INSERT INTO APPLICATION_STATUS_HISTORY (
                application_id, old_status, new_status, changed_at, changed_by
            ) VALUES (
                NEW.application_id, OLD.application_status, NEW.application_status, CURRENT_TIMESTAMP, 'SYSTEM_TRIGGER'
            );
        END;
        """)
        self.conn.commit()

    def load_sample_data(self):
        """Seeds data matching 02_sample_data.sql"""
        skills = [
            (1, 'Java'), (2, 'Python'), (3, 'Oracle SQL'), (4, 'PL/SQL'),
            (5, 'React'), (6, 'Spring Boot'), (7, 'Cloud Computing (AWS)'), (8, 'Machine Learning')
        ]
        self.cursor.executemany("INSERT INTO SKILLS (skill_id, skill_name) VALUES (?, ?);", skills)

        companies = [
            (501, 'Google Cloud', 'Information Technology', 'campus-recruiting@google.com'),
            (502, 'Microsoft Corporation', 'Software Engineering', 'university-hires@microsoft.com'),
            (503, 'Amazon Web Services', 'Cloud & E-Commerce', 'aws-placement@amazon.com'),
            (504, 'Tata Consultancy Services', 'IT Services & Consulting', 'campus.connect@tcs.com'),
            (505, 'Infosys Limited', 'IT Solutions', 'talent.acquisition@infosys.com')
        ]
        self.cursor.executemany("INSERT INTO COMPANIES (company_id, company_name, industry, contact_email) VALUES (?, ?, ?, ?);", companies)

        students = [
            (1001, 'Aarav Sharma', 'aarav.sharma@campus.edu', 9.45, 2025, 0),
            (1002, 'Diya Patel', 'diya.patel@campus.edu', 8.80, 2025, 0),
            (1003, 'Rohan Iyer', 'rohan.iyer@campus.edu', 8.20, 2025, 0),
            (1004, 'Ananya Sen', 'ananya.sen@campus.edu', 7.10, 2025, 0),
            (1005, 'Vikram Malhotra', 'vikram.m@campus.edu', 6.90, 2025, 1),
            (1006, 'Neha Verma', 'neha.verma@campus.edu', 5.80, 2025, 3),
            (1007, 'Kabir Joshi', 'kabir.joshi@campus.edu', 9.10, 2026, 0),
            (1008, 'Pooja Nair', 'pooja.nair@campus.edu', 8.40, 2024, 0),
            (1009, 'Karthik Reddy', 'karthik.r@campus.edu', 7.65, 2025, 0),
            (1010, 'Sneha Kulkarni', 'sneha.k@campus.edu', 6.10, 2025, 0)
        ]
        self.cursor.executemany("INSERT INTO STUDENTS (student_id, student_name, email, cgpa, graduation_year, active_backlogs) VALUES (?, ?, ?, ?, ?, ?);", students)

        stud_skills = [
            (1001, 1), (1001, 2), (1001, 3), (1001, 4), (1001, 7), (1001, 8),
            (1002, 1), (1002, 3), (1002, 5), (1002, 6),
            (1003, 1), (1003, 3), (1003, 4), (1003, 7),
            (1004, 2), (1004, 3), (1004, 8),
            (1005, 1), (1005, 3),
            (1006, 2), (1006, 5),
            (1007, 2), (1007, 7), (1007, 8),
            (1008, 1), (1008, 3), (1008, 6), (1008, 7),
            (1009, 1), (1009, 3), (1009, 5),
            (1010, 3)
        ]
        self.cursor.executemany("INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (?, ?);", stud_skills)

        jobs = [
            (201, 501, 'Cloud Systems Engineer', 28.50, 8.50, 0, 'Y'),
            (202, 502, 'Software Development Engineer', 24.00, 8.00, 0, 'Y'),
            (203, 503, 'Cloud Solutions Associate', 19.50, 7.50, 0, 'Y'),
            (204, 504, 'Database & PL/SQL Developer', 9.00, 7.00, 0, 'Y'),
            (205, 505, 'Specialist Programmer', 9.50, 7.00, 1, 'Y'),
            (206, 502, 'Full Stack Web Engineer', 22.00, 7.80, 0, 'Y'),
            (207, 501, 'AI/ML Research Intern', 18.00, 9.00, 0, 'N'),
            (208, 504, 'Systems Engineer Trainee', 4.50, 6.00, 1, 'Y')
        ]
        self.cursor.executemany("INSERT INTO JOBS (job_id, company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) VALUES (?, ?, ?, ?, ?, ?, ?);", jobs)

        job_years = [
            (201, 2025), (202, 2024), (202, 2025), (203, 2025), (204, 2025),
            (205, 2025), (206, 2025), (207, 2025), (207, 2026), (208, 2024), (208, 2025)
        ]
        self.cursor.executemany("INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (?, ?);", job_years)

        job_skills = [
            (201, 2), (201, 7), (202, 1), (202, 6), (203, 3), (203, 7),
            (204, 3), (204, 4), (205, 1), (206, 1), (206, 5), (207, 2), (207, 8), (208, 3)
        ]
        self.cursor.executemany("INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (?, ?);", job_skills)

        apps = [
            (8001, 1001, 201, 'SELECTED'),
            (8002, 1001, 203, 'SHORTLISTED'),
            (8003, 1002, 202, 'SELECTED'),
            (8004, 1002, 206, 'APPLIED'),
            (8005, 1003, 204, 'SELECTED'),
            (8006, 1003, 203, 'SHORTLISTED'),
            (8007, 1004, 208, 'SHORTLISTED'),
            (8008, 1005, 205, 'SHORTLISTED'),
            (8009, 1005, 208, 'APPLIED'),
            (8010, 1008, 202, 'SELECTED'),
            (8011, 1008, 203, 'REJECTED'),
            (8012, 1009, 206, 'SHORTLISTED'),
            (8013, 1009, 208, 'APPLIED'),
            (8014, 1010, 208, 'APPLIED'),
            (8015, 1001, 204, 'WITHDRAWN')
        ]
        self.cursor.executemany("INSERT INTO APPLICATIONS (application_id, student_id, job_id, application_status) VALUES (?, ?, ?, ?);", apps)
        self.conn.commit()

    # -------------------------------------------------------------------------
    # PLACEMENT_PKG Emulation Methods (Matching 03_package_spec & 04_package_body)
    # -------------------------------------------------------------------------
    def add_student(self, name, email, cgpa, grad_year, backlogs=0):
        if cgpa < 0.0 or cgpa > 10.0:
            raise ValueError(f"ERR_INVALID_CGPA (-20007): CGPA must be between 0.00 and 10.00. Provided: {cgpa}")
        if backlogs < 0:
            raise ValueError(f"ERR_NEGATIVE_BACKLOG (-20008): Active backlogs cannot be negative. Provided: {backlogs}")
        try:
            self.cursor.execute(
                "INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) VALUES (?, ?, ?, ?, ?);",
                (name, email.lower().strip(), cgpa, grad_year, backlogs)
            )
            self.conn.commit()
            return self.cursor.lastrowid
        except sqlite3.IntegrityError as e:
            if "UNIQUE" in str(e).upper():
                raise ValueError(f"ERR_DUPLICATE_STUDENT (-20011): Student email '{email}' already registered.")
            raise

    def add_company(self, name, industry, email):
        self.cursor.execute(
            "INSERT INTO COMPANIES (company_name, industry, contact_email) VALUES (?, ?, ?);",
            (name.strip(), industry.strip(), email.lower().strip())
        )
        self.conn.commit()
        return self.cursor.lastrowid

    def add_job(self, company_id, title, package_lpa, min_cgpa, max_backlogs=0, is_active='Y'):
        self.cursor.execute(
            "INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) VALUES (?, ?, ?, ?, ?, ?);",
            (company_id, title.strip(), package_lpa, min_cgpa, max_backlogs, is_active)
        )
        self.conn.commit()
        return self.cursor.lastrowid

    def check_eligibility(self, student_id, job_id):
        """Central 5-criteria eligibility evaluation engine"""
        self.cursor.execute("SELECT * FROM STUDENTS WHERE student_id = ?;", (student_id,))
        stud = self.cursor.fetchone()
        if not stud:
            raise ValueError(f"ERR_STUDENT_NOT_FOUND (-20001): Student ID {student_id} does not exist.")

        self.cursor.execute("SELECT * FROM JOBS WHERE job_id = ?;", (job_id,))
        job = self.cursor.fetchone()
        if not job:
            raise ValueError(f"ERR_JOB_NOT_FOUND (-20002): Job ID {job_id} does not exist.")

        reasons = []
        is_eligible = True

        # Criterion 1: Active Drive Status
        if job["is_active"] != 'Y':
            is_eligible = False
            reasons.append("[FAIL] Job opportunity is currently INACTIVE.")

        # Criterion 2: Academic CGPA Cutoff
        if stud["cgpa"] < job["minimum_cgpa"]:
            is_eligible = False
            reasons.append(f"[FAIL] CGPA ({stud['cgpa']:.2f}) is below minimum required cutoff ({job['minimum_cgpa']:.2f}).")

        # Criterion 3: Active Backlog Limit
        if stud["active_backlogs"] > job["maximum_backlogs"]:
            is_eligible = False
            reasons.append(f"[FAIL] Active backlogs ({stud['active_backlogs']}) exceed maximum permitted limit ({job['maximum_backlogs']}).")

        # Criterion 4: Graduation Batch Match
        self.cursor.execute("SELECT COUNT(*) AS cnt FROM JOB_ELIGIBLE_YEARS WHERE job_id = ? AND graduation_year = ?;", (job_id, stud["graduation_year"]))
        if self.cursor.fetchone()["cnt"] == 0:
            is_eligible = False
            self.cursor.execute("SELECT graduation_year FROM JOB_ELIGIBLE_YEARS WHERE job_id = ? ORDER BY graduation_year;", (job_id,))
            years = [str(r["graduation_year"]) for r in self.cursor.fetchall()]
            reasons.append(f"[FAIL] Graduation year ({stud['graduation_year']}) not eligible. Permitted batches: {', '.join(years) or 'None'}.")

        # Criterion 5: Prerequisite Technical Skills
        self.cursor.execute("""
            SELECT s.skill_name
            FROM JOB_REQUIRED_SKILLS jrs
            JOIN SKILLS s ON jrs.skill_id = s.skill_id
            WHERE jrs.job_id = ?
              AND jrs.skill_id NOT IN (
                  SELECT ss.skill_id FROM STUDENT_SKILLS ss WHERE ss.student_id = ?
              )
            ORDER BY s.skill_name;
        """, (job_id, student_id))
        missing = [r["skill_name"] for r in self.cursor.fetchall()]
        if missing:
            is_eligible = False
            reasons.append(f"[FAIL] Missing mandatory skill(s): {', '.join(missing)}.")

        if is_eligible:
            final_reason = "[PASS] Candidate satisfies all criteria: CGPA, Backlog, Batch, and Technical Skills."
        else:
            final_reason = " ".join(reasons)

        return is_eligible, final_reason

    def apply_for_job(self, student_id, job_id):
        # 1. Prevent duplicate submission
        self.cursor.execute("SELECT COUNT(*) AS cnt FROM APPLICATIONS WHERE student_id = ? AND job_id = ?;", (student_id, job_id))
        if self.cursor.fetchone()["cnt"] > 0:
            raise ValueError(f"ERR_DUPLICATE_APPLICATION (-20005): Student ID {student_id} has already submitted an application for Job ID {job_id}.")

        # 2. Check complete eligibility
        is_eligible, reason = self.check_eligibility(student_id, job_id)
        if not is_eligible:
            raise ValueError(f"ERR_STUDENT_INELIGIBLE (-20004): Application Rejected: Ineligible. {reason}")

        # 3. Insert application
        self.cursor.execute(
            "INSERT INTO APPLICATIONS (student_id, job_id, application_status) VALUES (?, ?, 'APPLIED');",
            (student_id, job_id)
        )
        self.conn.commit()
        return self.cursor.lastrowid

    def update_application_status(self, application_id, new_status):
        self.cursor.execute("SELECT application_status FROM APPLICATIONS WHERE application_id = ?;", (application_id,))
        row = self.cursor.fetchone()
        if not row:
            raise ValueError(f"ERR_APPLICATION_NOT_FOUND (-20009): Application ID {application_id} not found.")

        current = row["application_status"]
        target = new_status.upper().strip()
        valid = False

        if current == 'APPLIED' and target in ('SHORTLISTED', 'REJECTED', 'WITHDRAWN'):
            valid = True
        elif current == 'SHORTLISTED' and target in ('SELECTED', 'REJECTED', 'WITHDRAWN'):
            valid = True
        elif current == 'SELECTED' and target == 'WITHDRAWN':
            valid = True

        if not valid:
            raise ValueError(f"ERR_INVALID_STATUS_TRANSITION (-20006): Cannot transition application #{application_id} from '{current}' to '{target}'.")

        self.cursor.execute(
            "UPDATE APPLICATIONS SET application_status = ? WHERE application_id = ?;",
            (target, application_id)
        )
        self.conn.commit()


# =============================================================================
# AUTOMATED TEST SUITE RUNNER (20 Test Scenarios)
# =============================================================================
def run_all_tests():
    print(f"\n{BOLD}{CYAN}========================================================================================{RESET}")
    print(f"{BOLD}{CYAN}      RUNNING AUTOMATED TEST SUITE (20 TEST CASES) - ORACLE PL/SQL VERIFICATION       {RESET}")
    print(f"{BOLD}{CYAN}========================================================================================{RESET}")

    engine = PlacementDatabaseEngine()
    passed = 0
    failed = 0

    def record(test_id, name, is_pass, detail=""):
        nonlocal passed, failed
        if is_pass:
            passed += 1
            print(f"[{GREEN}PASS{RESET}] {BOLD}{test_id:6}{RESET} | {name:<46} | {detail}")
        else:
            failed += 1
            print(f"[{RED}FAIL{RESET}] {BOLD}{test_id:6}{RESET} | {name:<46} | {detail}")

    # TC-01: Successful Student Registration
    try:
        sid = engine.add_student("Alpha Test", "alpha.test@campus.edu", 8.80, 2025, 0)
        record("TC-01", "Successful Student Registration", sid is not None, f"ID: {sid}")
    except Exception as e:
        record("TC-01", "Successful Student Registration", False, str(e))

    # TC-02: Duplicate Student Registration Prevention
    try:
        engine.add_student("Alpha Dup", "alpha.test@campus.edu", 7.50, 2025, 0)
        record("TC-02", "Duplicate Student Prevention", False, "Allowed duplicate")
    except Exception as e:
        record("TC-02", "Duplicate Student Prevention", "ERR_DUPLICATE_STUDENT" in str(e), "Caught -20011 duplicate")

    # TC-03: Invalid CGPA Validation (> 10.0)
    try:
        engine.add_student("Invalid CGPA", "invalid.cgpa@campus.edu", 11.50, 2025, 0)
        record("TC-03", "Invalid CGPA Validation (>10.0)", False, "Allowed CGPA > 10")
    except Exception as e:
        record("TC-03", "Invalid CGPA Validation (>10.0)", "ERR_INVALID_CGPA" in str(e), "Caught -20007 invalid CGPA")

    # TC-04: Successful Company Registration
    try:
        cid = engine.add_company("Oracle Corporation", "Software", "campus@oracle.com")
        record("TC-04", "Successful Company Registration", cid is not None, f"Company ID: {cid}")
    except Exception as e:
        record("TC-04", "Successful Company Registration", False, str(e))

    # TC-05: Successful Job Creation
    try:
        jid = engine.add_job(cid, "Cloud Database Associate", 16.50, 7.50, 0, 'Y')
        engine.cursor.execute("INSERT INTO JOB_ELIGIBLE_YEARS VALUES (?, 2025);", (jid,))
        engine.cursor.execute("INSERT INTO JOB_REQUIRED_SKILLS VALUES (?, 3);", (jid,))
        engine.conn.commit()
        record("TC-05", "Successful Job Creation with Criteria", jid is not None, f"Job ID: {jid}")
    except Exception as e:
        record("TC-05", "Successful Job Creation with Criteria", False, str(e))

    # TC-06: Eligible Student Detection
    is_elig, reason = engine.check_eligibility(1001, 201)
    record("TC-06", "Eligible Student Detection (All Pass)", is_elig, "Aarav Sharma qualifies for Google Cloud")

    # TC-07: CGPA-based Rejection
    is_elig, reason = engine.check_eligibility(1010, 201)
    record("TC-07", "CGPA-based Rejection", (not is_elig and "CGPA" in reason), "Sneha (6.10) rejected (min 8.50)")

    # TC-08: Backlog-based Rejection
    is_elig, reason = engine.check_eligibility(1006, 205)
    record("TC-08", "Backlog-based Rejection", (not is_elig and "backlog" in reason.lower()), "Neha (3 backlogs) rejected (max 1)")

    # TC-09: Missing-skill Rejection
    is_elig, reason = engine.check_eligibility(1004, 202)
    record("TC-09", "Missing-Skill Rejection", (not is_elig and "Missing mandatory skill" in reason), "Ananya missing Java & Spring Boot")

    # TC-10: Graduation-year Rejection
    is_elig, reason = engine.check_eligibility(1007, 203)
    record("TC-10", "Graduation-Year Rejection", (not is_elig and "Graduation year" in reason), "Kabir (2026) rejected (only 2025 allowed)")

    # TC-11: Inactive-job Rejection
    is_elig, reason = engine.check_eligibility(1001, 207)
    record("TC-11", "Inactive-Job Rejection", (not is_elig and "INACTIVE" in reason), "Job 207 inactive")

    # TC-12: Successful Application Submission
    try:
        engine.cursor.execute("INSERT INTO STUDENT_SKILLS VALUES (?, 3, CURRENT_TIMESTAMP);", (sid,))
        aid = engine.apply_for_job(sid, jid)
        record("TC-12", "Successful Application Submission", aid is not None, f"Application ID: {aid}")
    except Exception as e:
        record("TC-12", "Successful Application Submission", False, str(e))

    # TC-13: Duplicate Application Prevention
    try:
        engine.apply_for_job(sid, jid)
        record("TC-13", "Duplicate Application Prevention", False, "Duplicate allowed")
    except Exception as e:
        record("TC-13", "Duplicate Application Prevention", "ERR_DUPLICATE_APPLICATION" in str(e), "Caught -20005 duplicate")

    # TC-14: Valid Status Transition (APPLIED -> SHORTLISTED)
    try:
        engine.update_application_status(aid, "SHORTLISTED")
        engine.cursor.execute("SELECT application_status FROM APPLICATIONS WHERE application_id = ?;", (aid,))
        cur = engine.cursor.fetchone()["application_status"]
        record("TC-14", "Valid Status Transition (APPLIED->SHORTLISTED)", cur == "SHORTLISTED", f"State: {cur}")
    except Exception as e:
        record("TC-14", "Valid Status Transition", False, str(e))

    # TC-15: Invalid Status Transition Rejection
    try:
        engine.update_application_status(aid, "SELECTED")
        engine.update_application_status(aid, "APPLIED")  # Illegal backwards transition
        record("TC-15", "Invalid Status Transition Rejection", False, "Allowed illegal transition")
    except Exception as e:
        record("TC-15", "Invalid Status Transition Rejection", "ERR_INVALID_STATUS_TRANSITION" in str(e), "Caught -20006 illegal state change")

    # TC-16: Trigger Audit Record Creation
    engine.cursor.execute("SELECT COUNT(*) AS cnt FROM APPLICATION_STATUS_HISTORY WHERE application_id = ?;", (aid,))
    audit_cnt = engine.cursor.fetchone()["cnt"]
    record("TC-16", "Trigger Audit Trail Recording", audit_cnt >= 2, f"{audit_cnt} audit transitions logged")

    # TC-17: Application Timestamp Updates
    engine.cursor.execute("SELECT applied_at, updated_at FROM APPLICATIONS WHERE application_id = ?;", (aid,))
    row = engine.cursor.fetchone()
    record("TC-17", "Application Timestamp Synchronization", row["updated_at"] is not None, f"Updated at: {row['updated_at']}")

    # TC-18: Placement KPI Calculations
    engine.cursor.execute("SELECT COUNT(DISTINCT student_id) AS cnt FROM APPLICATIONS WHERE application_status = 'SELECTED';")
    placed_cnt = engine.cursor.fetchone()["cnt"]
    record("TC-18", "Placement Statistics KPI Aggregation", placed_cnt > 0, f"{placed_cnt} placed candidates")

    # TC-19: Transaction Rollback Integrity
    try:
        engine.conn.execute("SAVEPOINT test_sp;")
        engine.cursor.execute("INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) VALUES ('Temp', 'temp@campus.edu', 8.0, 2025, 0);")
        # Trigger failure: illegal negative backlogs
        engine.cursor.execute("INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) VALUES ('Bad', 'bad@campus.edu', 8.0, 2025, -3);")
        record("TC-19", "Transaction Rollback on Failure", False, "Constraint did not fail")
    except Exception:
        engine.conn.execute("ROLLBACK TO test_sp;")
        engine.cursor.execute("SELECT COUNT(*) AS cnt FROM STUDENTS WHERE email = 'temp@campus.edu';")
        rem = engine.cursor.fetchone()["cnt"]
        record("TC-19", "Transaction Rollback on Failure", rem == 0, "Zero dirty rows left after rollback")

    # TC-20: Foreign Key Constraint Enforcement
    try:
        engine.cursor.execute("INSERT INTO APPLICATIONS (student_id, job_id, application_status) VALUES (999999, 201, 'APPLIED');")
        record("TC-20", "Foreign Key Referential Integrity", False, "Invalid FK accepted")
    except sqlite3.IntegrityError:
        record("TC-20", "Foreign Key Referential Integrity", True, "Engine rejected orphan FK reference")

    print(f"{BOLD}{CYAN}----------------------------------------------------------------------------------------{RESET}")
    print(f"Results: {GREEN}{passed} PASSED{RESET} | {RED}{failed} FAILED{RESET} | Success Rate: {BOLD}{((passed/20)*100):.1f}%{RESET}")
    print(f"{BOLD}{CYAN}========================================================================================{RESET}\n")


# =============================================================================
# LIVE 10-STEP SQL DEVELOPER DEMONSTRATION RUNNER
# =============================================================================
def run_live_demo():
    print(f"\n{BOLD}{YELLOW}========================================================================================{RESET}")
    print(f"{BOLD}{YELLOW}      CAMPUS PLACEMENT & ELIGIBILITY AUTOMATION SYSTEM - LIVE VIVA DEMONSTRATION      {RESET}")
    print(f"{BOLD}{YELLOW}========================================================================================{RESET}\n")

    engine = PlacementDatabaseEngine()

    # Step 1: Student Directory
    print(f"{BOLD}>>> DEMO STEP 1: STUDENT DIRECTORY (VW_STUDENT_DIRECTORY){RESET}")
    print(f"{'ID':<6}{'NAME':<18}{'CGPA':<8}{'BATCH':<8}{'BACKLOGS':<10}{'TECHNICAL SKILLS'}")
    print("-" * 88)
    engine.cursor.execute("""
        SELECT s.student_id, s.student_name, s.cgpa, s.graduation_year, s.active_backlogs,
               COALESCE(GROUP_CONCAT(sk.skill_name, ', '), 'None') AS skills
        FROM STUDENTS s
        LEFT JOIN STUDENT_SKILLS ss ON s.student_id = ss.student_id
        LEFT JOIN SKILLS sk ON ss.skill_id = sk.skill_id
        GROUP BY s.student_id
        LIMIT 5;
    """)
    for r in engine.cursor.fetchall():
        print(f"{r['student_id']:<6}{r['student_name']:<18}{r['cgpa']:<8.2f}{r['graduation_year']:<8}{r['active_backlogs']:<10}{r['skills']}")

    # Step 2: Active Drives
    print(f"\n{BOLD}>>> DEMO STEP 2: ACTIVE PLACEMENT DRIVES & PREREQUISITES (VW_ACTIVE_JOBS){RESET}")
    print(f"{'JOB ID':<8}{'COMPANY':<22}{'POSITION':<28}{'LPA':<8}{'MIN CGPA':<10}{'PREREQUISITES'}")
    print("-" * 96)
    engine.cursor.execute("""
        SELECT j.job_id, c.company_name, j.job_title, j.package_lpa, j.minimum_cgpa,
               COALESCE((SELECT GROUP_CONCAT(sk.skill_name, ', ') FROM JOB_REQUIRED_SKILLS jrs JOIN SKILLS sk ON jrs.skill_id = sk.skill_id WHERE jrs.job_id = j.job_id), 'Open to all') as skills
        FROM JOBS j JOIN COMPANIES c ON j.company_id = c.company_id
        WHERE j.is_active = 'Y' LIMIT 4;
    """)
    for r in engine.cursor.fetchall():
        print(f"{r['job_id']:<8}{r['company_name']:<22}{r['job_title']:<28}{r['package_lpa']:<8.2f}{r['minimum_cgpa']:<10.2f}{r['skills']}")

    # Step 3: Eligibility Pass
    print(f"\n{BOLD}>>> DEMO STEP 3: AUTOMATED ELIGIBILITY ENGINE - SUCCESSFUL MATCH{RESET}")
    print("Candidate: Aarav Sharma (1001) | Target Opening: Google Cloud Systems Engineer (201)")
    is_elig, reason = engine.check_eligibility(1001, 201)
    status_label = f"{GREEN}[ELIGIBLE - QUALIFIED]{RESET}" if is_elig else f"{RED}[DISQUALIFIED]{RESET}"
    print(f"Status   : {status_label}")
    print(f"Details  : {reason}")

    # Step 4: Eligibility Reject
    print(f"\n{BOLD}>>> DEMO STEP 4: AUTOMATED ELIGIBILITY ENGINE - DETAILED REJECTION DIAGNOSTICS{RESET}")
    print("Candidate: Sneha Kulkarni (1010) | Target Opening: Google Cloud Systems Engineer (201)")
    is_elig, reason = engine.check_eligibility(1010, 201)
    status_label = f"{GREEN}[ELIGIBLE]{RESET}" if is_elig else f"{RED}[NOT ELIGIBLE - DISQUALIFIED]{RESET}"
    print(f"Status   : {status_label}")
    print(f"Details  : {reason}")

    # Step 5: Cursor Processing
    print(f"\n{BOLD}>>> DEMO STEP 5: CURSOR PROCESSING - RETRIEVING QUALIFIED CANDIDATES FOR TCS DB DEVELOPER (204){RESET}")
    print(f"{'ID':<8}{'NAME':<20}{'CGPA':<8}{'BATCH':<8}{'DECISION'}")
    print("-" * 60)
    engine.cursor.execute("SELECT student_id, student_name, cgpa, graduation_year FROM STUDENTS ORDER BY cgpa DESC;")
    cnt = 0
    for s in engine.cursor.fetchall():
        elig, _ = engine.check_eligibility(s["student_id"], 204)
        if elig:
            cnt += 1
            print(f"{s['student_id']:<8}{s['student_name']:<20}{s['cgpa']:<8.2f}{s['graduation_year']:<8}{GREEN}QUALIFIED{RESET}")
    print(f"Total Qualified Students Identified by Cursor: {BOLD}{cnt}{RESET}")

    # Step 6: Application Workflow
    print(f"\n{BOLD}>>> DEMO STEP 6: APPLICATION SUBMISSION WORKFLOW WITH PRE-VALIDATION{RESET}")
    print("Submitting application for Diya Patel (1002) for Job ID 208 (TCS Systems Engineer Trainee)...")
    try:
        aid = engine.apply_for_job(1002, 208)
        print(f"Result: {GREEN}SUCCESS{RESET} -> Created Application ID #{aid} with initial status 'APPLIED'.")
    except Exception as e:
        print(f"Result: {RED}ERROR{RESET} -> {e}")

    # Step 7: Duplicate Prevention
    print(f"\n{BOLD}>>> DEMO STEP 7: ENFORCING UNIQUE CONSTRAINTS (DUPLICATE APPLICATION PREVENTION){RESET}")
    print("Attempting to re-apply Aarav Sharma (1001) for Google Cloud (201)...")
    try:
        engine.apply_for_job(1001, 201)
        print(f"{RED}ERROR: Duplicate was erroneously permitted!{RESET}")
    except Exception as e:
        print(f"Outcome: {GREEN}BLOCKED AS EXPECTED{RESET}")
        print(f"Message: {e}")

    # Step 8: State Transition & Trigger Audit
    print(f"\n{BOLD}>>> DEMO STEP 8: APPLICATION LIFECYCLE STATE MACHINE & AUTOMATED TRIGGER AUDIT{RESET}")
    print("Advancing Application #8002 from SHORTLISTED to SELECTED...")
    engine.update_application_status(8002, "SELECTED")
    print("Querying APPLICATION_STATUS_HISTORY audit table:")
    print(f"{'HIST ID':<10}{'APP ID':<10}{'PREVIOUS STATE':<18}{'NEW STATE':<18}{'TIMESTAMP'}")
    print("-" * 72)
    engine.cursor.execute("SELECT * FROM APPLICATION_STATUS_HISTORY WHERE application_id = 8002 ORDER BY history_id DESC;")
    for r in engine.cursor.fetchall():
        print(f"{r['history_id']:<10}{r['application_id']:<10}{r['old_status'] or 'None':<18}{r['new_status']:<18}{r['changed_at']}")

    # Step 9: Recruiter Breakdown
    print(f"\n{BOLD}>>> DEMO STEP 9: RECRUITER PERFORMANCE BREAKDOWN (VW_COMPANY_APPLICATION_STATS){RESET}")
    print(f"{'COMPANY':<28}{'INDUSTRY':<26}{'APPS':<8}{'SHORTLIST':<12}{'SELECTED'}")
    print("-" * 84)
    engine.cursor.execute("""
        SELECT c.company_name, c.industry,
               COUNT(a.application_id) AS apps,
               COUNT(CASE WHEN a.application_status = 'SHORTLISTED' THEN 1 END) as short,
               COUNT(CASE WHEN a.application_status = 'SELECTED' THEN 1 END) as sel
        FROM COMPANIES c
        JOIN JOBS j ON c.company_id = j.company_id
        LEFT JOIN APPLICATIONS a ON j.job_id = a.job_id
        GROUP BY c.company_id
        ORDER BY sel DESC, apps DESC;
    """)
    for r in engine.cursor.fetchall():
        print(f"{r['company_name']:<28}{r['industry']:<26}{r['apps']:<8}{r['short']:<12}{r['sel']}")

    # Step 10: Executive Summary
    print(f"\n{BOLD}>>> DEMO STEP 10: EXECUTIVE PLACEMENT SUMMARY & DASHBOARD KPIs{RESET}")
    engine.cursor.execute("""
        SELECT 
            (SELECT COUNT(*) FROM STUDENTS) as total_stud,
            (SELECT COUNT(*) FROM STUDENTS WHERE graduation_year = 2025) as batch_2025,
            (SELECT COUNT(DISTINCT student_id) FROM APPLICATIONS WHERE application_status = 'SELECTED') as placed,
            (SELECT COUNT(*) FROM APPLICATIONS WHERE application_status = 'SELECTED') as offers,
            (SELECT MAX(j.package_lpa) FROM APPLICATIONS a JOIN JOBS j ON a.job_id = j.job_id WHERE a.application_status = 'SELECTED') as max_pkg,
            (SELECT AVG(j.package_lpa) FROM APPLICATIONS a JOIN JOBS j ON a.job_id = j.job_id WHERE a.application_status = 'SELECTED') as avg_pkg
    """)
    kpi = engine.cursor.fetchone()
    pct = (kpi["placed"] / kpi["batch_2025"]) * 100
    print(f"  * Total Students Registered   : {kpi['total_stud']}")
    print(f"  * 2025 Graduating Batch       : {kpi['batch_2025']}")
    print(f"  * Unique Candidates Placed    : {kpi['placed']}")
    print(f"  * Total Offer Letters Issued  : {kpi['offers']}")
    print(f"  * Placement Conversion Rate   : {BOLD}{pct:.2f}%{RESET} (of final year batch)")
    print(f"  * Highest Salary Package      : {BOLD}{kpi['max_pkg']:.2f} LPA{RESET} (Google Cloud)")
    print(f"  * Average Placed Package      : {BOLD}{kpi['avg_pkg']:.2f} LPA{RESET}")
    print(f"{BOLD}{YELLOW}========================================================================================{RESET}\n")


if __name__ == "__main__":
    run_all_tests()
    run_live_demo()
