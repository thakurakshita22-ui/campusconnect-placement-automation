-- ============================================================================
-- SCRIPT: 01_schema.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: Drop and recreate relational tables, constraints, sequences/identities,
--          and performance indexes in correct dependency order.
-- RDBMS: Oracle Database 19c / 21c / 23c (Compatible with Oracle 12c+)
-- ============================================================================

-- Disable substitution variables & configure session
SET DEFINE OFF;
SET FEEDBACK ON;

PROMPT ============================================================================
PROMPT STEP 1: CLEANING UP EXISTING OBJECTS (SAFE DROP)
PROMPT ============================================================================

BEGIN
    -- Drop tables with foreign keys first or drop using CASCADE CONSTRAINTS
    FOR rec IN (
        SELECT table_name 
        FROM user_tables 
        WHERE table_name IN (
            'APPLICATION_STATUS_HISTORY',
            'APPLICATIONS',
            'JOB_REQUIRED_SKILLS',
            'JOB_ELIGIBLE_YEARS',
            'JOBS',
            'STUDENT_SKILLS',
            'COMPANIES',
            'SKILLS',
            'STUDENTS'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || rec.table_name || ' CASCADE CONSTRAINTS PURGE';
        DBMS_OUTPUT.PUT_LINE('Dropped table: ' || rec.table_name);
    END LOOP;
END;
/

PROMPT ============================================================================
PROMPT STEP 2: CREATING CORE TABLES
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: STUDENTS
-- Stores candidate personal, academic, and backlog information.
-- ----------------------------------------------------------------------------
PROMPT Creating table: STUDENTS...
CREATE TABLE STUDENTS (
    student_id          NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 1001 INCREMENT BY 1),
    student_name        VARCHAR2(100)       NOT NULL,
    email               VARCHAR2(100)       NOT NULL,
    cgpa                NUMBER(3, 2)        NOT NULL,
    graduation_year     NUMBER(4)           NOT NULL,
    active_backlogs     NUMBER(2) DEFAULT 0 NOT NULL,
    created_at          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    
    CONSTRAINT pk_students PRIMARY KEY (student_id),
    CONSTRAINT uq_students_email UNIQUE (email),
    CONSTRAINT chk_students_cgpa CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    CONSTRAINT chk_students_grad_year CHECK (graduation_year >= 2000 AND graduation_year <= 2100),
    CONSTRAINT chk_students_backlogs CHECK (active_backlogs >= 0)
);

COMMENT ON TABLE STUDENTS IS 'Stores student academic profiles, CGPA, backlogs, and graduation year.';
COMMENT ON COLUMN STUDENTS.student_id IS 'Primary key; auto-generated student identity number starting at 1001.';
COMMENT ON COLUMN STUDENTS.cgpa IS 'Cumulative Grade Point Average on a 10.0 scale (0.00 to 10.00).';
COMMENT ON COLUMN STUDENTS.active_backlogs IS 'Count of currently pending backlogs (must be non-negative).';

-- ----------------------------------------------------------------------------
-- TABLE: SKILLS
-- Master catalogue of technical proficiencies (e.g., Java, SQL, Python).
-- ----------------------------------------------------------------------------
PROMPT Creating table: SKILLS...
CREATE TABLE SKILLS (
    skill_id            NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
    skill_name          VARCHAR2(50)        NOT NULL,
    
    CONSTRAINT pk_skills PRIMARY KEY (skill_id),
    CONSTRAINT uq_skills_name UNIQUE (skill_name)
);

COMMENT ON TABLE SKILLS IS 'Master table of technical skills and certifications.';

-- ----------------------------------------------------------------------------
-- TABLE: STUDENT_SKILLS
-- Normalized association between students and their acquired technical skills.
-- ----------------------------------------------------------------------------
PROMPT Creating table: STUDENT_SKILLS...
CREATE TABLE STUDENT_SKILLS (
    student_id          NUMBER              NOT NULL,
    skill_id            NUMBER              NOT NULL,
    acquired_at         TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    
    CONSTRAINT pk_student_skills PRIMARY KEY (student_id, skill_id),
    CONSTRAINT fk_studskills_student FOREIGN KEY (student_id) 
        REFERENCES STUDENTS (student_id) ON DELETE CASCADE,
    CONSTRAINT fk_studskills_skill FOREIGN KEY (skill_id) 
        REFERENCES SKILLS (skill_id) ON DELETE CASCADE
);

COMMENT ON TABLE STUDENT_SKILLS IS 'Intersection table linking students to acquired technical skills.';

-- ----------------------------------------------------------------------------
-- TABLE: COMPANIES
-- Stores employer and recruiter organizational records.
-- ----------------------------------------------------------------------------
PROMPT Creating table: COMPANIES...
CREATE TABLE COMPANIES (
    company_id          NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 501 INCREMENT BY 1),
    company_name        VARCHAR2(100)       NOT NULL,
    industry            VARCHAR2(50)        NOT NULL,
    contact_email       VARCHAR2(100)       NOT NULL,
    created_at          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    
    CONSTRAINT pk_companies PRIMARY KEY (company_id),
    CONSTRAINT uq_companies_name UNIQUE (company_name),
    CONSTRAINT uq_companies_email UNIQUE (contact_email)
);

COMMENT ON TABLE COMPANIES IS 'Registered recruiting companies and industry classifications.';

-- ----------------------------------------------------------------------------
-- TABLE: JOBS
-- Stores recruitment openings posted by companies with base cutoffs.
-- ----------------------------------------------------------------------------
PROMPT Creating table: JOBS...
CREATE TABLE JOBS (
    job_id              NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 201 INCREMENT BY 1),
    company_id          NUMBER              NOT NULL,
    job_title           VARCHAR2(100)       NOT NULL,
    package_lpa         NUMBER(4, 2)        DEFAULT 0.00 NOT NULL,
    minimum_cgpa        NUMBER(3, 2)        DEFAULT 0.00 NOT NULL,
    maximum_backlogs    NUMBER(2) DEFAULT 0 NOT NULL,
    is_active           CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    
    CONSTRAINT pk_jobs PRIMARY KEY (job_id),
    CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) 
        REFERENCES COMPANIES (company_id) ON DELETE CASCADE,
    CONSTRAINT chk_jobs_min_cgpa CHECK (minimum_cgpa >= 0.00 AND minimum_cgpa <= 10.00),
    CONSTRAINT chk_jobs_max_backlogs CHECK (maximum_backlogs >= 0),
    CONSTRAINT chk_jobs_is_active CHECK (is_active IN ('Y', 'N')),
    CONSTRAINT chk_jobs_package CHECK (package_lpa >= 0.00)
);

COMMENT ON TABLE JOBS IS 'Placement drives/job openings posted by registered companies.';
COMMENT ON COLUMN JOBS.is_active IS 'Flag Y/N indicating if the drive is open for student applications.';

-- ----------------------------------------------------------------------------
-- TABLE: JOB_ELIGIBLE_YEARS
-- Normalized table defining one or more passing-out batches eligible for a job.
-- ----------------------------------------------------------------------------
PROMPT Creating table: JOB_ELIGIBLE_YEARS...
CREATE TABLE JOB_ELIGIBLE_YEARS (
    job_id              NUMBER              NOT NULL,
    graduation_year     NUMBER(4)           NOT NULL,
    
    CONSTRAINT pk_job_eligible_years PRIMARY KEY (job_id, graduation_year),
    CONSTRAINT fk_jobyears_job FOREIGN KEY (job_id) 
        REFERENCES JOBS (job_id) ON DELETE CASCADE,
    CONSTRAINT chk_jobyears_year CHECK (graduation_year >= 2000 AND graduation_year <= 2100)
);

COMMENT ON TABLE JOB_ELIGIBLE_YEARS IS 'Permitted graduation passing-out batches for a specific job.';

-- ----------------------------------------------------------------------------
-- TABLE: JOB_REQUIRED_SKILLS
-- Normalized table defining mandatory skills required to apply for a job.
-- ----------------------------------------------------------------------------
PROMPT Creating table: JOB_REQUIRED_SKILLS...
CREATE TABLE JOB_REQUIRED_SKILLS (
    job_id              NUMBER              NOT NULL,
    skill_id            NUMBER              NOT NULL,
    
    CONSTRAINT pk_job_required_skills PRIMARY KEY (job_id, skill_id),
    CONSTRAINT fk_jobskills_job FOREIGN KEY (job_id) 
        REFERENCES JOBS (job_id) ON DELETE CASCADE,
    CONSTRAINT fk_jobskills_skill FOREIGN KEY (skill_id) 
        REFERENCES SKILLS (skill_id) ON DELETE CASCADE
);

COMMENT ON TABLE JOB_REQUIRED_SKILLS IS 'Mandatory technical skill prerequisites required for a job.';

-- ----------------------------------------------------------------------------
-- TABLE: APPLICATIONS
-- Tracks student applications for specific placement opportunities.
-- ----------------------------------------------------------------------------
PROMPT Creating table: APPLICATIONS...
CREATE TABLE APPLICATIONS (
    application_id      NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 8001 INCREMENT BY 1),
    student_id          NUMBER              NOT NULL,
    job_id              NUMBER              NOT NULL,
    application_status  VARCHAR2(20) DEFAULT 'APPLIED' NOT NULL,
    applied_at          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    updated_at          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    
    CONSTRAINT pk_applications PRIMARY KEY (application_id),
    CONSTRAINT uq_student_job_app UNIQUE (student_id, job_id),
    CONSTRAINT fk_app_student FOREIGN KEY (student_id) 
        REFERENCES STUDENTS (student_id) ON DELETE CASCADE,
    CONSTRAINT fk_app_job FOREIGN KEY (job_id) 
        REFERENCES JOBS (job_id) ON DELETE CASCADE,
    CONSTRAINT chk_app_status CHECK (
        application_status IN ('APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN')
    )
);

COMMENT ON TABLE APPLICATIONS IS 'Student job applications with lifecycle state.';
COMMENT ON COLUMN APPLICATIONS.application_status IS 'Lifecycle state: APPLIED, SHORTLISTED, SELECTED, REJECTED, WITHDRAWN.';

-- ----------------------------------------------------------------------------
-- TABLE: APPLICATION_STATUS_HISTORY
-- Immutable audit log table recording all application state transitions.
-- ----------------------------------------------------------------------------
PROMPT Creating table: APPLICATION_STATUS_HISTORY...
CREATE TABLE APPLICATION_STATUS_HISTORY (
    history_id          NUMBER GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
    application_id      NUMBER              NOT NULL,
    old_status          VARCHAR2(20),
    new_status          VARCHAR2(20)        NOT NULL,
    changed_at          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    changed_by          VARCHAR2(50) DEFAULT USER NOT NULL,
    
    CONSTRAINT pk_app_history PRIMARY KEY (history_id),
    CONSTRAINT fk_history_application FOREIGN KEY (application_id) 
        REFERENCES APPLICATIONS (application_id) ON DELETE CASCADE
);

COMMENT ON TABLE APPLICATION_STATUS_HISTORY IS 'Automated audit trail recording each status transition for applications.';

PROMPT ============================================================================
PROMPT STEP 3: CREATING PERFORMANCE AND SEARCH INDEXES
PROMPT ============================================================================

-- Foreign key & high-frequency filter indexes
CREATE INDEX idx_students_grad_cgpa ON STUDENTS (graduation_year, cgpa);
CREATE INDEX idx_jobs_company ON JOBS (company_id);
CREATE INDEX idx_jobs_active ON JOBS (is_active);
CREATE INDEX idx_app_student ON APPLICATIONS (student_id);
CREATE INDEX idx_app_job ON APPLICATIONS (job_id);
CREATE INDEX idx_app_status ON APPLICATIONS (application_status);
CREATE INDEX idx_history_app ON APPLICATION_STATUS_HISTORY (application_id);

PROMPT Schema creation completed successfully.
