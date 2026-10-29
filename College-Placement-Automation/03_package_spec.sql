-- ============================================================================
-- SCRIPT: 03_package_spec.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: PL/SQL Package Specification defining the public API for
--          students, companies, jobs, automatic eligibility evaluation,
--          application workflow management, and executive placement reporting.
-- ============================================================================

CREATE OR REPLACE PACKAGE PLACEMENT_PKG AS
    -- ------------------------------------------------------------------------
    -- CUSTOM APPLICATION ERROR CODES (-20000 to -20099)
    -- ------------------------------------------------------------------------
    ERR_STUDENT_NOT_FOUND         CONSTANT NUMBER := -20001;
    ERR_JOB_NOT_FOUND             CONSTANT NUMBER := -20002;
    ERR_JOB_INACTIVE              CONSTANT NUMBER := -20003;
    ERR_STUDENT_INELIGIBLE        CONSTANT NUMBER := -20004;
    ERR_DUPLICATE_APPLICATION     CONSTANT NUMBER := -20005;
    ERR_INVALID_STATUS_TRANSITION CONSTANT NUMBER := -20006;
    ERR_INVALID_CGPA              CONSTANT NUMBER := -20007;
    ERR_NEGATIVE_BACKLOG          CONSTANT NUMBER := -20008;
    ERR_APPLICATION_NOT_FOUND     CONSTANT NUMBER := -20009;
    ERR_COMPANY_NOT_FOUND         CONSTANT NUMBER := -20010;

    -- ------------------------------------------------------------------------
    -- TYPE DEFINITIONS
    -- ------------------------------------------------------------------------
    TYPE t_reason_tab IS TABLE OF VARCHAR2(200) INDEX BY PLS_INTEGER;

    -- ------------------------------------------------------------------------
    -- MODULE A: STUDENT MANAGEMENT PROCEDURES
    -- ------------------------------------------------------------------------
    /**
     * Registers a new student into the placement system.
     * Validates CGPA range (0.00 - 10.00) and non-negative backlog count.
     */
    PROCEDURE add_student (
        p_name           IN  STUDENTS.student_name%TYPE,
        p_email          IN  STUDENTS.email%TYPE,
        p_cgpa           IN  STUDENTS.cgpa%TYPE,
        p_grad_year      IN  STUDENTS.graduation_year%TYPE,
        p_backlogs       IN  STUDENTS.active_backlogs%TYPE DEFAULT 0,
        o_student_id     OUT STUDENTS.student_id%TYPE
    );

    /**
     * Updates an existing student's academic profile (CGPA, active backlogs, graduation year).
     */
    PROCEDURE update_student (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_cgpa           IN  STUDENTS.cgpa%TYPE DEFAULT NULL,
        p_backlogs       IN  STUDENTS.active_backlogs%TYPE DEFAULT NULL,
        p_grad_year      IN  STUDENTS.graduation_year%TYPE DEFAULT NULL
    );

    /**
     * Links a technical skill to a student.
     */
    PROCEDURE add_student_skill (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_skill_id       IN  SKILLS.skill_id%TYPE
    );

    -- ------------------------------------------------------------------------
    -- MODULE B: COMPANY AND JOB MANAGEMENT PROCEDURES
    -- ------------------------------------------------------------------------
    /**
     * Registers a new recruiting employer/company.
     */
    PROCEDURE add_company (
        p_name           IN  COMPANIES.company_name%TYPE,
        p_industry       IN  COMPANIES.industry%TYPE,
        p_email          IN  COMPANIES.contact_email%TYPE,
        o_company_id     OUT COMPANIES.company_id%TYPE
    );

    /**
     * Creates a new job opportunity with configurable cutoff criteria.
     */
    PROCEDURE add_job (
        p_company_id     IN  JOBS.company_id%TYPE,
        p_job_title      IN  JOBS.job_title%TYPE,
        p_package_lpa    IN  JOBS.package_lpa%TYPE,
        p_min_cgpa       IN  JOBS.minimum_cgpa%TYPE,
        p_max_backlogs   IN  JOBS.maximum_backlogs%TYPE DEFAULT 0,
        p_is_active      IN  JOBS.is_active%TYPE DEFAULT 'Y',
        o_job_id         OUT JOBS.job_id%TYPE
    );

    /**
     * Adds an eligible passing-out batch year for a job.
     */
    PROCEDURE add_job_eligible_year (
        p_job_id         IN  JOBS.job_id%TYPE,
        p_year           IN  NUMBER
    );

    /**
     * Adds a mandatory technical skill prerequisite for a job.
     */
    PROCEDURE add_job_required_skill (
        p_job_id         IN  JOBS.job_id%TYPE,
        p_skill_id       IN  SKILLS.skill_id%TYPE
    );

    /**
     * Toggles job active status ('Y' or 'N').
     */
    PROCEDURE set_job_status (
        p_job_id         IN  JOBS.job_id%TYPE,
        p_is_active      IN  JOBS.is_active%TYPE
    );

    -- ------------------------------------------------------------------------
    -- MODULE C: AUTOMATIC ELIGIBILITY ENGINE
    -- ------------------------------------------------------------------------
    /**
     * Central business function to evaluate whether a student qualifies for a job.
     * Evaluates: Active status, CGPA cutoff, Backlog limit, Graduation Year, and Skills.
     * Returns TRUE if eligible, FALSE otherwise, populating o_reasons with detailed explanation.
     */
    FUNCTION check_eligibility (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE,
        o_reasons        OUT VARCHAR2
    ) RETURN BOOLEAN;

    /**
     * SQL-callable wrapper returning 'YES' or 'NO' for view and report queries.
     */
    FUNCTION is_student_eligible (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE
    ) RETURN VARCHAR2;

    /**
     * Returns human-readable ineligibility explanation (or 'Eligible' if qualified).
     */
    FUNCTION get_ineligibility_reason (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE
    ) RETURN VARCHAR2;

    /**
     * Displays evaluation details for a specific student and job via DBMS_OUTPUT.
     */
    PROCEDURE check_eligibility_desc (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE,
        o_is_eligible    OUT VARCHAR2,
        o_reasons        OUT VARCHAR2
    );

    /**
     * Cursor-driven procedure identifying and printing all qualified students for a given job.
     */
    PROCEDURE get_eligible_students (
        p_job_id         IN  JOBS.job_id%TYPE
    );

    -- ------------------------------------------------------------------------
    -- MODULE D: APPLICATION WORKFLOW MANAGEMENT
    -- ------------------------------------------------------------------------
    /**
     * Submits an application for a student. Enforces eligibility validation first,
     * prevents duplicate submissions, and registers initial 'APPLIED' state.
     * Note: Transaction control (COMMIT/ROLLBACK) is owned by the calling client.
     */
    PROCEDURE apply_for_job (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE,
        o_application_id OUT APPLICATIONS.application_id%TYPE
    );

    /**
     * Advances application lifecycle status according to strict transition rules:
     * APPLIED     -> SHORTLISTED, REJECTED, WITHDRAWN
     * SHORTLISTED -> SELECTED, REJECTED, WITHDRAWN
     * SELECTED    -> WITHDRAWN
     * REJECTED    -> (Terminal state - no transitions allowed)
     * WITHDRAWN   -> (Terminal state - no transitions allowed)
     */
    PROCEDURE update_application_status (
        p_application_id IN  APPLICATIONS.application_id%TYPE,
        p_new_status     IN  APPLICATIONS.application_status%TYPE
    );

    -- ------------------------------------------------------------------------
    -- MODULE E: EXECUTIVE PLACEMENT REPORTING
    -- ------------------------------------------------------------------------
    /**
     * Generates comprehensive campus placement KPIs and company breakdown via DBMS_OUTPUT.
     */
    PROCEDURE generate_placement_summary;

END PLACEMENT_PKG;
/
SHOW ERRORS PACKAGE PLACEMENT_PKG;
