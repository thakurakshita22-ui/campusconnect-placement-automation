-- ============================================================================
-- SCRIPT: 05_triggers.sql
-- PROJECT: Smart Campus Placement and Eligibility Automation System
-- PURPOSE: Implement enterprise-grade database triggers for:
--          1. Automated, tamper-proof status audit trail logging.
--          2. Automated last-updated timestamp synchronization.
-- ============================================================================

SET DEFINE OFF;
SET FEEDBACK ON;

PROMPT ============================================================================
PROMPT CREATING TRIGGER: TRG_APP_TIMESTAMP
PROMPT Purpose: Automatically synchronizes updated_at timestamp on any modification
PROMPT ============================================================================

CREATE OR REPLACE TRIGGER trg_app_timestamp
BEFORE UPDATE ON APPLICATIONS
FOR EACH ROW
BEGIN
    :NEW.updated_at := SYSTIMESTAMP;
END;
/
SHOW ERRORS TRIGGER trg_app_timestamp;

PROMPT ============================================================================
PROMPT CREATING TRIGGER: TRG_APP_STATUS_AUDIT
PROMPT Purpose: Captures an immutable audit log row whenever an application's
PROMPT          status genuinely changes. Ignores updates where status is identical.
PROMPT ============================================================================

CREATE OR REPLACE TRIGGER trg_app_status_audit
AFTER UPDATE OF application_status ON APPLICATIONS
FOR EACH ROW
WHEN (
    -- Only fire when the status genuinely changes
    OLD.application_status != NEW.application_status 
    OR (OLD.application_status IS NULL AND NEW.application_status IS NOT NULL)
    OR (OLD.application_status IS NOT NULL AND NEW.application_status IS NULL)
)
BEGIN
    INSERT INTO APPLICATION_STATUS_HISTORY (
        application_id,
        old_status,
        new_status,
        changed_at,
        changed_by
    ) VALUES (
        :NEW.application_id,
        :OLD.application_status,
        :NEW.application_status,
        SYSTIMESTAMP,
        USER
    );
END;
/
SHOW ERRORS TRIGGER trg_app_status_audit;

PROMPT ============================================================================
PROMPT ARCHITECTURAL JUSTIFICATION: TRIGGERS VS DECLARATIVE CONSTRAINTS
PROMPT ============================================================================
-- 1. WHY AUDITING BELONGS IN A TRIGGER:
--    An audit log must capture changes regardless of which tool or user interface
--    executed the SQL (SQL Developer, web API, PL/SQL package, or batch ETL).
--    Placing the audit in an AFTER UPDATE trigger guarantees an unforgeable,
--    system-enforced audit record that cannot be forgotten by application code.
--
-- 2. WHY DECLARATIVE CONSTRAINTS REMAIN ESSENTIAL:
--    Check constraints (CHECK application_status IN (...)), Unique constraints
--    (UNIQUE (student_id, job_id)), and Foreign Keys are declared in the relational
--    engine. They execute before triggers, cannot mutate rows unexpectedly, are
--    immune to trigger disabling, and allow the Oracle query optimizer to generate
--    efficient execution plans.
-- ============================================================================
