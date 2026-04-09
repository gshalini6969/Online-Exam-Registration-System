-- ============================================================
--  Online Exam Registration System — MySQL Database
<<<<<<< HEAD
--  File   : oers_db.sql (UPDATED)
-- ============================================================

-- ============================================================
-- 1. STUDENTS (ADDED course, branch, semester)
=======
--  File   : oers_db.sql
--  Author : Generated for OERS Project
--  Year   : 2026
-- ============================================================
-- ============================================================
-- 1. STUDENTS
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE students (
  student_id    INT           AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100)  NOT NULL,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  email         VARCHAR(120)  NOT NULL UNIQUE,
<<<<<<< HEAD
  password_hash VARCHAR(255)  NOT NULL,
  prn           VARCHAR(30)   UNIQUE,
=======
  password_hash VARCHAR(255)  NOT NULL,          -- store bcrypt hash, never plain text
  prn           VARCHAR(30)   UNIQUE,            -- Permanent Registration Number
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  phone         VARCHAR(15),
  date_of_birth DATE,
  gender        ENUM('Male','Female','Other'),
  address       TEXT,
<<<<<<< HEAD
  photo_url     VARCHAR(255),
  -- NEW COLUMNS FOR COURSE FILTERING
  course        VARCHAR(50)   NOT NULL DEFAULT 'Btech',   -- e.g. 'Btech', 'Mtech'
  branch        VARCHAR(50)   NOT NULL DEFAULT 'CSE',     -- e.g. 'CSE', 'ECE'
  semester      VARCHAR(10)   NOT NULL DEFAULT '1',
=======
  photo_url     VARCHAR(255),                    -- passport photo path
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  is_active     TINYINT(1)    DEFAULT 1,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
<<<<<<< HEAD
-- 2. ADMINS (unchanged)
=======
-- 2. ADMINS
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE admins (
  admin_id      INT           AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100)  NOT NULL,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  email         VARCHAR(120)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('super_admin','admin') DEFAULT 'admin',
  is_active     TINYINT(1)    DEFAULT 1,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
<<<<<<< HEAD
-- 3. OTP VERIFICATION (unchanged)
=======
-- 3. OTP VERIFICATION
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE otp_verifications (
  otp_id      INT           AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(120)  NOT NULL,
  otp_code    VARCHAR(10)   NOT NULL,
  purpose     ENUM('signup','reset_password') DEFAULT 'signup',
  is_used     TINYINT(1)    DEFAULT 0,
  expires_at  DATETIME      NOT NULL,
  created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
<<<<<<< HEAD
-- 4. EXAM CENTERS (unchanged)
=======
-- 4. EXAM CENTERS
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE exam_centers (
  center_id   INT           AUTO_INCREMENT PRIMARY KEY,
  center_name VARCHAR(120)  NOT NULL,
  city        VARCHAR(60)   NOT NULL,
  address     TEXT,
  capacity    INT           DEFAULT 100
);

-- ============================================================
<<<<<<< HEAD
-- 5. EXAMS (unchanged)
=======
-- 5. EXAMS
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE exams (
  exam_id         INT           AUTO_INCREMENT PRIMARY KEY,
  exam_name       VARCHAR(150)  NOT NULL,
<<<<<<< HEAD
  exam_code       VARCHAR(20)   NOT NULL UNIQUE,
=======
  exam_code       VARCHAR(20)   NOT NULL UNIQUE,   -- e.g. CS-APR-2026
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  exam_date       DATE          NOT NULL,
  start_time      TIME,
  end_time        TIME,
  mode            ENUM('Online','Offline','Both') DEFAULT 'Offline',
  fee_per_subject DECIMAL(8,2)  NOT NULL DEFAULT 500.00,
  late_fine       DECIMAL(8,2)  DEFAULT 200.00,
  reg_open_date   DATE          NOT NULL,
  reg_deadline    DATE          NOT NULL,
  late_deadline   DATE,
  hall_ticket_date DATE,
  center_id       INT,
  status          ENUM('Upcoming','Open','Closed','Completed') DEFAULT 'Upcoming',
<<<<<<< HEAD
  created_by      INT,
=======
  created_by      INT,                              -- FK → admins.admin_id
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (center_id)  REFERENCES exam_centers(center_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES admins(admin_id)        ON DELETE SET NULL
);

-- ============================================================
<<<<<<< HEAD
-- 6. SUBJECTS (unchanged)
-- ============================================================
CREATE TABLE subjects (
  subject_id   INT          AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(20)  NOT NULL UNIQUE,
  subject_name VARCHAR(120) NOT NULL,
=======
-- 6. SUBJECTS
-- ============================================================
CREATE TABLE subjects (
  subject_id   INT          AUTO_INCREMENT PRIMARY KEY,
  subject_code VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. CS401
  subject_name VARCHAR(120) NOT NULL,          -- e.g. Data Structures
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  department   VARCHAR(80),
  credits      TINYINT      DEFAULT 3
);

-- ============================================================
<<<<<<< HEAD
-- 7. EXAM–SUBJECT MAPPING (unchanged)
=======
-- 7. EXAM–SUBJECT MAPPING  (which subjects belong to which exam)
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE exam_subjects (
  es_id      INT  AUTO_INCREMENT PRIMARY KEY,
  exam_id    INT  NOT NULL,
  subject_id INT  NOT NULL,
  UNIQUE KEY uq_exam_subject (exam_id, subject_id),
  FOREIGN KEY (exam_id)    REFERENCES exams(exam_id)       ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE
);

-- ============================================================
<<<<<<< HEAD
-- 8. REGISTRATIONS (unchanged)
=======
-- 8. REGISTRATIONS  (one row per student per exam)
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE registrations (
  reg_id        INT           AUTO_INCREMENT PRIMARY KEY,
  student_id    INT           NOT NULL,
  exam_id       INT           NOT NULL,
  applied_on    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  total_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  admin_status  ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  admin_remark  VARCHAR(255),
<<<<<<< HEAD
  reviewed_by   INT,
=======
  reviewed_by   INT,                            -- FK → admins.admin_id
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  reviewed_at   DATETIME,
  UNIQUE KEY uq_student_exam (student_id, exam_id),
  FOREIGN KEY (student_id)  REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id)     REFERENCES exams(exam_id)       ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(admin_id)     ON DELETE SET NULL
);

-- ============================================================
<<<<<<< HEAD
-- 9. REGISTRATION SUBJECTS (unchanged)
=======
-- 9. REGISTRATION SUBJECTS  (which subjects chosen per registration)
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE registration_subjects (
  rs_id       INT  AUTO_INCREMENT PRIMARY KEY,
  reg_id      INT  NOT NULL,
  subject_id  INT  NOT NULL,
  UNIQUE KEY uq_reg_subject (reg_id, subject_id),
  FOREIGN KEY (reg_id)     REFERENCES registrations(reg_id)  ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)    ON DELETE CASCADE
);

-- ============================================================
<<<<<<< HEAD
-- 10. PAYMENTS (unchanged)
-- ============================================================
CREATE TABLE payments (
  payment_id     INT           AUTO_INCREMENT PRIMARY KEY,
  reg_id         INT           NOT NULL UNIQUE,
=======
-- 10. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  payment_id     INT           AUTO_INCREMENT PRIMARY KEY,
  reg_id         INT           NOT NULL UNIQUE,     -- one payment record per registration
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  amount         DECIMAL(10,2) NOT NULL,
  method         ENUM('UPI','Net Banking','Debit Card','Credit Card','Cash') DEFAULT 'UPI',
  transaction_id VARCHAR(80)   UNIQUE,
  status         ENUM('Pending','Completed','Failed','Refunded') DEFAULT 'Pending',
  paid_at        DATETIME,
  receipt_no     VARCHAR(40)   UNIQUE,
  FOREIGN KEY (reg_id) REFERENCES registrations(reg_id) ON DELETE CASCADE
);

-- ============================================================
<<<<<<< HEAD
-- 11. HALL TICKETS (unchanged)
=======
-- 11. HALL TICKETS
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE hall_tickets (
  ticket_id   INT           AUTO_INCREMENT PRIMARY KEY,
  reg_id      INT           NOT NULL UNIQUE,
  roll_number VARCHAR(30)   NOT NULL UNIQUE,
  center_id   INT,
  seat_number VARCHAR(10),
  issued_on   DATETIME      DEFAULT CURRENT_TIMESTAMP,
<<<<<<< HEAD
  issued_by   INT,
=======
  issued_by   INT,                             -- FK → admins.admin_id
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  status      ENUM('Issued','Cancelled','Expired') DEFAULT 'Issued',
  FOREIGN KEY (reg_id)    REFERENCES registrations(reg_id)    ON DELETE CASCADE,
  FOREIGN KEY (center_id) REFERENCES exam_centers(center_id)  ON DELETE SET NULL,
  FOREIGN KEY (issued_by) REFERENCES admins(admin_id)         ON DELETE SET NULL
);

-- ============================================================
<<<<<<< HEAD
-- 12. EXAM SCHEDULE (unchanged)
=======
-- 12. EXAM SCHEDULE  (timeline events shown to students)
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE exam_schedule (
  schedule_id  INT          AUTO_INCREMENT PRIMARY KEY,
  exam_id      INT          NOT NULL,
<<<<<<< HEAD
  event_name   VARCHAR(120) NOT NULL,
=======
  event_name   VARCHAR(120) NOT NULL,   -- e.g. "Registration Opens", "Hall Ticket Release"
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  event_date   DATE         NOT NULL,
  event_status ENUM('Upcoming','Today','Completed') DEFAULT 'Upcoming',
  FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- ============================================================
<<<<<<< HEAD
-- 13. AUDIT LOG (unchanged)
=======
-- 13. AUDIT LOG  (track important admin actions)
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE TABLE audit_log (
  log_id     INT           AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT,
<<<<<<< HEAD
  action     VARCHAR(120)  NOT NULL,
  target     VARCHAR(80),
=======
  action     VARCHAR(120)  NOT NULL,   -- e.g. "Approved registration #24"
  target     VARCHAR(80),              -- e.g. "registration", "exam"
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  target_id  INT,
  logged_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL
);

-- ============================================================
<<<<<<< HEAD
-- 14. NEW: EXAM COURSE MAP (for filtering by student's course & semester)
-- ============================================================
CREATE TABLE exam_course_map (
  map_id    INT AUTO_INCREMENT PRIMARY KEY,
  exam_id   INT NOT NULL,
  course    VARCHAR(50) NOT NULL,   -- e.g. 'Btech', 'Mtech'
  semester  VARCHAR(10) NOT NULL,   -- e.g. '1', '2', ... '8'
  UNIQUE KEY uq_exam_course_sem (exam_id, course, semester),
  FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES (unchanged)
=======
-- ██  INDEXES for faster queries  ██
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================
CREATE INDEX idx_reg_student  ON registrations(student_id);
CREATE INDEX idx_reg_exam     ON registrations(exam_id);
CREATE INDEX idx_reg_status   ON registrations(admin_status);
CREATE INDEX idx_pay_status   ON payments(status);
CREATE INDEX idx_ht_reg       ON hall_tickets(reg_id);
CREATE INDEX idx_otp_email    ON otp_verifications(email);

-- ============================================================
<<<<<<< HEAD
-- SAMPLE DATA (UPDATED with course/branch/semester)
=======
-- ██  SAMPLE DATA  ██
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================

-- Exam Centers
INSERT INTO exam_centers (center_name, city, address, capacity) VALUES
('JNTU Examination Hall A', 'Hyderabad', 'Kukatpally, Hyderabad - 500085', 200),
('Osmania University Centre', 'Hyderabad', 'Tarnaka, Hyderabad - 500007', 150),
('CBIT Examination Block',   'Hyderabad', 'Gandipet, Hyderabad - 500075', 180);

-- Subjects
INSERT INTO subjects (subject_code, subject_name, department, credits) VALUES
('CS401', 'Data Structures',         'Computer Science', 4),
('CS402', 'Database Management Systems', 'Computer Science', 4),
('CS403', 'Operating Systems',       'Computer Science', 4),
('CS404', 'Computer Networks',       'Computer Science', 3),
('CS405', 'Software Engineering',    'Computer Science', 3),
('MA401', 'Mathematics IV',          'Mathematics',      4);

<<<<<<< HEAD
-- Admin account (use bcrypt hash in production)
INSERT INTO admins (full_name, username, email, password_hash, role) VALUES
('System Administrator', 'admin', 'admin@oers.edu.in', '$2a$10$dummyhashforadmin123', 'super_admin');
=======
-- Admin account  (password shown as plain text here — hash before inserting in production)
INSERT INTO admins (full_name, username, email, password_hash, role) VALUES
('System Administrator', 'admin', 'admin@oers.edu.in', 'hashed_password_here', 'super_admin');
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663

-- Exam
INSERT INTO exams
  (exam_name, exam_code, exam_date, start_time, end_time, mode,
   fee_per_subject, late_fine, reg_open_date, reg_deadline,
   late_deadline, hall_ticket_date, center_id, status, created_by)
VALUES
  ('End Semester Examination April 2026', 'ESE-APR-2026',
   '2026-04-20', '10:00:00', '13:00:00', 'Offline',
   500.00, 200.00, '2026-03-15', '2026-03-31',
   '2026-04-05', '2026-04-10', 1, 'Open', 1);

<<<<<<< HEAD
-- Map exam to courses and semesters (so only Btech/CSE students in semester 3-4 see it)
INSERT INTO exam_course_map (exam_id, course, semester) VALUES
(1, 'Btech', '3'),
(1, 'Btech', '4');

=======
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- Link all subjects to the exam
INSERT INTO exam_subjects (exam_id, subject_id)
SELECT 1, subject_id FROM subjects;

-- Exam schedule events
INSERT INTO exam_schedule (exam_id, event_name, event_date, event_status) VALUES
(1, 'Registration Opens',    '2026-03-15', 'Completed'),
(1, 'Registration Deadline', '2026-03-31', 'Upcoming'),
(1, 'Late Fee Deadline',     '2026-04-05', 'Upcoming'),
(1, 'Hall Ticket Release',   '2026-04-10', 'Upcoming'),
(1, 'Examination Begins',    '2026-04-20', 'Upcoming');

<<<<<<< HEAD
-- Sample student (with course, branch, semester)
INSERT INTO students (full_name, username, email, password_hash, prn, phone, course, branch, semester) VALUES
('Shalini Reddy', 'shalini_r', 'shalini@example.com', '$2a$10$dummyhashstudent123', 'PRN2024CS001', '9876543210', 'Btech', 'CSE', '4');

-- Sample registration (student 1 registers for exam 1)
INSERT INTO registrations (student_id, exam_id, total_fee, admin_status) VALUES
(1, 1, 2000.00, 'Pending');
=======
-- Sample student  (password stored as hash in real use)
INSERT INTO students (full_name, username, email, password_hash, prn, phone) VALUES
('Shalini Reddy', 'shalini_r', 'shalini@example.com', 'hashed_password_here', 'PRN2024CS001', '9876543210');

-- Sample registration (student 1 registers for exam 1)
INSERT INTO registrations (student_id, exam_id, total_fee, admin_status) VALUES
(1, 1, 2000.00, 'Pending');   -- 4 subjects × ₹500
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663

-- Student picked 4 subjects
INSERT INTO registration_subjects (reg_id, subject_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);

-- Payment record
INSERT INTO payments (reg_id, amount, method, transaction_id, status, paid_at, receipt_no) VALUES
(1, 2000.00, 'UPI', 'TXN20260319ABC001', 'Completed', NOW(), 'RCPT-2026-001');

-- ============================================================
<<<<<<< HEAD
-- VIEWS (unchanged)
-- ============================================================

=======
-- ██  USEFUL VIEWS  ██
-- ============================================================

-- V1: Full registration summary for admins
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
CREATE VIEW vw_registration_summary AS
SELECT
  r.reg_id,
  s.full_name      AS student_name,
  s.prn,
  e.exam_name,
  e.exam_code,
  COUNT(rs.subject_id) AS subject_count,
  r.total_fee,
  p.status         AS payment_status,
  r.admin_status,
  r.applied_on
FROM registrations r
JOIN students      s  ON r.student_id  = s.student_id
JOIN exams         e  ON r.exam_id     = e.exam_id
JOIN registration_subjects rs ON r.reg_id = rs.reg_id
LEFT JOIN payments p  ON r.reg_id      = p.reg_id
GROUP BY r.reg_id;

<<<<<<< HEAD
=======
-- V2: Hall ticket view
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
CREATE VIEW vw_hall_tickets AS
SELECT
  ht.ticket_id,
  ht.roll_number,
  s.full_name      AS student_name,
  s.prn,
  e.exam_name,
  e.exam_code,
  e.exam_date,
  e.start_time,
  ec.center_name,
  ec.city,
  ht.seat_number,
  ht.issued_on,
  ht.status
FROM hall_tickets ht
JOIN registrations r  ON ht.reg_id    = r.reg_id
JOIN students      s  ON r.student_id = s.student_id
JOIN exams         e  ON r.exam_id    = e.exam_id
LEFT JOIN exam_centers ec ON ht.center_id = ec.center_id;

<<<<<<< HEAD
=======
-- V3: Admin report — exam statistics
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
CREATE VIEW vw_exam_report AS
SELECT
  e.exam_id,
  e.exam_name,
  e.exam_code,
  COUNT(r.reg_id)                                            AS total_registered,
  SUM(r.admin_status = 'Approved')                          AS approved,
  SUM(r.admin_status = 'Rejected')                          AS rejected,
  SUM(r.admin_status = 'Pending')                           AS pending,
  SUM(CASE WHEN p.status = 'Completed' THEN p.amount ELSE 0 END) AS fee_collected
FROM exams e
LEFT JOIN registrations r ON e.exam_id = r.exam_id
LEFT JOIN payments      p ON r.reg_id  = p.reg_id
GROUP BY e.exam_id;

-- ============================================================
<<<<<<< HEAD
-- STORED PROCEDURES (unchanged)
=======
-- ██  STORED PROCEDURES  ██
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
-- ============================================================

DELIMITER $$

<<<<<<< HEAD
=======
-- SP1: Approve a registration and auto-generate a hall ticket
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
CREATE PROCEDURE sp_approve_registration(
  IN  p_reg_id     INT,
  IN  p_admin_id   INT,
  IN  p_center_id  INT,
  OUT p_roll_no    VARCHAR(30)
)
BEGIN
  DECLARE v_exam_id INT;
  DECLARE v_count   INT;

<<<<<<< HEAD
=======
  -- Mark registration as Approved
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  UPDATE registrations
  SET admin_status = 'Approved',
      reviewed_by  = p_admin_id,
      reviewed_at  = NOW()
  WHERE reg_id = p_reg_id;

<<<<<<< HEAD
  SELECT exam_id INTO v_exam_id FROM registrations WHERE reg_id = p_reg_id;
  SET p_roll_no = CONCAT('ROLL-', v_exam_id, '-', LPAD(p_reg_id, 4, '0'));

=======
  -- Generate unique roll number: ROLL-<exam_id>-<reg_id>
  SELECT exam_id INTO v_exam_id FROM registrations WHERE reg_id = p_reg_id;
  SET p_roll_no = CONCAT('ROLL-', v_exam_id, '-', LPAD(p_reg_id, 4, '0'));

  -- Insert hall ticket if not already issued
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  SELECT COUNT(*) INTO v_count FROM hall_tickets WHERE reg_id = p_reg_id;
  IF v_count = 0 THEN
    INSERT INTO hall_tickets (reg_id, roll_number, center_id, issued_by)
    VALUES (p_reg_id, p_roll_no, p_center_id, p_admin_id);
  END IF;

<<<<<<< HEAD
=======
  -- Log the action
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  INSERT INTO audit_log (admin_id, action, target, target_id)
  VALUES (p_admin_id, CONCAT('Approved registration and issued hall ticket ', p_roll_no), 'registration', p_reg_id);
END$$

<<<<<<< HEAD
=======
-- SP2: Student — register for an exam (takes a comma-style, call once per subject)
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
CREATE PROCEDURE sp_register_student(
  IN p_student_id INT,
  IN p_exam_id    INT,
  IN p_subject_id INT
)
BEGIN
  DECLARE v_reg_id     INT DEFAULT 0;
  DECLARE v_fee        DECIMAL(8,2);
  DECLARE v_late_fine  DECIMAL(8,2);
  DECLARE v_deadline   DATE;
  DECLARE v_late_date  DATE;
  DECLARE v_added_fee  DECIMAL(8,2) DEFAULT 0;

  SELECT fee_per_subject, late_fine, reg_deadline, late_deadline
  INTO   v_fee, v_late_fine, v_deadline, v_late_date
  FROM   exams WHERE exam_id = p_exam_id;

<<<<<<< HEAD
=======
  -- Apply late fine if applicable
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  IF CURDATE() > v_deadline THEN
    SET v_added_fee = v_late_fine;
  END IF;

<<<<<<< HEAD
=======
  -- Create registration row if not yet exists
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  INSERT IGNORE INTO registrations (student_id, exam_id, total_fee)
  VALUES (p_student_id, p_exam_id, 0);

  SELECT reg_id INTO v_reg_id
  FROM   registrations
  WHERE  student_id = p_student_id AND exam_id = p_exam_id;

<<<<<<< HEAD
  INSERT IGNORE INTO registration_subjects (reg_id, subject_id)
  VALUES (v_reg_id, p_subject_id);

=======
  -- Add subject
  INSERT IGNORE INTO registration_subjects (reg_id, subject_id)
  VALUES (v_reg_id, p_subject_id);

  -- Recalculate total fee
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
  UPDATE registrations
  SET total_fee = (
    SELECT COUNT(*) * v_fee + v_added_fee
    FROM   registration_subjects
    WHERE  reg_id = v_reg_id
  )
  WHERE reg_id = v_reg_id;
END$$

<<<<<<< HEAD
DELIMITER ;
=======
DELIMITER ;

-- ============================================================
-- END OF SCRIPT
-- ============================================================
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
