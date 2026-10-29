-- ============================================================================
-- SCRIPT: 06_views_and_reports.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: Create standardized database views, aggregation summaries,
--          analytical window queries, and administrative reports.
-- ============================================================================

SET DEFINE OFF;
SET FEEDBACK ON;

PROMPT ============================================================================
PROMPT REPORT VIEW 1: VW_STUDENT_DIRECTORY
PROMPT Full student academic profile with aggregated technical skill tags.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_STUDENT_DIRECTORY AS
SELECT 
    s.student_id,
    s.student_name,
    s.email,
    s.cgpa,
    s.graduation_year,
    s.active_backlogs,
    NVL(
        LISTAGG(sk.skill_name, ', ') WITHIN GROUP (ORDER BY sk.skill_name), 
        'No skills listed'
    ) AS acquired_skills,
    s.created_at
FROM STUDENTS s
LEFT JOIN STUDENT_SKILLS ss ON s.student_id = ss.student_id
LEFT JOIN SKILLS sk ON ss.skill_id = sk.skill_id
GROUP BY 
    s.student_id,
    s.student_name,
    s.email,
    s.cgpa,
    s.graduation_year,
    s.active_backlogs,
    s.created_at;

PROMPT ============================================================================
PROMPT REPORT VIEW 2: VW_COMPANY_DIRECTORY
PROMPT Recruiter directory with total openings and active drives.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_COMPANY_DIRECTORY AS
SELECT 
    c.company_id,
    c.company_name,
    c.industry,
    c.contact_email,
    COUNT(j.job_id) AS total_openings_posted,
    COUNT(CASE WHEN j.is_active = 'Y' THEN 1 END) AS active_drives_count
FROM COMPANIES c
LEFT JOIN JOBS j ON c.company_id = j.company_id
GROUP BY 
    c.company_id,
    c.company_name,
    c.industry,
    c.contact_email;

PROMPT ============================================================================
PROMPT REPORT VIEW 3: VW_ACTIVE_JOBS
PROMPT Active job openings with passing batches and prerequisite skills.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_ACTIVE_JOBS AS
SELECT 
    j.job_id,
    c.company_name,
    j.job_title,
    j.package_lpa,
    j.minimum_cgpa,
    j.maximum_backlogs,
    (
        SELECT LISTAGG(graduation_year, ', ') WITHIN GROUP (ORDER BY graduation_year)
        FROM JOB_ELIGIBLE_YEARS y
        WHERE y.job_id = j.job_id
    ) AS eligible_batches,
    NVL(
        (
            SELECT LISTAGG(sk.skill_name, ', ') WITHIN GROUP (ORDER BY sk.skill_name)
            FROM JOB_REQUIRED_SKILLS rs
            JOIN SKILLS sk ON rs.skill_id = sk.skill_id
            WHERE rs.job_id = j.job_id
        ), 
        'None (Open to all skills)'
    ) AS mandatory_skills,
    j.created_at
FROM JOBS j
JOIN COMPANIES c ON j.company_id = c.company_id
WHERE j.is_active = 'Y';

PROMPT ============================================================================
PROMPT REPORT VIEW 4: VW_STUDENT_APPLICATION_HISTORY
PROMPT Master application lifecycle records with timestamps and employer details.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_STUDENT_APPLICATION_HISTORY AS
SELECT 
    a.application_id,
    s.student_id,
    s.student_name,
    s.email AS student_email,
    c.company_name,
    j.job_title,
    j.package_lpa,
    a.application_status,
    a.applied_at,
    a.updated_at
FROM APPLICATIONS a
JOIN STUDENTS s ON a.student_id = s.student_id
JOIN JOBS j ON a.job_id = j.job_id
JOIN COMPANIES c ON j.company_id = c.company_id;

PROMPT ============================================================================
PROMPT REPORT VIEW 5: VW_COMPANY_APPLICATION_STATS
PROMPT Recruiter application breakdown (Applied, Shortlisted, Selected, Rejected).
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_COMPANY_APPLICATION_STATS AS
SELECT 
    c.company_name,
    c.industry,
    COUNT(a.application_id) AS total_applications,
    COUNT(CASE WHEN a.application_status = 'APPLIED' THEN 1 END) AS applied_count,
    COUNT(CASE WHEN a.application_status = 'SHORTLISTED' THEN 1 END) AS shortlisted_count,
    COUNT(CASE WHEN a.application_status = 'SELECTED' THEN 1 END) AS selected_count,
    COUNT(CASE WHEN a.application_status = 'REJECTED' THEN 1 END) AS rejected_count,
    COUNT(CASE WHEN a.application_status = 'WITHDRAWN' THEN 1 END) AS withdrawn_count
FROM COMPANIES c
JOIN JOBS j ON c.company_id = j.company_id
LEFT JOIN APPLICATIONS a ON j.job_id = a.job_id
GROUP BY c.company_name, c.industry;

PROMPT ============================================================================
PROMPT REPORT VIEW 6: VW_SHORTLISTED_STUDENTS
PROMPT Currently shortlisted candidates across all recruitment drives.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_SHORTLISTED_STUDENTS AS
SELECT 
    a.application_id,
    s.student_id,
    s.student_name,
    s.cgpa,
    s.graduation_year,
    c.company_name,
    j.job_title,
    j.package_lpa,
    a.updated_at AS shortlisted_at
FROM APPLICATIONS a
JOIN STUDENTS s ON a.student_id = s.student_id
JOIN JOBS j ON a.job_id = j.job_id
JOIN COMPANIES c ON j.company_id = c.company_id
WHERE a.application_status = 'SHORTLISTED';

PROMPT ============================================================================
PROMPT REPORT VIEW 7: VW_SELECTED_STUDENTS
PROMPT Placed students who received confirmed job offer letters.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_SELECTED_STUDENTS AS
SELECT 
    a.application_id,
    s.student_id,
    s.student_name,
    s.email,
    s.cgpa,
    c.company_name,
    j.job_title,
    j.package_lpa,
    a.updated_at AS selection_date
FROM APPLICATIONS a
JOIN STUDENTS s ON a.student_id = s.student_id
JOIN JOBS j ON a.job_id = j.job_id
JOIN COMPANIES c ON j.company_id = c.company_id
WHERE a.application_status = 'SELECTED';

PROMPT ============================================================================
PROMPT REPORT VIEW 8: VW_OVERALL_PLACEMENT_STATS
PROMPT Executive high-level KPI dashboard metrics.
PROMPT ============================================================================

CREATE OR REPLACE VIEW VW_OVERALL_PLACEMENT_STATS AS
SELECT 
    (SELECT COUNT(*) FROM STUDENTS) AS total_enrolled_students,
    (SELECT COUNT(*) FROM STUDENTS WHERE graduation_year = 2025) AS final_year_students,
    (SELECT COUNT(DISTINCT student_id) FROM APPLICATIONS WHERE application_status = 'SELECTED') AS total_placed_students,
    (SELECT COUNT(*) FROM APPLICATIONS WHERE application_status = 'SELECTED') AS total_offer_letters,
    ROUND(
        (SELECT COUNT(DISTINCT student_id) FROM APPLICATIONS WHERE application_status = 'SELECTED') * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM STUDENTS WHERE graduation_year = 2025), 0),
        2
    ) AS placement_percentage_2025,
    (SELECT MAX(j.package_lpa) FROM APPLICATIONS a JOIN JOBS j ON a.job_id = j.job_id WHERE a.application_status = 'SELECTED') AS highest_package_lpa,
    (SELECT ROUND(AVG(j.package_lpa), 2) FROM APPLICATIONS a JOIN JOBS j ON a.job_id = j.job_id WHERE a.application_status = 'SELECTED') AS average_package_lpa,
    (SELECT COUNT(*) FROM JOBS WHERE is_active = 'Y') AS active_job_drives
FROM DUAL;

PROMPT ============================================================================
PROMPT EXECUTABLE ANALYTICAL & PARAMETERIZED REPORT QUERIES
PROMPT ============================================================================

-- Query A: Eligible Students for TCS Database Developer (Job 204)
PROMPT --- Query A: Qualified Students for Job ID 204 (TCS Database Developer) ---
SELECT 
    s.student_id,
    s.student_name,
    s.cgpa,
    s.graduation_year,
    s.active_backlogs,
    PLACEMENT_PKG.is_student_eligible(s.student_id, 204) AS is_eligible
FROM STUDENTS s
WHERE PLACEMENT_PKG.is_student_eligible(s.student_id, 204) = 'YES'
ORDER BY s.cgpa DESC;

-- Query B: Ineligible Students with Specific Detailed Explanations for Google Cloud (Job 201)
PROMPT --- Query B: Ineligible Students with Explanations for Job ID 201 (Google Cloud) ---
SELECT 
    s.student_id,
    s.student_name,
    s.cgpa,
    s.graduation_year,
    s.active_backlogs,
    PLACEMENT_PKG.get_ineligibility_reason(s.student_id, 201) AS rejection_reason
FROM STUDENTS s
WHERE PLACEMENT_PKG.is_student_eligible(s.student_id, 201) = 'NO'
ORDER BY s.student_id;

-- Query C: Students Qualifying for the Greatest Number of Active Job Opportunities
-- Uses SQL Analytical Window Function DENSE_RANK()
PROMPT --- Query C: Top Versatile Students Ranked by Eligible Opportunities ---
WITH StudentOpportunityCounts AS (
    SELECT 
        s.student_id,
        s.student_name,
        s.cgpa,
        COUNT(j.job_id) AS qualified_openings_count
    FROM STUDENTS s
    CROSS JOIN JOBS j
    WHERE j.is_active = 'Y'
      AND PLACEMENT_PKG.is_student_eligible(s.student_id, j.job_id) = 'YES'
    GROUP BY s.student_id, s.student_name, s.cgpa
)
SELECT 
    DENSE_RANK() OVER (ORDER BY qualified_openings_count DESC, cgpa DESC) AS opportunity_rank,
    student_id,
    student_name,
    cgpa,
    qualified_openings_count
FROM StudentOpportunityCounts
ORDER BY opportunity_rank, cgpa DESC;

PROMPT Views and reports configured successfully.
