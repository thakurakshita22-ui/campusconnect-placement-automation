-- ============================================================================
-- SCRIPT: run_all.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: Master execution script running all project modules in correct order:
--          1. Schema Creation (01_schema.sql)
--          2. Sample Data Population (02_sample_data.sql)
--          3. Package Specification (03_package_spec.sql)
--          4. Package Body (04_package_body.sql)
--          5. Database Triggers (05_triggers.sql)
--          6. Views and Report Queries (06_views_and_reports.sql)
--          7. Automated Test Suite (07_test_cases.sql)
-- ============================================================================

SET ECHO OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE UNLIMITED;

PROMPT ============================================================================
PROMPT STARTING FULL PROJECT DEPLOYMENT
PROMPT ============================================================================

PROMPT Executing: 01_schema.sql...
@@01_schema.sql

PROMPT Executing: 02_sample_data.sql...
@@02_sample_data.sql

PROMPT Executing: 03_package_spec.sql...
@@03_package_spec.sql

PROMPT Executing: 04_package_body.sql...
@@04_package_body.sql

PROMPT Executing: 05_triggers.sql...
@@05_triggers.sql

PROMPT Executing: 06_views_and_reports.sql...
@@06_views_and_reports.sql

PROMPT Executing: 07_test_cases.sql...
@@07_test_cases.sql

PROMPT ============================================================================
PROMPT FULL DEPLOYMENT & TESTING COMPLETE!
PROMPT To view the live viva demonstration, run: @08_demo.sql
PROMPT ============================================================================
