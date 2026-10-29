-- ============================================================================
-- SCRIPT: 08_demo.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: 5-to-10 Minute Live Viva / Project Demonstration Script.
--          Walks step-by-step through core system capabilities:
--          Data retrieval, eligibility engine verification, application workflow,
--          exception rejection, audit trail verification, and executive reports.
--
-- INSTRUCTIONS FOR ORACLE SQL DEVELOPER:
-- 1. Open Oracle SQL Developer.
-- 2. Open the DBMS Output window: Menu -> View -> DBMS Output.
-- 3. Click the green '+' icon on the DBMS Output tab and select your connection.
-- 4. Open this file (08_demo.sql) and click 'Run Script' (or press F5).
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 200;
SET PAGESIZE 100;
SET FEEDBACK OFF;

PROMPT ============================================================================
PROMPT   SMART CAMPUS PLACEMENT & ELIGIBILITY AUTOMATION SYSTEM - LIVE DEMO
PROMPT ============================================================================

-- ----------------------------------------------------------------------------
-- DEMO STEP 1: STUDENT DIRECTORY OVERVIEW
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 1: VIEWING STUDENT PROFILES & SKILL PROFILES
PROMPT 
COLUMN student_id FORMAT 9999 HEADING "ID"
COLUMN student_name FORMAT A18 HEADING "NAME"
COLUMN email FORMAT A25 HEADING "EMAIL"
COLUMN cgpa FORMAT 90.00 HEADING "CGPA"
COLUMN graduation_year FORMAT 9999 HEADING "YEAR"
COLUMN active_backlogs FORMAT 99 HEADING "BACKLOGS"
COLUMN acquired_skills FORMAT A35 HEADING "TECHNICAL SKILLS"

SELECT student_id, student_name, cgpa, graduation_year, active_backlogs, acquired_skills
FROM VW_STUDENT_DIRECTORY
WHERE ROWNUM <= 5;

-- ----------------------------------------------------------------------------
-- DEMO STEP 2: ACTIVE RECRUITMENT DRIVES & OPENINGS
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 2: VIEWING ACTIVE PLACEMENT DRIVES & PREREQUISITES
PROMPT 
COLUMN job_id FORMAT 9999 HEADING "JOB ID"
COLUMN company_name FORMAT A20 HEADING "COMPANY"
COLUMN job_title FORMAT A26 HEADING "POSITION"
COLUMN package_lpa FORMAT 90.00 HEADING "LPA"
COLUMN minimum_cgpa FORMAT 90.00 HEADING "MIN CGPA"
COLUMN eligible_batches FORMAT A14 HEADING "BATCHES"
COLUMN mandatory_skills FORMAT A30 HEADING "PREREQUISITE SKILLS"

SELECT job_id, company_name, job_title, package_lpa, minimum_cgpa, eligible_batches, mandatory_skills
FROM VW_ACTIVE_JOBS
WHERE ROWNUM <= 5;

-- ----------------------------------------------------------------------------
-- DEMO STEP 3: ELIGIBILITY CHECK FOR A FULLY QUALIFIED STUDENT
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 3: AUTOMATED ELIGIBILITY CHECK - SUCCESS CASE
PROMPT Student: Aarav Sharma (ID: 1001) | Job: Google Cloud Systems Engineer (ID: 201)
PROMPT Criteria: Min CGPA 8.50, Max Backlogs 0, Batch 2025, Skills: Python, Cloud Computing
PROMPT 
DECLARE
    v_status  VARCHAR2(10);
    v_details VARCHAR2(4000);
BEGIN
    PLACEMENT_PKG.check_eligibility_desc(
        p_student_id  => 1001,
        p_job_id      => 201,
        o_is_eligible => v_status,
        o_reasons     => v_details
    );
END;
/

-- ----------------------------------------------------------------------------
-- DEMO STEP 4: ELIGIBILITY CHECK FOR AN INELIGIBLE STUDENT
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 4: AUTOMATED ELIGIBILITY CHECK - DISQUALIFIED CASE
PROMPT Student: Sneha Kulkarni (ID: 1010) | Job: Google Cloud Systems Engineer (ID: 201)
PROMPT Expected: Rejection due to CGPA below cutoff (6.10 < 8.50) and missing skills
PROMPT 
DECLARE
    v_status  VARCHAR2(10);
    v_details VARCHAR2(4000);
BEGIN
    PLACEMENT_PKG.check_eligibility_desc(
        p_student_id  => 1010,
        p_job_id      => 201,
        o_is_eligible => v_status,
        o_reasons     => v_details
    );
END;
/

-- ----------------------------------------------------------------------------
-- DEMO STEP 5: LIST ALL QUALIFIED CANDIDATES FOR A DRIVE (CURSOR PROCESSING)
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 5: CURSOR DEMO - IDENTIFYING ALL QUALIFIED STUDENTS FOR A JOB
PROMPT Target Job: TCS Database & PL/SQL Developer (Job ID: 204)
PROMPT Required Skills: Oracle SQL, PL/SQL | Min CGPA: 7.00 | Backlogs: 0
PROMPT 
BEGIN
    PLACEMENT_PKG.get_eligible_students(p_job_id => 204);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO STEP 6: APPLICATION SUBMISSION WORKFLOW
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 6: SUBMITTING AN APPLICATION WITH AUTOMATIC VALIDATION
PROMPT Student: Diya Patel (ID: 1002) | Job: TCS Systems Engineer Trainee (ID: 208)
PROMPT Note: Diya has CGPA 8.80, 0 backlogs, 2025 batch, Oracle SQL skill -> Meets all criteria
PROMPT 
DECLARE
    v_app_id NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting application submission...');
    PLACEMENT_PKG.apply_for_job(
        p_student_id     => 1002,
        p_job_id         => 208,
        o_application_id => v_app_id
    );
    DBMS_OUTPUT.PUT_LINE('Result: Application successfully created with ID: ' || v_app_id);
    -- Rollback to preserve initial demo dataset
    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('[Demo Rollback executed to keep test clean]');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Handled expected outcome: ' || SQLERRM);
        ROLLBACK;
END;
/

-- ----------------------------------------------------------------------------
-- DEMO STEP 7: PREVENTING DUPLICATE APPLICATIONS
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 7: ENFORCING INTEGRITY - DUPLICATE APPLICATION PREVENTION
PROMPT Attempting to re-apply Aarav Sharma (1001) for Google Cloud (201)
PROMPT 
DECLARE
    v_app_id NUMBER;
BEGIN
    PLACEMENT_PKG.apply_for_job(
        p_student_id     => 1001,
        p_job_id         => 201,
        o_application_id => v_app_id
    );
    DBMS_OUTPUT.PUT_LINE('ERROR: System permitted duplicate application!');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Success: Duplicate caught and blocked.');
        DBMS_OUTPUT.PUT_LINE('Exception Code: ' || SQLCODE);
        DBMS_OUTPUT.PUT_LINE('Exception Message: ' || SQLERRM);
END;
/

-- ----------------------------------------------------------------------------
-- DEMO STEP 8: CONTROLLED STATUS TRANSITION & TRIGGER AUDITING
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 8: APPLICATION STATE MACHINE & AUTOMATED AUDIT TRAIL
PROMPT Updating Application 8002 (Aarav Sharma -> Amazon AWS) from SHORTLISTED -> SELECTED
PROMPT 
BEGIN
    PLACEMENT_PKG.update_application_status(
        p_application_id => 8002,
        p_new_status     => 'SELECTED'
    );
    COMMIT;
END;
/

PROMPT 
PROMPT Verifying that TRIGGER trg_app_status_audit recorded the transition:
COLUMN history_id FORMAT 9999 HEADING "HIST ID"
COLUMN application_id FORMAT 999999 HEADING "APP ID"
COLUMN old_status FORMAT A15 HEADING "PREVIOUS STATE"
COLUMN new_status FORMAT A15 HEADING "NEW STATE"
COLUMN changed_at FORMAT A25 HEADING "CHANGED AT"
COLUMN changed_by FORMAT A15 HEADING "CHANGED BY"

SELECT history_id, application_id, old_status, new_status, 
       TO_CHAR(changed_at, 'YYYY-MM-DD HH24:MI:SS') AS changed_at, changed_by
FROM APPLICATION_STATUS_HISTORY
WHERE application_id = 8002
ORDER BY history_id DESC;

-- ----------------------------------------------------------------------------
-- DEMO STEP 9: COMPANY-WISE PLACEMENT PERFORMANCE REPORT
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 9: COMPANY RECRUITMENT PERFORMANCE BREAKDOWN
PROMPT 
COLUMN company_name FORMAT A25 HEADING "COMPANY"
COLUMN industry FORMAT A22 HEADING "INDUSTRY"
COLUMN total_applications FORMAT 9999 HEADING "APPS"
COLUMN shortlisted_count FORMAT 9999 HEADING "SHORTLIST"
COLUMN selected_count FORMAT 9999 HEADING "SELECTED"
COLUMN rejected_count FORMAT 9999 HEADING "REJECTED"

SELECT company_name, industry, total_applications, shortlisted_count, selected_count, rejected_count
FROM VW_COMPANY_APPLICATION_STATS;

-- ----------------------------------------------------------------------------
-- DEMO STEP 10: EXECUTIVE PLACEMENT DASHBOARD SUMMARY
-- ----------------------------------------------------------------------------
PROMPT 
PROMPT >>> DEMO STEP 10: EXECUTIVE PLACEMENT SUMMARY (VIA PLACEMENT_PKG)
PROMPT 
BEGIN
    PLACEMENT_PKG.generate_placement_summary;
END;
/

PROMPT ============================================================================
PROMPT LIVE DEMONSTRATION COMPLETE - READY FOR QUESTIONS & EVALUATION
PROMPT ============================================================================
