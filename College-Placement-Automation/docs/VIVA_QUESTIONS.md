# Comprehensive Viva Voce Questions & Answers
## Smart Campus Placement and Eligibility Automation System Using Oracle PL/SQL

This document prepares students and candidates for academic viva examinations, project defense, and technical interviews. It contains 30 comprehensive questions with precise, authoritative answers.

---

### Category 1: SQL vs. PL/SQL Foundations

#### Q1. What is the fundamental difference between SQL and PL/SQL?
**Answer**:
- **SQL (Structured Query Language)** is a declarative, non-procedural language used to define and manipulate data (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). The developer specifies *what* data is required, not *how* to retrieve it. SQL executes one statement at a time.
- **PL/SQL (Procedural Language/SQL)** is Oracle's procedural extension to SQL. It adds procedural constructs such as variables, conditional branches (`IF-THEN-ELSE`), loops (`FOR`, `WHILE`), cursors, and structured exception handling. It allows bundling multiple SQL operations into a single block sent over the network to the Oracle engine, drastically reducing network I/O and context switching.

#### Q2. Why is PL/SQL preferred over standard SQL queries for business logic like placement eligibility?
**Answer**:
Evaluating placement eligibility involves multi-dimensional rules: verifying minimum CGPA, backlog thresholds, matching passing-out graduation batches, evaluating missing skills across junction tables, and returning human-readable diagnostics. In pure SQL, this requires complicated subqueries repeated across multiple clients. PL/SQL encapsulates this into a reusable function/procedure on the database server, ensuring centralized logic, consistency, faster execution, and security.

---

### Category 2: Procedures, Functions, and Packages

#### Q3. What is the technical difference between a Stored Procedure and a Stored Function in PL/SQL?
**Answer**:
- A **Function** must return a single value to the caller via the `RETURN` clause and can be directly invoked inside SQL queries (e.g., `WHERE PLACEMENT_PKG.is_student_eligible(s.student_id, 201) = 'YES'`) provided it doesn't violate purity rules (e.g., no DML in SQL functions).
- A **Procedure** does not return a direct value via a return clause; instead, it performs actions (like DML operations, status updates, or printing reports) and may return zero, one, or multiple values through `OUT` or `IN OUT` parameters. It cannot be called directly inside a SQL query `SELECT` statement.

#### Q4. What is a PL/SQL Package and why did you use `PLACEMENT_PKG`?
**Answer**:
A **Package** is an encapsulated database schema object that groups logically related PL/SQL types, variables, cursors, exceptions, procedures, and functions together.
Key architectural benefits:
1. **Modularity and Encapsulation**: Clear separation between the public interface (specification) and private implementation details (body).
2. **Performance (Single Load)**: When any package member is invoked for the first time, Oracle loads the entire package into the SGA shared pool memory; subsequent calls execute in-memory with zero disk I/O.
3. **Session State Persistence**: Package variables retain their values throughout a user's database session.
4. **Maintenance**: You can modify and recompile the package body without invalidating dependent database views or calling applications.

---

### Category 3: Cursors and Query Processing

#### Q5. What is a Cursor in PL/SQL? Differentiate between Implicit and Explicit cursors.
**Answer**:
A **Cursor** is a pointer or handle to a private memory area allocated by the Oracle database (in the Program Global Area or PGA) to process SQL statements and hold the resulting rows.
- **Implicit Cursor**: Automatically created and managed by Oracle for all single SQL statements (`SELECT INTO`, `INSERT`, `UPDATE`, `DELETE`). Attributes include `SQL%FOUND`, `SQL%NOTFOUND`, and `SQL%ROWCOUNT`.
- **Explicit Cursor**: Explicitly declared, opened, fetched from, and closed by the developer for queries that retrieve multiple rows (e.g., iterating through all eligible students for a drive in `get_eligible_students`).

#### Q6. What is a Cursor FOR Loop and why is it beneficial?
**Answer**:
A **Cursor FOR loop** automatically opens the cursor, fetches each row into a dynamically created record variable, checks for `%NOTFOUND`, and closes the cursor when all rows are processed or an exception occurs.
**Advantage**: It eliminates boilerplate code (`OPEN`, `FETCH`, `EXIT WHEN`, `CLOSE`) and prevents resource leaks caused by unclosed cursors. Furthermore, the Oracle PL/SQL optimizing compiler automatically optimizes Cursor FOR loops to fetch rows in batches of 100 rows (bulk processing) behind the scenes.

---

### Category 4: Triggers and Audit Logging

#### Q7. What is a Database Trigger? What types of triggers did you implement in this project?
**Answer**:
A **Trigger** is a stored PL/SQL block that automatically executes (fires) in response to a specific database event (such as `BEFORE` or `AFTER` `INSERT`, `UPDATE`, `DELETE`) on a specified table.
In this project, we implemented:
1. `trg_app_timestamp` (`BEFORE UPDATE ON APPLICATIONS`): Automatically updates the `:NEW.updated_at` column with `SYSTIMESTAMP`.
2. `trg_app_status_audit` (`AFTER UPDATE OF application_status ON APPLICATIONS`): Automatically creates an immutable audit row in `APPLICATION_STATUS_HISTORY` whenever an application's status genuinely changes.

#### Q8. Why did you use an `AFTER UPDATE` trigger for audit logging instead of putting an `INSERT` statement in the procedure?
**Answer**:
If auditing is placed only inside a PL/SQL procedure, any direct SQL `UPDATE` statement executed outside the procedure (via SQL Developer, Python backend, or ad-hoc admin script) would bypass the audit log. By placing the audit in an `AFTER UPDATE` row-level trigger on the table itself, audit logging is **engine-enforced and tamper-proof**, guaranteeing 100% audit completeness regardless of the entry point.

#### Q9. What does the `WHEN` clause accomplish in `trg_app_status_audit`?
**Answer**:
The `WHEN (OLD.application_status != NEW.application_status ...)` clause prevents the trigger from firing when an `UPDATE` executes without changing the status (for example, if only another column like `updated_at` is modified, or if status is set to the same value). This saves database CPU cycles and prevents writing redundant, duplicate audit records.

---

### Category 5: Database Constraints and Integrity

#### Q10. What is the difference between Primary Key, Foreign Key, and Unique Key?
**Answer**:
- **Primary Key (PK)**: Uniquely identifies each record in a table. Does not allow `NULL` values and automatically enforces a unique index. Example: `student_id` in `STUDENTS`.
- **Unique Key (UK)**: Ensures all values in a column or set of columns are distinct across the table. Allows `NULL` values unless defined with `NOT NULL`. Example: `email` in `STUDENTS`, `(student_id, job_id)` in `APPLICATIONS`.
- **Foreign Key (FK)**: Enforces referential integrity between child and parent tables by guaranteeing that the value in the child table matches an existing primary or candidate key in the referenced parent table. Example: `job_id` in `APPLICATIONS` references `job_id` in `JOBS`.

#### Q11. How do you prevent a student from applying to the same job twice?
**Answer**:
At the architectural level, we prevent duplicate applications in two layers:
1. **Declarative Constraint**: A database-level unique constraint on `APPLICATIONS`: `CONSTRAINT uq_student_job_app UNIQUE (student_id, job_id)`. Even in high-concurrency race conditions, the Oracle kernel will reject a second insert with `ORA-00001`.
2. **PL/SQL Application Layer**: In `PLACEMENT_PKG.apply_for_job`, we query `APPLICATIONS` and raise user-friendly error `ERR_DUPLICATE_APPLICATION (-20005)` before attempting the insert.

#### Q12. What does `ON DELETE CASCADE` do in your foreign keys?
**Answer**:
`ON DELETE CASCADE` specifies that if a parent record is deleted, all corresponding child records that reference that parent are automatically deleted by Oracle. For example, if a job opening is deleted from `JOBS`, all associated rows in `JOB_REQUIRED_SKILLS`, `JOB_ELIGIBLE_YEARS`, and `APPLICATIONS` are automatically cleaned up, preventing orphaned foreign key references.

---

### Category 6: Normalization and Relational Modeling

#### Q13. What is Database Normalization? To what normal form is this project normalized?
**Answer**:
Normalization is a systematic database design technique to minimize data redundancy and prevent insertion, update, and deletion anomalies by decomposing tables.
This project is normalized to **Third Normal Form (3NF) / BCNF**:
- **1NF**: Atomic values in all attributes; no multi-valued comma-separated skills in a single column (handled via `STUDENT_SKILLS` and `JOB_REQUIRED_SKILLS`).
- **2NF**: No partial dependencies; all non-key columns depend entirely on the composite primary keys.
- **3NF**: No transitive dependencies ($A \rightarrow B \rightarrow C$). Attributes depend exclusively on the candidate key.

#### Q14. Why did you create junction tables `STUDENT_SKILLS` and `JOB_REQUIRED_SKILLS` instead of storing skills as comma-separated values?
**Answer**:
Storing comma-separated strings (e.g. `'Java, SQL, Python'`) violates First Normal Form ($1\text{NF}$). It creates severe problems:
1. Searching for candidates with a specific skill requires slow string pattern matching (`LIKE '%SQL%'`), which cannot use B-tree indexes and can cause false matches (e.g., matching `'PL/SQL'` when searching for `'SQL'`).
2. Cannot enforce referential integrity to verify that a skill exists in the master catalog.
3. Cannot perform efficient set operations (such as finding missing required skills via set difference / `NOT IN`).

---

### Category 7: Views and Analytical SQL

#### Q15. What is a View in SQL? What views are created in your project?
**Answer**:
A **View** is a stored SQL query that acts as a virtual table. It does not store physical data itself (unless materialized); it dynamically queries base tables whenever queried.
In this project, views simplify reporting and secure data:
- `VW_STUDENT_DIRECTORY`: Pre-joins students with aggregated skills.
- `VW_ACTIVE_JOBS`: Joins jobs with companies and eligible batch years.
- `VW_COMPANY_APPLICATION_STATS`: Aggregates recruiter application progress.
- `VW_OVERALL_PLACEMENT_STATS`: Calculates executive KPIs (placement percentage, average package, offers).

#### Q16. What is the `LISTAGG` function used in your views?
**Answer**:
`LISTAGG` is an Oracle aggregate and analytic function that aggregates values from multiple rows into a single delimited string within each group (e.g., converting multiple skill rows into `'Cloud Computing, Java, Oracle SQL'`). It provides readable reports without breaking normalization in the underlying relational tables.

#### Q17. How does your analytical query rank students qualifying for the greatest number of jobs?
**Answer**:
It uses a Common Table Expression (CTE) to calculate the count of active drives each student qualifies for, and then applies the **`DENSE_RANK()`** window function:
`DENSE_RANK() OVER (ORDER BY qualified_openings_count DESC, cgpa DESC)`.
Unlike standard `RANK()`, `DENSE_RANK()` does not produce gaps in ranking sequence when two students have tied counts.

---

### Category 8: Exception Handling and Errors

#### Q18. How does exception handling work in PL/SQL?
**Answer**:
PL/SQL blocks have a dedicated `EXCEPTION` section. When a runtime error occurs, normal execution halts and control immediately transfers to the exception handler matching the error condition (`WHEN error_name THEN ...`). If no specific handler matches, `WHEN OTHERS THEN` catches all remaining errors.
Uncaught exceptions propagate up the call stack to the invoking block or client application.

#### Q19. What is `RAISE_APPLICATION_ERROR` and why did you use negative error codes from -20001 to -20010?
**Answer**:
`RAISE_APPLICATION_ERROR(error_number, error_message)` is an Oracle built-in procedure that allows developers to return custom, meaningful error messages from stored subprograms to calling client applications. Oracle reserves the error number range **-20000 to -20999** specifically for user-defined application errors, ensuring they do not collide with built-in Oracle error codes (like `ORA-01403`).

---

### Category 9: Transactions and Concurrency Control

#### Q20. What is an ACID transaction? Explain COMMIT, ROLLBACK, and SAVEPOINT.
**Answer**:
A **Transaction** is a logical unit of work that must satisfy **ACID** properties: **Atomicity** (all or nothing), **Consistency** (state remains valid), **Isolation** (concurrent transactions do not interfere), and **Durability** (committed changes persist).
- **`COMMIT`**: Permanently saves all changes made in the current transaction to the database redo logs and data files.
- **`ROLLBACK`**: Undoes all changes made in the current transaction, restoring data to its state at the previous commit.
- **`SAVEPOINT`**: Marks an intermediate checkpoint within a transaction so that partial work can be undone via `ROLLBACK TO savepoint_name` without rolling back the entire transaction.

#### Q21. Why did you not put unconditional `COMMIT` statements inside your package procedures?
**Answer**:
Placing unconditional `COMMIT` statements inside library or package procedures violates transaction boundary autonomy. A calling application or orchestrator might execute a sequence of three operations (e.g., register student, link skill, submit application). If the procedure commits after step 1, the caller cannot perform a full `ROLLBACK` if step 3 fails. Therefore, best practice dictates that the **invoking client or transaction coordinator controls the `COMMIT` and `ROLLBACK` boundaries**.

#### Q22. How did you handle concurrency control during status updates?
**Answer**:
In `update_application_status`, we lock the specific application row using `SELECT ... FOR UPDATE OF application_status`. This acquires an exclusive row-level lock in Oracle, preventing race conditions where two simultaneous transactions might attempt conflicting transitions on the same application record.

---

### Category 10: Performance Optimization & Indexes

#### Q23. What are Indexes and what indexes did you create in this project?
**Answer**:
An **Index** is an auxiliary schema object containing sorted keys and physical row addresses (`ROWID`s) that allows the Oracle query optimizer to locate rows rapidly using a B-tree search ($O(\log N)$) rather than scanning the entire table ($O(N)$ full table scan).
We created indexes on:
1. `STUDENTS(graduation_year, cgpa)`: Accelerates candidate eligibility filtering.
2. `APPLICATIONS(student_id)` and `APPLICATIONS(job_id)`: Speeds up foreign key lookups and join queries.
3. `APPLICATIONS(application_status)`: Accelerates filtering for shortlisted and selected reports.
4. `APPLICATION_STATUS_HISTORY(application_id)`: Accelerates audit log history retrieval.

---

### Category 11: Business Logic and Eligibility Rules

#### Q24. Walk through the step-by-step logic of the `check_eligibility` engine.
**Answer**:
When `check_eligibility(student_id, job_id, o_reasons)` is called:
1. **Fetch Profiles**: Retrieves student and job records; raises custom error if either does not exist.
2. **Active Check**: Verifies `job.is_active = 'Y'`. If `'N'`, appends failure reason.
3. **Academic Cutoff**: Verifies `student.cgpa >= job.minimum_cgpa`. If less, appends CGPA deficit reason.
4. **Backlog Limit**: Verifies `student.active_backlogs <= job.maximum_backlogs`. If greater, appends excess backlog reason.
5. **Graduation Batch Match**: Queries `JOB_ELIGIBLE_YEARS`. If student's passing year is missing, appends batch ineligibility reason with list of allowed batches.
6. **Required Skills Verification**: Queries `JOB_REQUIRED_SKILLS` using set difference (`NOT IN STUDENT_SKILLS`). If any mandatory skill is missing, lists all missing skills.
7. **Decision**: If all 5 criteria pass, returns `TRUE` with `'[PASS]'`; otherwise, returns `FALSE` with concatenated reasons.

#### Q25. What status transitions are permitted in the application state machine?
**Answer**:
- `APPLIED` $\rightarrow$ `SHORTLISTED`, `REJECTED`, or `WITHDRAWN`.
- `SHORTLISTED` $\rightarrow$ `SELECTED`, `REJECTED`, or `WITHDRAWN`.
- `SELECTED` $\rightarrow$ `WITHDRAWN` (student voluntarily declines/withdraws after selection).
- `REJECTED` and `WITHDRAWN` are **terminal states**; no further transitions are permitted.
Any other transition (e.g. attempting to move directly from `APPLIED` to `SELECTED`, or resurrecting a `REJECTED` candidate) raises `ERR_INVALID_STATUS_TRANSITION (-20006)`.

---

### Category 12: Architecture, Limitations, and Future Work

#### Q26. Why is this project designed as a database-centric solution without a frontend?
**Answer**:
In enterprise database engineering and placement automation, data consistency, security, and integrity rules must reside in the database, not in client-side code where they can be bypassed or tampered with. Placing the business logic in PL/SQL ensures that any client (web, mobile, or CLI) adheres to the exact same eligibility rules and audit controls.

#### Q27. What are the current limitations of this system?
**Answer**:
1. Skill matching is binary (present or absent); it does not currently factor in skill proficiency ratings (e.g. Beginner, Intermediate, Expert) or years of experience.
2. Interview slot scheduling and multi-round scoring (Round 1: Aptitude, Round 2: Technical, Round 3: HR) are represented under the generalized `SHORTLISTED` status rather than discrete round tables.
3. Does not automatically enforce college-level placement policies (e.g., "One Student, One Job Offer" policy where a student is blocked from further drives once selected).

#### Q28. How would you implement a "One Student, One Job Offer" policy in this database?
**Answer**:
We would add a validation check inside `check_eligibility` and `apply_for_job`:
Query `APPLICATIONS` to check if `student_id` already has a record with `application_status = 'SELECTED'`. If count $> 0$, the student is automatically disqualified from applying to additional jobs, or disqualified from jobs offering a package lower than $1.5\times$ their existing offer.

#### Q29. What happens if two placement coordinators try to change the status of the same application at the same time?
**Answer**:
In `update_application_status`, we execute `SELECT application_status FROM APPLICATIONS WHERE application_id = ... FOR UPDATE`. The first coordinator's transaction obtains an exclusive row lock. The second transaction will wait until the first commits or rolls back, preventing lost updates and dirty reads.

#### Q30. If you were deploying this to production with 50,000 students and 500 companies, what optimizations would you apply?
**Answer**:
1. Partition the `APPLICATIONS` and `APPLICATION_STATUS_HISTORY` tables by range on `applied_at` or list on `application_status`.
2. Use **Oracle Bulk Collect and FORALL** for mass eligibility evaluations.
3. Implement Oracle Result Cache on the `check_eligibility` function for repeated queries during recruitment drives.
4. Set up database auditing with Oracle Fine-Grained Auditing (FGA) for compliance.
