-- ============================================================================
-- SCRIPT: 07_test_cases.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: Automated test execution suite covering 20 comprehensive scenarios:
--          Data validation, eligibility rules, application workflow, state machine,
--          triggers, audit logging, transactions (COMMIT/ROLLBACK), and integrity constraints.
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;
SET FEEDBACK OFF;

PROMPT ============================================================================
PROMPT STARTING AUTOMATED TEST SUITE EXECUTION (20 TEST CASES)
PROMPT ============================================================================

DECLARE
    v_test_count       PLS_INTEGER := 0;
    v_pass_count       PLS_INTEGER := 0;
    v_fail_count       PLS_INTEGER := 0;

    v_temp_stud_id     NUMBER;
    v_temp_comp_id     NUMBER;
    v_temp_job_id      NUMBER;
    v_temp_app_id      NUMBER;
    v_temp_reason      VARCHAR2(4000);
    v_is_eligible      BOOLEAN;
    v_curr_status      VARCHAR2(20);
    v_audit_count      NUMBER;
    v_timestamp_before TIMESTAMP;
    v_timestamp_after  TIMESTAMP;

    -- Helper procedure for reporting test outcomes
    PROCEDURE report_result (
        p_test_id       IN VARCHAR2,
        p_objective     IN VARCHAR2,
        p_passed        IN BOOLEAN,
        p_expected      IN VARCHAR2,
        p_actual        IN VARCHAR2
    ) IS
    BEGIN
        v_test_count := v_test_count + 1;
        IF p_passed THEN
            v_pass_count := v_pass_count + 1;
            DBMS_OUTPUT.PUT_LINE('[PASS] ' || RPAD(p_test_id, 10) || ' | ' || p_objective);
        ELSE
            v_fail_count := v_fail_count + 1;
            DBMS_OUTPUT.PUT_LINE('[FAIL] ' || RPAD(p_test_id, 10) || ' | ' || p_objective);
            DBMS_OUTPUT.PUT_LINE('       Expected: ' || p_expected);
            DBMS_OUTPUT.PUT_LINE('       Actual  : ' || p_actual);
        END IF;
    END report_result;

BEGIN
    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('TEST ID    | TEST OBJECTIVE & OUTCOME');
    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------------------------');

    -- ------------------------------------------------------------------------
    -- TEST 01: Successful Student Registration
    -- ------------------------------------------------------------------------
    BEGIN
        PLACEMENT_PKG.add_student(
            p_name       => 'Test Candidate Alpha',
            p_email      => 'candidate.alpha@campus.edu',
            p_cgpa       => 8.75,
            p_grad_year  => 2025,
            p_backlogs   => 0,
            o_student_id => v_temp_stud_id
        );
        report_result('TC-01', 'Successful student registration', (v_temp_stud_id IS NOT NULL), 
                      'Student registered with generated ID', 'Generated ID: ' || v_temp_stud_id);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-01', 'Successful student registration', FALSE, 'Success', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 02: Duplicate Student Registration Prevention
    -- ------------------------------------------------------------------------
    BEGIN
        -- Re-insert identical email
        PLACEMENT_PKG.add_student(
            p_name       => 'Test Candidate Duplicate',
            p_email      => 'candidate.alpha@campus.edu',
            p_cgpa       => 7.50,
            p_grad_year  => 2025,
            p_backlogs   => 0,
            o_student_id => v_temp_stud_id
        );
        report_result('TC-02', 'Duplicate student registration prevention', FALSE, 
                      'Exception RAISE_APPLICATION_ERROR (-20011)', 'Allowed duplicate insert');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -20011 OR SQLCODE = -1 THEN
                report_result('TC-02', 'Duplicate student registration prevention', TRUE, 
                              'Rejected duplicate registration', 'Caught expected duplicate exception: ' || SQLERRM);
            ELSE
                report_result('TC-02', 'Duplicate student registration prevention', FALSE, 
                              'Exception -20011', SQLERRM);
            END IF;
    END;

    -- ------------------------------------------------------------------------
    -- TEST 03: Invalid CGPA Validation (< 0.0 or > 10.0)
    -- ------------------------------------------------------------------------
    BEGIN
        PLACEMENT_PKG.add_student(
            p_name       => 'Invalid CGPA Student',
            p_email      => 'invalid.cgpa@campus.edu',
            p_cgpa       => 11.50,
            p_grad_year  => 2025,
            p_backlogs   => 0,
            o_student_id => v_temp_stud_id
        );
        report_result('TC-03', 'Invalid CGPA validation (> 10.0)', FALSE, 
                      'Exception ERR_INVALID_CGPA (-20007)', 'Allowed invalid CGPA');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = PLACEMENT_PKG.ERR_INVALID_CGPA OR SQLCODE = -2290 THEN
                report_result('TC-03', 'Invalid CGPA validation (> 10.0)', TRUE, 
                              'Rejection with ERR_INVALID_CGPA', 'Caught: ' || SQLERRM);
            ELSE
                report_result('TC-03', 'Invalid CGPA validation (> 10.0)', FALSE, 
                              'ERR_INVALID_CGPA', SQLERRM);
            END IF;
    END;

    -- ------------------------------------------------------------------------
    -- TEST 04: Successful Company Registration
    -- ------------------------------------------------------------------------
    BEGIN
        PLACEMENT_PKG.add_company(
            p_name       => 'Oracle Corporation Test',
            p_industry   => 'Enterprise Software',
            p_email      => 'campus.hires@oracle.com',
            o_company_id => v_temp_comp_id
        );
        report_result('TC-04', 'Successful company registration', (v_temp_comp_id IS NOT NULL), 
                      'Company registered with generated ID', 'Company ID: ' || v_temp_comp_id);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-04', 'Successful company registration', FALSE, 'Success', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 05: Successful Job Creation
    -- ------------------------------------------------------------------------
    BEGIN
        PLACEMENT_PKG.add_job(
            p_company_id   => v_temp_comp_id,
            p_job_title    => 'Associate Cloud Database Engineer',
            p_package_lpa  => 16.50,
            p_min_cgpa     => 7.50,
            p_max_backlogs => 0,
            p_is_active    => 'Y',
            o_job_id       => v_temp_job_id
        );
        -- Configure batch and required skill
        PLACEMENT_PKG.add_job_eligible_year(v_temp_job_id, 2025);
        PLACEMENT_PKG.add_job_required_skill(v_temp_job_id, 3); -- Oracle SQL

        report_result('TC-05', 'Successful job creation with criteria', (v_temp_job_id IS NOT NULL), 
                      'Job created with ID and criteria linked', 'Job ID: ' || v_temp_job_id);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-05', 'Successful job creation with criteria', FALSE, 'Success', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 06: Eligible Student Detection (Meets all criteria)
    -- ------------------------------------------------------------------------
    -- Aarav Sharma (1001) for Google Cloud (201): CGPA 9.45 >= 8.50, 0 backlogs, 2025 batch, has Python & Cloud
    BEGIN
        v_is_eligible := PLACEMENT_PKG.check_eligibility(1001, 201, v_temp_reason);
        report_result('TC-06', 'Eligible student detection (All criteria satisfied)', v_is_eligible, 
                      'TRUE / Eligible', v_temp_reason);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-06', 'Eligible student detection', FALSE, 'TRUE', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 07: CGPA-based Rejection
    -- ------------------------------------------------------------------------
    -- Sneha Kulkarni (1010) has CGPA 6.10, applying for Google Cloud (201) min 8.50
    BEGIN
        v_is_eligible := PLACEMENT_PKG.check_eligibility(1010, 201, v_temp_reason);
        report_result('TC-07', 'CGPA-based rejection', (NOT v_is_eligible AND INSTR(v_temp_reason, 'CGPA') > 0), 
                      'FALSE with CGPA failure message', v_temp_reason);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-07', 'CGPA-based rejection', FALSE, 'FALSE', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 08: Backlog-based Rejection
    -- ------------------------------------------------------------------------
    -- Neha Verma (1006) has 3 backlogs, applying for Infosys (205) max allowed 1
    BEGIN
        v_is_eligible := PLACEMENT_PKG.check_eligibility(1006, 205, v_temp_reason);
        report_result('TC-08', 'Backlog-based rejection', (NOT v_is_eligible AND INSTR(v_temp_reason, 'backlog') > 0), 
                      'FALSE with backlog failure message', v_temp_reason);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-08', 'Backlog-based rejection', FALSE, 'FALSE', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 09: Missing-skill Rejection
    -- ------------------------------------------------------------------------
    -- Ananya Sen (1004) has Python, SQL, ML (Missing Java & Spring Boot for Microsoft SDE 202)
    BEGIN
        v_is_eligible := PLACEMENT_PKG.check_eligibility(1004, 202, v_temp_reason);
        report_result('TC-09', 'Missing-skill rejection', (NOT v_is_eligible AND INSTR(v_temp_reason, 'Missing mandatory skill') > 0), 
                      'FALSE with missing skills list', v_temp_reason);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-09', 'Missing-skill rejection', FALSE, 'FALSE', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 10: Graduation-year Rejection
    -- ------------------------------------------------------------------------
    -- Kabir Joshi (1007) is 2026 batch, applying for Amazon (203) which accepts only 2025
    BEGIN
        v_is_eligible := PLACEMENT_PKG.check_eligibility(1007, 203, v_temp_reason);
        report_result('TC-10', 'Graduation-year rejection', (NOT v_is_eligible AND INSTR(v_temp_reason, 'Graduation year') > 0), 
                      'FALSE with batch mismatch message', v_temp_reason);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-10', 'Graduation-year rejection', FALSE, 'FALSE', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 11: Inactive-job Rejection
    -- ------------------------------------------------------------------------
    -- Job 207 (Google AI Intern) is INACTIVE (is_active = 'N')
    BEGIN
        v_is_eligible := PLACEMENT_PKG.check_eligibility(1001, 207, v_temp_reason);
        report_result('TC-11', 'Inactive-job rejection', (NOT v_is_eligible AND INSTR(v_temp_reason, 'INACTIVE') > 0), 
                      'FALSE with job inactive message', v_temp_reason);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-11', 'Inactive-job rejection', FALSE, 'FALSE', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 12: Successful Application Submission
    -- ------------------------------------------------------------------------
    -- Link Skill 3 (Oracle SQL) to Test Candidate Alpha (v_temp_stud_id) so candidate qualifies for v_temp_job_id
    BEGIN
        PLACEMENT_PKG.add_student_skill(v_temp_stud_id, 3);
        PLACEMENT_PKG.apply_for_job(v_temp_stud_id, v_temp_job_id, v_temp_app_id);
        report_result('TC-12', 'Successful application submission', (v_temp_app_id IS NOT NULL), 
                      'Application created with initial state APPLIED', 'Application ID: ' || v_temp_app_id);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-12', 'Successful application submission', FALSE, 'Success', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 13: Duplicate Application Prevention
    -- ------------------------------------------------------------------------
    BEGIN
        -- Re-apply same student to same job
        PLACEMENT_PKG.apply_for_job(v_temp_stud_id, v_temp_job_id, v_temp_app_id);
        report_result('TC-13', 'Duplicate application prevention', FALSE, 
                      'Exception ERR_DUPLICATE_APPLICATION (-20005)', 'Allowed duplicate application');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = PLACEMENT_PKG.ERR_DUPLICATE_APPLICATION OR SQLCODE = -1 THEN
                report_result('TC-13', 'Duplicate application prevention', TRUE, 
                              'Rejection with ERR_DUPLICATE_APPLICATION', 'Caught: ' || SQLERRM);
            ELSE
                report_result('TC-13', 'Duplicate application prevention', FALSE, 
                              'ERR_DUPLICATE_APPLICATION', SQLERRM);
            END IF;
    END;

    -- ------------------------------------------------------------------------
    -- TEST 14: Valid Status Transition (APPLIED -> SHORTLISTED)
    -- ------------------------------------------------------------------------
    BEGIN
        PLACEMENT_PKG.update_application_status(v_temp_app_id, 'SHORTLISTED');
        SELECT application_status INTO v_curr_status FROM APPLICATIONS WHERE application_id = v_temp_app_id;
        report_result('TC-14', 'Valid status transition (APPLIED -> SHORTLISTED)', (v_curr_status = 'SHORTLISTED'), 
                      'Status changed to SHORTLISTED', 'Current Status: ' || v_curr_status);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-14', 'Valid status transition', FALSE, 'SHORTLISTED', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 15: Invalid Status Transition Rejection
    -- ------------------------------------------------------------------------
    -- Transition SHORTLISTED to an invalid state or from terminal state
    BEGIN
        -- Advance to SELECTED, then attempt illegal transition backwards to APPLIED
        PLACEMENT_PKG.update_application_status(v_temp_app_id, 'SELECTED');
        PLACEMENT_PKG.update_application_status(v_temp_app_id, 'APPLIED');
        report_result('TC-15', 'Invalid status transition rejection', FALSE, 
                      'Exception ERR_INVALID_STATUS_TRANSITION (-20006)', 'Illegal transition allowed');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = PLACEMENT_PKG.ERR_INVALID_STATUS_TRANSITION THEN
                report_result('TC-15', 'Invalid status transition rejection', TRUE, 
                              'Rejection with ERR_INVALID_STATUS_TRANSITION', 'Caught: ' || SQLERRM);
            ELSE
                report_result('TC-15', 'Invalid status transition rejection', FALSE, 
                              'ERR_INVALID_STATUS_TRANSITION', SQLERRM);
            END IF;
    END;

    -- ------------------------------------------------------------------------
    -- TEST 16: Automatic Audit Record Creation via Trigger
    -- ------------------------------------------------------------------------
    BEGIN
        SELECT COUNT(*) INTO v_audit_count
        FROM APPLICATION_STATUS_HISTORY
        WHERE application_id = v_temp_app_id;

        -- We transitioned APPLIED -> SHORTLISTED -> SELECTED = 2 trigger audit rows
        report_result('TC-16', 'Automatic audit log creation (TRG_APP_STATUS_AUDIT)', (v_audit_count >= 2), 
                      'At least 2 audit rows created', 'Audit rows count: ' || v_audit_count);
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-16', 'Automatic audit log creation', FALSE, '>= 2', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 17: Application Timestamp Updates via Trigger
    -- ------------------------------------------------------------------------
    BEGIN
        SELECT applied_at, updated_at INTO v_timestamp_before, v_timestamp_after
        FROM APPLICATIONS WHERE application_id = v_temp_app_id;

        report_result('TC-17', 'Application timestamp update (TRG_APP_TIMESTAMP)', (v_timestamp_after >= v_timestamp_before), 
                      'updated_at synchronized to current timestamp', 'Updated At: ' || TO_CHAR(v_timestamp_after, 'YYYY-MM-DD HH24:MI:SS'));
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-17', 'Application timestamp update', FALSE, 'Success', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 18: Placement Statistics Verification
    -- ------------------------------------------------------------------------
    BEGIN
        DECLARE
            v_placed_cnt NUMBER;
        BEGIN
            SELECT total_placed_students INTO v_placed_cnt FROM VW_OVERALL_PLACEMENT_STATS;
            report_result('TC-18', 'Placement KPI view returns valid metrics', (v_placed_cnt > 0), 
                          'Positive count of placed students', 'Placed students count: ' || v_placed_cnt);
        END;
    EXCEPTION
        WHEN OTHERS THEN
            report_result('TC-18', 'Placement KPI view returns valid metrics', FALSE, '> 0', SQLERRM);
    END;

    -- ------------------------------------------------------------------------
    -- TEST 19: Transaction Rollback After Multi-step Failure
    -- ------------------------------------------------------------------------
    BEGIN
        SAVEPOINT sp_test_rollback;

        -- Step 1: Create a temporary test student
        INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs)
        VALUES ('Rollback Test Student', 'rollback.test@campus.edu', 8.00, 2025, 0);

        -- Step 2: Attempt an illegal operation that fails (Violates check constraint: negative backlogs)
        INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs)
        VALUES ('Illegal Student', 'illegal.test@campus.edu', 8.00, 2025, -5);

        -- Should not reach here
        ROLLBACK TO sp_test_rollback;
        report_result('TC-19', 'Transaction rollback after operation failure', FALSE, 
                      'Exception triggered rollback', 'Operation succeeded unexpectedly');
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO sp_test_rollback;
            -- Verify that the first student was safely rolled back
            DECLARE
                v_check_exists NUMBER;
            BEGIN
                SELECT COUNT(*) INTO v_check_exists FROM STUDENTS WHERE email = 'rollback.test@campus.edu';
                report_result('TC-19', 'Transaction rollback after operation failure', (v_check_exists = 0), 
                              'Zero dirty records left in database', 'Uncommitted records rolled back successfully');
            END;
    END;

    -- ------------------------------------------------------------------------
    -- TEST 20: Foreign Key Constraint Violation Prevention
    -- ------------------------------------------------------------------------
    BEGIN
        -- Attempt to insert an application for a non-existent student (e.g., 999999)
        INSERT INTO APPLICATIONS (student_id, job_id, application_status)
        VALUES (999999, 201, 'APPLIED');

        report_result('TC-20', 'Foreign key referential integrity violation', FALSE, 
                      'ORA-02291 integrity constraint violation', 'Invalid foreign key accepted');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -2291 THEN
                report_result('TC-20', 'Foreign key referential integrity violation', TRUE, 
                              'Caught ORA-02291 FK violation', 'Integrity constraint verified: ' || SQLERRM);
            ELSE
                report_result('TC-20', 'Foreign key referential integrity violation', FALSE, 
                              'ORA-02291', SQLERRM);
            END IF;
    END;

    -- ------------------------------------------------------------------------
    -- SUMMARY OF TEST SUITE EXECUTION
    -- ------------------------------------------------------------------------
    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('TEST SUITE EXECUTION SUMMARY');
    DBMS_OUTPUT.PUT_LINE('Total Test Cases Run : ' || v_test_count);
    DBMS_OUTPUT.PUT_LINE('Total Tests Passed   : ' || v_pass_count);
    DBMS_OUTPUT.PUT_LINE('Total Tests Failed   : ' || v_fail_count);
    DBMS_OUTPUT.PUT_LINE('Suite Success Rate   : ' || ROUND((v_pass_count / v_test_count) * 100, 2) || '%');
    DBMS_OUTPUT.PUT_LINE('========================================================================================');

    -- Cleanup test candidate and job created specifically for test suite
    ROLLBACK;
END;
/
