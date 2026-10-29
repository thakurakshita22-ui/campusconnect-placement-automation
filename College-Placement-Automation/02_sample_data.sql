-- ============================================================================
-- SCRIPT: 02_sample_data.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: Insert realistic, internally consistent seed data in strict
--          foreign-key dependency order.
-- ============================================================================

SET DEFINE OFF;
SET FEEDBACK ON;

PROMPT ============================================================================
PROMPT POPULATING MASTER SKILLS (8 Technical Proficiencies)
PROMPT ============================================================================

INSERT INTO SKILLS (skill_name) VALUES ('Java');
INSERT INTO SKILLS (skill_name) VALUES ('Python');
INSERT INTO SKILLS (skill_name) VALUES ('Oracle SQL');
INSERT INTO SKILLS (skill_name) VALUES ('PL/SQL');
INSERT INTO SKILLS (skill_name) VALUES ('React');
INSERT INTO SKILLS (skill_name) VALUES ('Spring Boot');
INSERT INTO SKILLS (skill_name) VALUES ('Cloud Computing (AWS)');
INSERT INTO SKILLS (skill_name) VALUES ('Machine Learning');

COMMIT;

PROMPT ============================================================================
PROMPT POPULATING COMPANIES (5 Enterprise Recruiters)
PROMPT ============================================================================

INSERT INTO COMPANIES (company_name, industry, contact_email) 
VALUES ('Google Cloud', 'Information Technology', 'campus-recruiting@google.com');

INSERT INTO COMPANIES (company_name, industry, contact_email) 
VALUES ('Microsoft Corporation', 'Software Engineering', 'university-hires@microsoft.com');

INSERT INTO COMPANIES (company_name, industry, contact_email) 
VALUES ('Amazon Web Services', 'Cloud & E-Commerce', 'aws-placement@amazon.com');

INSERT INTO COMPANIES (company_name, industry, contact_email) 
VALUES ('Tata Consultancy Services', 'IT Services & Consulting', 'campus.connect@tcs.com');

INSERT INTO COMPANIES (company_name, industry, contact_email) 
VALUES ('Infosys Limited', 'IT Solutions', 'talent.acquisition@infosys.com');

COMMIT;

PROMPT ============================================================================
PROMPT POPULATING STUDENTS (10 Realistic Academic Profiles)
PROMPT ============================================================================

-- 1. All-Rounder Topper (High CGPA, 0 backlogs, 2025 batch)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Aarav Sharma', 'aarav.sharma@campus.edu', 9.45, 2025, 0);

-- 2. Strong Developer (Good CGPA, 0 backlogs, 2025 batch)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Diya Patel', 'diya.patel@campus.edu', 8.80, 2025, 0);

-- 3. Database & Backend Specialist (Good CGPA, 0 backlogs, 2025 batch)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Rohan Iyer', 'rohan.iyer@campus.edu', 8.20, 2025, 0);

-- 4. Borderline Cutoff Student (Moderate CGPA 7.10, 0 backlogs, 2025 batch)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Ananya Sen', 'ananya.sen@campus.edu', 7.10, 2025, 0);

-- 5. Student with 1 Active Backlog (6.90 CGPA, 1 backlog, 2025 batch - tests backlog rule)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Vikram Malhotra', 'vikram.m@campus.edu', 6.90, 2025, 1);

-- 6. Student with Multiple Backlogs (5.80 CGPA, 3 backlogs, 2025 batch - fails backlog cutoff)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Neha Verma', 'neha.verma@campus.edu', 5.80, 2025, 3);

-- 7. Junior Student (High CGPA 9.10, 0 backlogs, 2026 batch - tests graduation year mismatch)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Kabir Joshi', 'kabir.joshi@campus.edu', 9.10, 2026, 0);

-- 8. Already Graduated Alumnus (8.40 CGPA, 0 backlogs, 2024 batch - tests past batch eligibility)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Pooja Nair', 'pooja.nair@campus.edu', 8.40, 2024, 0);

-- 9. Front-End / Web Specialist (7.65 CGPA, 0 backlogs, 2025 batch)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Karthik Reddy', 'karthik.r@campus.edu', 7.65, 2025, 0);

-- 10. Low CGPA Student (6.10 CGPA, 0 backlogs, 2025 batch - tests CGPA rejection on Tier-1 jobs)
INSERT INTO STUDENTS (student_name, email, cgpa, graduation_year, active_backlogs) 
VALUES ('Sneha Kulkarni', 'sneha.k@campus.edu', 6.10, 2025, 0);

COMMIT;

PROMPT ============================================================================
PROMPT MAPPING STUDENT SKILLS
PROMPT ============================================================================

-- Skill ID References:
-- 1: Java, 2: Python, 3: Oracle SQL, 4: PL/SQL, 5: React, 6: Spring Boot, 7: Cloud Computing (AWS), 8: Machine Learning

-- Aarav Sharma (ID 1001): Full stack + Cloud + ML + SQL
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1001, 1);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1001, 2);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1001, 3);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1001, 4);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1001, 7);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1001, 8);

-- Diya Patel (ID 1002): Java, Spring Boot, React, SQL
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1002, 1);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1002, 3);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1002, 5);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1002, 6);

-- Rohan Iyer (ID 1003): Oracle SQL, PL/SQL, Java, AWS
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1003, 1);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1003, 3);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1003, 4);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1003, 7);

-- Ananya Sen (ID 1004): Python, Oracle SQL, Machine Learning
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1004, 2);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1004, 3);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1004, 8);

-- Vikram Malhotra (ID 1005): Java, Oracle SQL
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1005, 1);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1005, 3);

-- Neha Verma (ID 1006): React, Python
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1006, 2);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1006, 5);

-- Kabir Joshi (ID 1007): Python, Machine Learning, AWS
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1007, 2);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1007, 7);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1007, 8);

-- Pooja Nair (ID 1008): Java, Spring Boot, AWS, Oracle SQL
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1008, 1);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1008, 3);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1008, 6);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1008, 7);

-- Karthik Reddy (ID 1009): React, Java, Oracle SQL
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1009, 1);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1009, 3);
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1009, 5);

-- Sneha Kulkarni (ID 1010): Oracle SQL
INSERT INTO STUDENT_SKILLS (student_id, skill_id) VALUES (1010, 3);

COMMIT;

PROMPT ============================================================================
PROMPT POPULATING JOB OPPORTUNITIES (8 Openings: Active & Inactive)
PROMPT ============================================================================

-- Company ID References:
-- 501: Google Cloud
-- 502: Microsoft Corporation
-- 503: Amazon Web Services
-- 504: Tata Consultancy Services
-- 505: Infosys Limited

-- Job 201: Google - Cloud Systems Engineer (High CGPA 8.5, 0 backlogs, Active)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (501, 'Cloud Systems Engineer', 28.50, 8.50, 0, 'Y');

-- Job 202: Microsoft - Software Development Engineer (CGPA 8.0, 0 backlogs, Active)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (502, 'Software Development Engineer', 24.00, 8.00, 0, 'Y');

-- Job 203: Amazon - Cloud Solutions Associate (CGPA 7.5, 0 backlogs, Active)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (503, 'Cloud Solutions Associate', 19.50, 7.50, 0, 'Y');

-- Job 204: TCS - Database Developer (CGPA 7.0, 0 backlogs, Active)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (504, 'Database & PL/SQL Developer', 9.00, 7.00, 0, 'Y');

-- Job 205: Infosys - Specialist Programmer (CGPA 7.0, 1 backlog permitted, Active)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (505, 'Specialist Programmer', 9.50, 7.00, 1, 'Y');

-- Job 206: Microsoft - Full Stack Web Engineer (CGPA 7.8, 0 backlogs, Active)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (502, 'Full Stack Web Engineer', 22.00, 7.80, 0, 'Y');

-- Job 207: Google - AI/ML Research Intern (CGPA 9.0, 0 backlogs, INACTIVE - For Testing Inactive Rejection)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (501, 'AI/ML Research Intern', 18.00, 9.00, 0, 'N');

-- Job 208: TCS - Systems Engineer Trainee (CGPA 6.0, 1 backlog permitted, Active - Mass hiring)
INSERT INTO JOBS (company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, is_active) 
VALUES (504, 'Systems Engineer Trainee', 4.50, 6.00, 1, 'Y');

COMMIT;

PROMPT ============================================================================
PROMPT CONFIGURING JOB ELIGIBLE GRADUATION YEARS
PROMPT ============================================================================

-- Job 201 (Google Cloud): 2025 only
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (201, 2025);

-- Job 202 (Microsoft SDE): 2024 and 2025
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (202, 2024);
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (202, 2025);

-- Job 203 (Amazon AWS): 2025 only
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (203, 2025);

-- Job 204 (TCS DB Developer): 2025 only
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (204, 2025);

-- Job 205 (Infosys Specialist): 2025 only
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (205, 2025);

-- Job 206 (Microsoft Full Stack): 2025 only
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (206, 2025);

-- Job 207 (Google AI Inactive): 2025 and 2026
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (207, 2025);
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (207, 2026);

-- Job 208 (TCS Trainee): 2024, 2025
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (208, 2024);
INSERT INTO JOB_ELIGIBLE_YEARS (job_id, graduation_year) VALUES (208, 2025);

COMMIT;

PROMPT ============================================================================
PROMPT CONFIGURING JOB REQUIRED SKILLS
PROMPT ============================================================================

-- Job 201 (Google Cloud): Requires Cloud (7) and Python (2)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (201, 2);
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (201, 7);

-- Job 202 (Microsoft SDE): Requires Java (1) and Spring Boot (6)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (202, 1);
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (202, 6);

-- Job 203 (Amazon AWS): Requires Cloud (7) and Oracle SQL (3)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (203, 3);
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (203, 7);

-- Job 204 (TCS DB Developer): Requires Oracle SQL (3) and PL/SQL (4)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (204, 3);
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (204, 4);

-- Job 205 (Infosys Specialist): Requires Java (1)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (205, 1);

-- Job 206 (Microsoft Full Stack): Requires React (5) and Java (1)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (206, 1);
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (206, 5);

-- Job 207 (Google AI): Requires Python (2) and Machine Learning (8)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (207, 2);
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (207, 8);

-- Job 208 (TCS Trainee): Requires Oracle SQL (3)
INSERT INTO JOB_REQUIRED_SKILLS (job_id, skill_id) VALUES (208, 3);

COMMIT;

PROMPT ============================================================================
PROMPT POPULATING APPLICATIONS (15 Controlled Lifecycle Records)
PROMPT ============================================================================

-- 1. Aarav Sharma -> Google Cloud (Selected)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1001, 201, 'SELECTED', SYSTIMESTAMP - INTERVAL '20' DAY, SYSTIMESTAMP - INTERVAL '2' DAY);

-- 2. Aarav Sharma -> Amazon AWS (Shortlisted)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1001, 203, 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '15' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

-- 3. Diya Patel -> Microsoft SDE (Selected)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1002, 202, 'SELECTED', SYSTIMESTAMP - INTERVAL '18' DAY, SYSTIMESTAMP - INTERVAL '3' DAY);

-- 4. Diya Patel -> Microsoft Full Stack (Applied)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1002, 206, 'APPLIED', SYSTIMESTAMP - INTERVAL '10' DAY, SYSTIMESTAMP - INTERVAL '10' DAY);

-- 5. Rohan Iyer -> TCS DB Developer (Selected)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1003, 204, 'SELECTED', SYSTIMESTAMP - INTERVAL '25' DAY, SYSTIMESTAMP - INTERVAL '1' DAY);

-- 6. Rohan Iyer -> Amazon AWS (Shortlisted)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1003, 203, 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '14' DAY, SYSTIMESTAMP - INTERVAL '4' DAY);

-- 7. Ananya Sen -> Infosys Specialist (Applied - lacks Java in real life, but assume candidate applied)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1004, 208, 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '12' DAY, SYSTIMESTAMP - INTERVAL '6' DAY);

-- 8. Vikram Malhotra -> Infosys Specialist (Shortlisted - 1 backlog allowed)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1005, 205, 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '11' DAY, SYSTIMESTAMP - INTERVAL '4' DAY);

-- 9. Vikram Malhotra -> TCS Trainee (Applied)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1005, 208, 'APPLIED', SYSTIMESTAMP - INTERVAL '8' DAY, SYSTIMESTAMP - INTERVAL '8' DAY);

-- 10. Pooja Nair -> Microsoft SDE (Selected - 2024 batch eligible)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1008, 202, 'SELECTED', SYSTIMESTAMP - INTERVAL '19' DAY, SYSTIMESTAMP - INTERVAL '4' DAY);

-- 11. Pooja Nair -> Amazon AWS (Rejected during screening)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1008, 203, 'REJECTED', SYSTIMESTAMP - INTERVAL '16' DAY, SYSTIMESTAMP - INTERVAL '9' DAY);

-- 12. Karthik Reddy -> Microsoft Full Stack (Shortlisted)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1009, 206, 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '13' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

-- 13. Karthik Reddy -> TCS Trainee (Applied)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1009, 208, 'APPLIED', SYSTIMESTAMP - INTERVAL '7' DAY, SYSTIMESTAMP - INTERVAL '7' DAY);

-- 14. Sneha Kulkarni -> TCS Trainee (Applied)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1010, 208, 'APPLIED', SYSTIMESTAMP - INTERVAL '5' DAY, SYSTIMESTAMP - INTERVAL '5' DAY);

-- 15. Aarav Sharma -> TCS DB Developer (Withdrawn voluntarily after Google offer)
INSERT INTO APPLICATIONS (student_id, job_id, application_status, applied_at, updated_at) 
VALUES (1001, 204, 'WITHDRAWN', SYSTIMESTAMP - INTERVAL '22' DAY, SYSTIMESTAMP - INTERVAL '1' DAY);

COMMIT;

PROMPT ============================================================================
PROMPT SEEDING INITIAL APPLICATION STATUS AUDIT TRAIL
PROMPT ============================================================================

-- Seed status audit trail reflecting progression for key applications
INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8001, 'APPLIED', 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '10' DAY, 'ADMIN_PORTAL');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8001, 'SHORTLISTED', 'SELECTED', SYSTIMESTAMP - INTERVAL '2' DAY, 'GOOGLE_RECRUITER');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8003, 'APPLIED', 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '11' DAY, 'ADMIN_PORTAL');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8003, 'SHORTLISTED', 'SELECTED', SYSTIMESTAMP - INTERVAL '3' DAY, 'MSFT_HR');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8005, 'APPLIED', 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '15' DAY, 'ADMIN_PORTAL');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8005, 'SHORTLISTED', 'SELECTED', SYSTIMESTAMP - INTERVAL '1' DAY, 'TCS_RECRUITER');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8011, 'APPLIED', 'REJECTED', SYSTIMESTAMP - INTERVAL '9' DAY, 'AWS_SCREENING');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8015, 'APPLIED', 'SHORTLISTED', SYSTIMESTAMP - INTERVAL '12' DAY, 'ADMIN_PORTAL');

INSERT INTO APPLICATION_STATUS_HISTORY (application_id, old_status, new_status, changed_at, changed_by)
VALUES (8015, 'SHORTLISTED', 'WITHDRAWN', SYSTIMESTAMP - INTERVAL '1' DAY, 'STUDENT_PORTAL');

COMMIT;

PROMPT Sample data population completed successfully.
