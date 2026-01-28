-- Seed crew members for ADO team
-- Run this SQL against your PostgreSQL database to add crew members

-- Note: Using a placeholder password hash (you may want to update these or use your auth system)
-- The password hash below is for 'password123' using bcrypt
-- In production, each user should set their own password

INSERT INTO users (email, password_hash, name, role, employment_type, department, start_date, is_admin)
VALUES
  ('adrian.kloggjeri@ado.com', '$2b$10$placeholder', 'Adrian Kloggjeri', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('agrata.agrawal@ado.com', '$2b$10$placeholder', 'Agrata Agrawal', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('ahamed.sulaiman@ado.com', '$2b$10$placeholder', 'Ahamed Sulaiman', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('ahmed.yehia@ado.com', '$2b$10$placeholder', 'Ahmed Yehia', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('alvaro.orgaz@ado.com', '$2b$10$placeholder', 'Alvaro Orgaz Exposito', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('anshul.sharma@ado.com', '$2b$10$placeholder', 'Anshul Sharma', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('asim.siddiqui@ado.com', '$2b$10$placeholder', 'Asim Siddiqui', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('bilge.yakut@ado.com', '$2b$10$placeholder', 'Bilge Yakut', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('carol.baldwin@ado.com', '$2b$10$placeholder', 'Carol Baldwin', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('dawlat.akaila@ado.com', '$2b$10$placeholder', 'Dawlat Akaila', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('franklin.toledo@ado.com', '$2b$10$placeholder', 'Franklin Toledo', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('hamdah.almohamed@ado.com', '$2b$10$placeholder', 'Hamdah Almohamed', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('hanin.atwany@ado.com', '$2b$10$placeholder', 'Hanin Atwany', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('jenalyn.magboo@ado.com', '$2b$10$placeholder', 'Jenalyn Magboo', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('khem.beegoo@ado.com', '$2b$10$placeholder', 'Khem Beegoo', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('mac.siebert@ado.com', '$2b$10$placeholder', 'Mac Siebert', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('nilesh.bhoite@ado.com', '$2b$10$placeholder', 'Nilesh Bhoite', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('nilesh.pondhe@ado.com', '$2b$10$placeholder', 'Nilesh Pondhe', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('ravi.ramakrishnan@ado.com', '$2b$10$placeholder', 'Ravi Ramakrishnan', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('roberto.zerbini@ado.com', '$2b$10$placeholder', 'Roberto Zerbini', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('rohit.singh@ado.com', '$2b$10$placeholder', 'Rohit Singh', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('shivani.dhawan@ado.com', '$2b$10$placeholder', 'Shivani Dhawan', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('tooba.sheikh@ado.com', '$2b$10$placeholder', 'Tooba Tehreem Sheikh', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('zakariyah.shoroye@ado.com', '$2b$10$placeholder', 'Zakariyah Shoroye', 'member', 'fte', 'ADO', CURRENT_DATE, false),
  ('nur.aitzhan@ado.com', '$2b$10$placeholder', 'Nur Aitzhan', 'member', 'fte', 'ADO', CURRENT_DATE, false)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  updated_at = CURRENT_TIMESTAMP;
