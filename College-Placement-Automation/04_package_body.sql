-- ============================================================================
-- SCRIPT: 04_package_body.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: PL/SQL Package Body implementing all business rules,
--          eligibility validation algorithm, transaction safeguards,
--          cursor processing, and executive reporting.
-- ============================================================================

CREATE OR REPLACE PACKAGE BODY PLACEMENT_PKG AS

    -- ========================================================================
    -- MODULE A: STUDENT MANAGEMENT IMPLEMENTATION
    -- ========================================================================
    
    PROCEDURE add_student (
        p_name           IN  STUDENTS.student_name%TYPE,
        p_email          IN  STUDENTS.email%TYPE,
        p_cgpa           IN  STUDENTS.cgpa%TYPE,
        p_grad_year      IN  STUDENTS.graduation_year%TYPE,
        p_backlogs       IN  STUDENTS.active_backlogs%TYPE DEFAULT 0,
        o_student_id     OUT STUDENTS.student_id%TYPE
    ) IS
    BEGIN
        -- Business Rule Validation: CGPA Range
        IF p_cgpa < 0.00 OR p_cgpa > 10.00 THEN
            RAISE_APPLICATION_ERROR(
                ERR_INVALID_CGPA,
                'Validation Error: CGPA must be between 0.00 and 10.00. Provided: ' || TO_CHAR(p_cgpa)
            );
        END IF;

        -- Business Rule Validation: Non-negative Backlogs
        IF p_backlogs < 0 THEN
            RAISE_APPLICATION_ERROR(
                ERR_NEGATIVE_BACKLOG,
                'Validation Error: Active backlogs cannot be negative. Provided: ' || TO_CHAR(p_backlogs)
            );
        END IF;

        -- Insert student profile
        INSERT INTO STUDENTS (
            student_name, email, cgpa, graduation_year, active_backlogs
        ) VALUES (
            TRIM(p_name), LOWER(TRIM(p_email)), p_cgpa, p_grad_year, p_backlogs
        ) RETURNING student_id INTO o_student_id;

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Registered Student: ' || p_name || ' (ID: ' || o_student_id || ')');
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(
                -20011,
                'Duplicate Student Error: A student with email ' || p_email || ' is already registered.'
            );
        WHEN OTHERS THEN
            RAISE;
    END add_student;

    PROCEDURE update_student (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_cgpa           IN  STUDENTS.cgpa%TYPE DEFAULT NULL,
        p_backlogs       IN  STUDENTS.active_backlogs%TYPE DEFAULT NULL,
        p_grad_year      IN  STUDENTS.graduation_year%TYPE DEFAULT NULL
    ) IS
        v_dummy NUMBER;
    BEGIN
        -- Verify existence
        SELECT 1 INTO v_dummy FROM STUDENTS WHERE student_id = p_student_id;

        -- Validate input bounds if provided
        IF p_cgpa IS NOT NULL AND (p_cgpa < 0.00 OR p_cgpa > 10.00) THEN
            RAISE_APPLICATION_ERROR(ERR_INVALID_CGPA, 'CGPA must be between 0.00 and 10.00.');
        END IF;

        IF p_backlogs IS NOT NULL AND p_backlogs < 0 THEN
            RAISE_APPLICATION_ERROR(ERR_NEGATIVE_BACKLOG, 'Active backlogs cannot be negative.');
        END IF;

        UPDATE STUDENTS
        SET cgpa            = NVL(p_cgpa, cgpa),
            active_backlogs = NVL(p_backlogs, active_backlogs),
            graduation_year = NVL(p_grad_year, graduation_year)
        WHERE student_id = p_student_id;

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Updated academic profile for Student ID: ' || p_student_id);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(ERR_STUDENT_NOT_FOUND, 'Student ID ' || p_student_id || ' not found.');
    END update_student;

    PROCEDURE add_student_skill (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_skill_id       IN  SKILLS.skill_id%TYPE
    ) IS
        v_dummy NUMBER;
    BEGIN
        -- Verify student existence
        SELECT 1 INTO v_dummy FROM STUDENTS WHERE student_id = p_student_id;
        -- Verify skill existence
        SELECT 1 INTO v_dummy FROM SKILLS WHERE skill_id = p_skill_id;

        INSERT INTO STUDENT_SKILLS (student_id, skill_id)
        VALUES (p_student_id, p_skill_id);

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Linked Skill ID ' || p_skill_id || ' to Student ID ' || p_student_id);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20012, 'Specified Student ID or Skill ID does not exist.');
        WHEN DUP_VAL_ON_INDEX THEN
            DBMS_OUTPUT.PUT_LINE('[INFO] Skill ID ' || p_skill_id || ' already mapped to Student ID ' || p_student_id);
    END add_student_skill;

    -- ========================================================================
    -- MODULE B: COMPANY AND JOB MANAGEMENT IMPLEMENTATION
    -- ========================================================================

    PROCEDURE add_company (
        p_name           IN  COMPANIES.company_name%TYPE,
        p_industry       IN  COMPANIES.industry%TYPE,
        p_email          IN  COMPANIES.contact_email%TYPE,
        o_company_id     OUT COMPANIES.company_id%TYPE
    ) IS
    BEGIN
        INSERT INTO COMPANIES (company_name, industry, contact_email)
        VALUES (TRIM(p_name), TRIM(p_industry), LOWER(TRIM(p_email)))
        RETURNING company_id INTO o_company_id;

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Registered Company: ' || p_name || ' (ID: ' || o_company_id || ')');
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(
                -20013,
                'Duplicate Company Error: Company name or email already registered.'
            );
    END add_company;

    PROCEDURE add_job (
        p_company_id     IN  JOBS.company_id%TYPE,
        p_job_title      IN  JOBS.job_title%TYPE,
        p_package_lpa    IN  JOBS.package_lpa%TYPE,
        p_min_cgpa       IN  JOBS.minimum_cgpa%TYPE,
        p_max_backlogs   IN  JOBS.maximum_backlogs%TYPE DEFAULT 0,
        p_is_active      IN  JOBS.is_active%TYPE DEFAULT 'Y',
        o_job_id         OUT JOBS.job_id%TYPE
    ) IS
        v_dummy NUMBER;
    BEGIN
        -- Verify company existence
        SELECT 1 INTO v_dummy FROM COMPANIES WHERE company_id = p_company_id;

        -- Validate criteria bounds
        IF p_min_cgpa < 0.00 OR p_min_cgpa > 10.00 THEN
            RAISE_APPLICATION_ERROR(ERR_INVALID_CGPA, 'Minimum CGPA must be between 0.00 and 10.00.');
        END IF;

        IF p_max_backlogs < 0 THEN
            RAISE_APPLICATION_ERROR(ERR_NEGATIVE_BACKLOG, 'Max backlogs cannot be negative.');
        END IF;

        IF p_is_active NOT IN ('Y', 'N') THEN
            RAISE_APPLICATION_ERROR(-20014, 'is_active flag must be ''Y'' or ''N''.');
        END IF;

        INSERT INTO JOBS (
            company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active
        ) VALUES (
            p_company_id, TRIM(p_job_title), p_package_lpa, p_min_cgpa, p_max_backlogs, p_is_active
        ) RETURNING job_id INTO o_job_id;

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Created Job: ' || p_job_title || ' (ID: ' || o_job_id || ')');
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(ERR_COMPANY_NOT_FOUND, 'Company ID ' || p_company_id || ' does not exist.');
    END add_job;

    PROCEDURE add_job_eligible_year (
        p_job_id         IN  JOBS.job_id%TYPE,
        p_year           IN  NUMBER
    ) IS
        v_dummy NUMBER;
    BEGIN
        SELECT 1 INTO v_dummy FROM JOBS WHERE job_id = p_job_id;

        INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year)
        VALUES (p_job_id, p_year);

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Added eligible batch ' || p_year || ' for Job ID ' || p_job_id);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(ERR_JOB_NOT_FOUND, 'Job ID ' || p_job_id || ' does not exist.');
        WHEN DUP_VAL_ON_INDEX THEN
            NULL; -- Idempotent insert
    END add_job_eligible_year;

    PROCEDURE add_job_required_skill (
        p_job_id         IN  JOBS.job_id%TYPE,
        p_skill_id       IN  SKILLS.skill_id%TYPE
    ) IS
        v_dummy NUMBER;
    BEGIN
        SELECT 1 INTO v_dummy FROM JOBS WHERE job_id = p_job_id;
        SELECT 1 INTO v_dummy FROM SKILLS WHERE skill_id = p_skill_id;

        INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id)
        VALUES (p_job_id, p_skill_id);

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Added prerequisite Skill ID ' || p_skill_id || ' for Job ID ' || p_job_id);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20015, 'Invalid Job ID or Skill ID specified.');
        WHEN DUP_VAL_ON_INDEX THEN
            NULL; -- Idempotent insert
    END add_job_required_skill;

    PROCEDURE set_job_status (
        p_job_id         IN  JOBS.job_id%TYPE,
        p_is_active      IN  JOBS.is_active%TYPE
    ) IS
        v_dummy NUMBER;
    BEGIN
        SELECT 1 INTO v_dummy FROM JOBS WHERE job_id = p_job_id;

        IF p_is_active NOT IN ('Y', 'N') THEN
            RAISE_APPLICATION_ERROR(-20014, 'is_active flag must be ''Y'' or ''N''.');
        END IF;

        UPDATE JOBS
        SET is_active = p_is_active
        WHERE job_id = p_job_id;

        DBMS_OUTPUT.PUT_LINE('[SUCCESS] Job ID ' || p_job_id || ' active status updated to: ' || p_is_active);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(ERR_JOB_NOT_FOUND, 'Job ID ' || p_job_id || ' not found.');
    END set_job_status;

    -- ========================================================================
    -- MODULE C: AUTOMATIC ELIGIBILITY ENGINE IMPLEMENTATION
    -- ========================================================================

    FUNCTION check_eligibility (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE,
        o_reasons        OUT VARCHAR2
    ) RETURN BOOLEAN IS
        v_stud           STUDENTS%ROWTYPE;
        v_job            JOBS%ROWTYPE;
        v_reasons        VARCHAR2(4000) := '';
        v_is_eligible    BOOLEAN := TRUE;
        v_year_count     PLS_INTEGER := 0;
        v_allowed_years  VARCHAR2(200);
        v_missing_skills VARCHAR2(500);

        -- Cursor to find missing mandatory technical skills
        CURSOR c_missing_skills IS
            SELECT s.skill_name
            FROM JOB_REQUIRED_SKILLS jrs
            JOIN SKILLS s ON jrs.skill_id = s.skill_id
            WHERE jrs.job_id = p_job_id
              AND jrs.skill_id NOT IN (
                  SELECT ss.skill_id
                  FROM STUDENT_SKILLS ss
                  WHERE ss.student_id = p_student_id
              )
            ORDER BY s.skill_name;
    BEGIN
        -- 1. Fetch Student Profile
        BEGIN
            SELECT * INTO v_stud FROM STUDENTS WHERE student_id = p_student_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(ERR_STUDENT_NOT_FOUND, 'Student ID ' || p_student_id || ' does not exist.');
        END;

        -- 2. Fetch Job Profile
        BEGIN
            SELECT * INTO v_job FROM JOBS WHERE job_id = p_job_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(ERR_JOB_NOT_FOUND, 'Job ID ' || p_job_id || ' does not exist.');
        END;

        -- Criterion 1: Job Active Status
        IF v_job.is_active != 'Y' THEN
            v_is_eligible := FALSE;
            v_reasons := v_reasons || '[FAIL] Job opportunity is currently INACTIVE. ';
        END IF;

        -- Criterion 2: Academic CGPA Threshold
        IF v_stud.cgpa < v_job.minimum_cgpa THEN
            v_is_eligible := FALSE;
            v_reasons := v_reasons || '[FAIL] CGPA (' || TO_CHAR(v_stud.cgpa, 'FM90.00') || 
                         ') is below minimum required cutoff (' || TO_CHAR(v_job.minimum_cgpa, 'FM90.00') || '). ';
        END IF;

        -- Criterion 3: Active Backlog Threshold
        IF v_stud.active_backlogs > v_job.maximum_backlogs THEN
            v_is_eligible := FALSE;
            v_reasons := v_reasons || '[FAIL] Active backlogs (' || v_stud.active_backlogs || 
                         ') exceed maximum permitted limit (' || v_job.maximum_backlogs || '). ';
        END IF;

        -- Criterion 4: Graduation Batch Year
        SELECT COUNT(*) INTO v_year_count
        FROM JOB_ELIGIBLE_YEARS
        WHERE job_id = p_job_id AND graduation_year = v_stud.graduation_year;

        IF v_year_count = 0 THEN
            v_is_eligible := FALSE;
            -- Retrieve list of allowed batches for detailed feedback
            SELECT LISTAGG(graduation_year, ', ') WITHIN GROUP (ORDER BY graduation_year)
            INTO v_allowed_years
            FROM JOB_ELIGIBLE_YEARS
            WHERE job_id = p_job_id;

            v_reasons := v_reasons || '[FAIL] Graduation year (' || v_stud.graduation_year || 
                         ') not eligible. Permitted batches: ' || NVL(v_allowed_years, 'None configured') || '. ';
        END IF;

        -- Criterion 5: Mandatory Technical Skills Evaluation
        v_missing_skills := '';
        FOR r IN c_missing_skills LOOP
            IF v_missing_skills IS NULL THEN
                v_missing_skills := r.skill_name;
            ELSE
                v_missing_skills := v_missing_skills || ', ' || r.skill_name;
            END IF;
        END LOOP;

        IF v_missing_skills IS NOT NULL THEN
            v_is_eligible := FALSE;
            v_reasons := v_reasons || '[FAIL] Missing mandatory skill(s): ' || v_missing_skills || '. ';
        END IF;

        -- Final Decision Formulation
        IF v_is_eligible THEN
            o_reasons := '[PASS] Candidate satisfies all criteria: CGPA, Backlog, Batch, and Technical Skills.';
        ELSE
            o_reasons := RTRIM(v_reasons);
        END IF;

        RETURN v_is_eligible;
    END check_eligibility;

    FUNCTION is_student_eligible (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE
    ) RETURN VARCHAR2 IS
        v_reason VARCHAR2(4000);
    BEGIN
        IF check_eligibility(p_student_id, p_job_id, v_reason) THEN
            RETURN 'YES';
        ELSE
            RETURN 'NO';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'ERROR';
    END is_student_eligible;

    FUNCTION get_ineligibility_reason (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE
    ) RETURN VARCHAR2 IS
        v_reason VARCHAR2(4000);
        v_dummy  BOOLEAN;
    BEGIN
        v_dummy := check_eligibility(p_student_id, p_job_id, v_reason);
        RETURN v_reason;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 'Error evaluating eligibility: ' || SQLERRM;
    END get_ineligibility_reason;

    PROCEDURE check_eligibility_desc (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE,
        o_is_eligible    OUT VARCHAR2,
        o_reasons        OUT VARCHAR2
    ) IS
        v_eligible BOOLEAN;
        v_sname    STUDENTS.student_name%TYPE;
        v_jtitle   JOBS.job_title%TYPE;
        v_cname    COMPANIES.company_name%TYPE;
    BEGIN
        SELECT s.student_name, j.job_title, c.company_name
        INTO v_sname, v_jtitle, v_cname
        FROM STUDENTS s, JOBS j, COMPANIES c
        WHERE s.student_id = p_student_id
          AND j.job_id = p_job_id
          AND j.company_id = c.company_id;

        v_eligible := check_eligibility(p_student_id, p_job_id, o_reasons);

        IF v_eligible THEN
            o_is_eligible := 'YES';
        ELSE
            o_is_eligible := 'NO';
        END IF;

        DBMS_OUTPUT.PUT_LINE('------------------------------------------------------------');
        DBMS_OUTPUT.PUT_LINE('ELIGIBILITY EVALUATION REPORT');
        DBMS_OUTPUT.PUT_LINE('Student   : ' || v_sname || ' (ID: ' || p_student_id || ')');
        DBMS_OUTPUT.PUT_LINE('Position  : ' || v_jtitle || ' at ' || v_cname || ' (Job ID: ' || p_job_id || ')');
        DBMS_OUTPUT.PUT_LINE('Status    : ' || CASE WHEN v_eligible THEN 'ELIGIBLE [QUALIFIED]' ELSE 'NOT ELIGIBLE [DISQUALIFIED]' END);
        DBMS_OUTPUT.PUT_LINE('Details   : ' || o_reasons);
        DBMS_OUTPUT.PUT_LINE('------------------------------------------------------------');
    END check_eligibility_desc;

    PROCEDURE get_eligible_students (
        p_job_id         IN  JOBS.job_id%TYPE
    ) IS
        v_jtitle   JOBS.job_title%TYPE;
        v_cname    COMPANIES.company_name%TYPE;
        v_count    PLS_INTEGER := 0;
        v_reason   VARCHAR2(4000);

        CURSOR c_students IS
            SELECT student_id, student_name, cgpa, graduation_year, active_backlogs
            FROM STUDENTS
            ORDER BY cgpa DESC;
    BEGIN
        SELECT j.job_title, c.company_name
        INTO v_jtitle, v_cname
        FROM JOBS j
        JOIN COMPANIES c ON j.company_id = c.company_id
        WHERE j.job_id = p_job_id;

        DBMS_OUTPUT.PUT_LINE('========================================================================');
        DBMS_OUTPUT.PUT_LINE('QUALIFIED CANDIDATES LIST FOR: ' || v_jtitle || ' (' || v_cname || ')');
        DBMS_OUTPUT.PUT_LINE('Job ID: ' || p_job_id);
        DBMS_OUTPUT.PUT_LINE('========================================================================');
        DBMS_OUTPUT.PUT_LINE(RPAD('ID', 8) || RPAD('NAME', 22) || RPAD('CGPA', 8) || RPAD('YEAR', 8) || 'BACKLOGS');
        DBMS_OUTPUT.PUT_LINE('------------------------------------------------------------------------');

        FOR s IN c_students LOOP
            IF check_eligibility(s.student_id, p_job_id, v_reason) THEN
                v_count := v_count + 1;
                DBMS_OUTPUT.PUT_LINE(
                    RPAD(s.student_id, 8) || 
                    RPAD(s.student_name, 22) || 
                    RPAD(TO_CHAR(s.cgpa, 'FM90.00'), 8) || 
                    RPAD(s.graduation_year, 8) || 
                    s.active_backlogs
                );
            END IF;
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('------------------------------------------------------------------------');
        DBMS_OUTPUT.PUT_LINE('Total Eligible Candidates Found: ' || v_count);
        DBMS_OUTPUT.PUT_LINE('========================================================================');
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(ERR_JOB_NOT_FOUND, 'Job ID ' || p_job_id || ' not found.');
    END get_eligible_students;

    -- ========================================================================
    -- MODULE D: APPLICATION WORKFLOW MANAGEMENT IMPLEMENTATION
    -- ========================================================================

    PROCEDURE apply_for_job (
        p_student_id     IN  STUDENTS.student_id%TYPE,
        p_job_id         IN  JOBS.job_id%TYPE,
        o_application_id OUT APPLICATIONS.application_id%TYPE
    ) IS
        v_existing_count PLS_INTEGER;
        v_is_eligible    BOOLEAN;
        v_reason         VARCHAR2(4000);
    BEGIN
        -- 1. Prevent duplicate submission at application logic layer
        SELECT COUNT(*) INTO v_existing_count
        FROM APPLICATIONS
        WHERE student_id = p_student_id AND job_id = p_job_id;

        IF v_existing_count > 0 THEN
            RAISE_APPLICATION_ERROR(
                ERR_DUPLICATE_APPLICATION,
                'Duplicate Application: Student ID ' || p_student_id || 
                ' has already submitted an application for Job ID ' || p_job_id || '.'
            );
        END IF;

        -- 2. Verify complete eligibility rule set
        v_is_eligible := check_eligibility(p_student_id, p_job_id, v_reason);

        IF NOT v_is_eligible THEN
            RAISE_APPLICATION_ERROR(
                ERR_STUDENT_INELIGIBLE,
                'Application Rejected: Student ID ' || p_student_id || ' is NOT eligible for Job ID ' || 
                p_job_id || '. Details: ' || v_reason
            );
        END IF;

        -- 3. Register application with initial state 'APPLIED'
        -- Note: We do not place an unconditional COMMIT here to preserve caller transaction boundaries.
        INSERT INTO APPLICATIONS (
            student_id, job_id, application_status, applied_at, updated_at
        ) VALUES (
            p_student_id, p_job_id, 'APPLIED', SYSTIMESTAMP, SYSTIMESTAMP
        ) RETURNING application_id INTO o_application_id;

        DBMS_OUTPUT.PUT_LINE(
            '[SUCCESS] Application submitted successfully! Application ID: ' || o_application_id || 
            ' (Student: ' || p_student_id || ', Job: ' || p_job_id || ')'
        );
    END apply_for_job;

    PROCEDURE update_application_status (
        p_application_id IN  APPLICATIONS.application_id%TYPE,
        p_new_status     IN  APPLICATIONS.application_status%TYPE
    ) IS
        v_current_status APPLICATIONS.application_status%TYPE;
        v_target_status  APPLICATIONS.application_status%TYPE := UPPER(TRIM(p_new_status));
        v_valid          BOOLEAN := FALSE;
    BEGIN
        -- Lock row for concurrency control
        BEGIN
            SELECT application_status
            INTO v_current_status
            FROM APPLICATIONS
            WHERE application_id = p_application_id
            FOR UPDATE OF application_status;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(
                    ERR_APPLICATION_NOT_FOUND,
                    'Application ID ' || p_application_id || ' does not exist.'
                );
        END;

        -- Enforce state machine transition rules:
        -- APPLIED     -> SHORTLISTED, REJECTED, WITHDRAWN
        -- SHORTLISTED -> SELECTED, REJECTED, WITHDRAWN
        -- SELECTED    -> WITHDRAWN
        -- REJECTED    -> (Terminal: no further transitions permitted)
        -- WITHDRAWN   -> (Terminal: no further transitions permitted)
        IF v_current_status = 'APPLIED' THEN
            IF v_target_status IN ('SHORTLISTED', 'REJECTED', 'WITHDRAWN') THEN
                v_valid := TRUE;
            END IF;
        ELSIF v_current_status = 'SHORTLISTED' THEN
            IF v_target_status IN ('SELECTED', 'REJECTED', 'WITHDRAWN') THEN
                v_valid := TRUE;
            END IF;
        ELSIF v_current_status = 'SELECTED' THEN
            IF v_target_status IN ('WITHDRAWN') THEN
                v_valid := TRUE;
            END IF;
        ELSIF v_current_status IN ('REJECTED', 'WITHDRAWN') THEN
            v_valid := FALSE; -- Terminal state
        END IF;

        IF NOT v_valid THEN
            RAISE_APPLICATION_ERROR(
                ERR_INVALID_STATUS_TRANSITION,
                'Invalid Status Transition: Cannot change application #' || p_application_id || 
                ' from state ''' || v_current_status || ''' to ''' || v_target_status || 
                '''. Permitted transitions from ' || v_current_status || 
                ' do not include ' || v_target_status || '.'
            );
        END IF;

        -- Perform update. The AFTER UPDATE trigger will handle audit logging into APPLICATION_STATUS_HISTORY
        UPDATE APPLICATIONS
        SET application_status = v_target_status,
            updated_at         = SYSTIMESTAMP
        WHERE application_id = p_application_id;

        DBMS_OUTPUT.PUT_LINE(
            '[SUCCESS] Application ID ' || p_application_id || ' transitioned: ' || 
            v_current_status || ' -> ' || v_target_status
        );
    END update_application_status;

    -- ========================================================================
    -- MODULE E: EXECUTIVE PLACEMENT REPORTING IMPLEMENTATION
    -- ========================================================================

    PROCEDURE generate_placement_summary IS
        v_total_students     PLS_INTEGER := 0;
        v_grad_2025_students PLS_INTEGER := 0;
        v_total_companies    PLS_INTEGER := 0;
        v_total_jobs         PLS_INTEGER := 0;
        v_active_jobs        PLS_INTEGER := 0;
        v_total_apps         PLS_INTEGER := 0;
        v_placed_students    PLS_INTEGER := 0;
        v_total_offers       PLS_INTEGER := 0;
        v_max_package        NUMBER(4,2) := 0;
        v_avg_package        NUMBER(4,2) := 0;
        v_placement_pct      NUMBER(5,2) := 0.00;

        CURSOR c_company_summary IS
            SELECT c.company_name,
                   c.industry,
                   COUNT(DISTINCT j.job_id) AS total_openings,
                   COUNT(a.application_id) AS total_applicants,
                   COUNT(CASE WHEN a.application_status = 'SHORTLISTED' THEN 1 END) AS shortlisted_count,
                   COUNT(CASE WHEN a.application_status = 'SELECTED' THEN 1 END) AS selected_count
            FROM COMPANIES c
            LEFT JOIN JOBS j ON c.company_id = j.company_id
            LEFT JOIN APPLICATIONS a ON j.job_id = a.job_id
            GROUP BY c.company_name, c.industry
            ORDER BY selected_count DESC, total_applicants DESC;
    BEGIN
        -- KPI Aggregations
        SELECT COUNT(*) INTO v_total_students FROM STUDENTS;
        SELECT COUNT(*) INTO v_grad_2025_students FROM STUDENTS WHERE graduation_year = 2025;
        SELECT COUNT(*) INTO v_total_companies FROM COMPANIES;
        SELECT COUNT(*) INTO v_total_jobs FROM JOBS;
        SELECT COUNT(*) INTO v_active_jobs FROM JOBS WHERE is_active = 'Y';
        SELECT COUNT(*) INTO v_total_apps FROM APPLICATIONS;

        SELECT COUNT(DISTINCT student_id), COUNT(*)
        INTO v_placed_students, v_total_offers
        FROM APPLICATIONS
        WHERE application_status = 'SELECTED';

        SELECT NVL(MAX(j.package_lpa), 0), NVL(AVG(j.package_lpa), 0)
        INTO v_max_package, v_avg_package
        FROM APPLICATIONS a
        JOIN JOBS j ON a.job_id = j.job_id
        WHERE a.application_status = 'SELECTED';

        IF v_grad_2025_students > 0 THEN
            v_placement_pct := ROUND((v_placed_students / v_grad_2025_students) * 100, 2);
        END IF;

        DBMS_OUTPUT.PUT_LINE('========================================================================================');
        DBMS_OUTPUT.PUT_LINE('            CAMPUS PLACEMENT & ELIGIBILITY AUTOMATION EXECUTIVE REPORT                 ');
        DBMS_OUTPUT.PUT_LINE('========================================================================================');
        DBMS_OUTPUT.PUT_LINE('KEY PERFORMANCE METRICS:');
        DBMS_OUTPUT.PUT_LINE('  * Total Enrolled Students      : ' || v_total_students);
        DBMS_OUTPUT.PUT_LINE('  * Final Year (2025) Students   : ' || v_grad_2025_students);
        DBMS_OUTPUT.PUT_LINE('  * Registered Recruiters        : ' || v_total_companies);
        DBMS_OUTPUT.PUT_LINE('  * Total Job Openings Posted    : ' || v_total_jobs || ' (Active Drives: ' || v_active_jobs || ')');
        DBMS_OUTPUT.PUT_LINE('  * Total Applications Submitted : ' || v_total_apps);
        DBMS_OUTPUT.PUT_LINE('  * Total Offer Letters Issued   : ' || v_total_offers);
        DBMS_OUTPUT.PUT_LINE('  * Unique Placed Students       : ' || v_placed_students);
        DBMS_OUTPUT.PUT_LINE('  * Placement Conversion Rate    : ' || TO_CHAR(v_placement_pct, 'FM990.00') || '% (of 2025 batch)');
        DBMS_OUTPUT.PUT_LINE('  * Highest Package Offered      : ' || TO_CHAR(v_max_package, 'FM90.00') || ' LPA');
        DBMS_OUTPUT.PUT_LINE('  * Average Package Offered      : ' || TO_CHAR(v_avg_package, 'FM90.00') || ' LPA');
        DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------------------------');
        DBMS_OUTPUT.PUT_LINE('RECRUITER-WISE PERFORMANCE BREAKDOWN:');
        DBMS_OUTPUT.PUT_LINE(
            RPAD('COMPANY', 28) || 
            RPAD('INDUSTRY', 25) || 
            RPAD('JOBS', 6) || 
            RPAD('APPS', 8) || 
            RPAD('SHORT', 8) || 
            'SELECTED'
        );
        DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------------------------');

        FOR rec IN c_company_summary LOOP
            DBMS_OUTPUT.PUT_LINE(
                RPAD(rec.company_name, 28) || 
                RPAD(rec.industry, 25) || 
                RPAD(rec.total_openings, 6) || 
                RPAD(rec.total_applicants, 8) || 
                RPAD(rec.shortlisted_count, 8) || 
                rec.selected_count
            );
        END LOOP;

        DBMS_OUTPUT.PUT_LINE('========================================================================================');
    END generate_placement_summary;

END PLACEMENT_PKG;
/
SHOW ERRORS PACKAGE BODY PLACEMENT_PKG;
