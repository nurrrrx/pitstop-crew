-- Seed: crew_members.sql
-- 25 crew members sorted alphabetically
-- Password hash is a placeholder - users should use forgot password to set their own

INSERT INTO users (email, password_hash, name, role, employment_type, approval_status, is_admin)
VALUES
  ('adrian.kloggjeri@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Adrian Kloggjeri', 'member', 'fte', 'approved', false),
  ('agrata.agrawal@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Agrata Agrawal', 'member', 'fte', 'approved', false),
  ('ahamed.sulaiman@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Ahamed Sulaiman', 'member', 'fte', 'approved', false),
  ('ahmed.yehia@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Ahmed Yehia', 'member', 'fte', 'approved', false),
  ('alvaro.orgaz@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Alvaro Orgaz Exposito', 'member', 'fte', 'approved', false),
  ('anshul.sharma@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Anshul Sharma', 'member', 'fte', 'approved', false),
  ('asim.siddiqui@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Asim Siddiqui', 'member', 'fte', 'approved', false),
  ('bilge.yakut@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Bilge Yakut', 'member', 'fte', 'approved', false),
  ('carol.baldwin@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Carol Baldwin', 'member', 'fte', 'approved', false),
  ('dawlat.akaila@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Dawlat Akaila', 'member', 'fte', 'approved', false),
  ('franklin.toledo@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Franklin Toledo', 'member', 'fte', 'approved', false),
  ('hamdah.almohamed@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Hamdah Almohamed', 'member', 'fte', 'approved', false),
  ('hanin.atwany@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Hanin Atwany', 'member', 'fte', 'approved', false),
  ('jenalyn.magboo@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Jenalyn Magboo', 'member', 'fte', 'approved', false),
  ('khem.beegoo@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Khem Beegoo', 'member', 'fte', 'approved', false),
  ('mac.siebert@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Mac Siebert', 'member', 'fte', 'approved', false),
  ('nilesh.bhoite@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Nilesh Bhoite', 'member', 'fte', 'approved', false),
  ('nilesh.pondhe@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Nilesh Pondhe', 'member', 'fte', 'approved', false),
  ('nur.aitzhan@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Nur Aitzhan', 'member', 'fte', 'approved', true),
  ('ravi.ramakrishnan@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Ravi Ramakrishnan', 'member', 'fte', 'approved', false),
  ('roberto.zerbini@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Roberto Zerbini', 'member', 'fte', 'approved', false),
  ('rohit.singh@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Rohit Singh', 'member', 'fte', 'approved', false),
  ('shivani.dhawan@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Shivani Dhawan', 'member', 'fte', 'approved', false),
  ('tooba.sheikh@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Tooba Tehreem Sheikh', 'member', 'fte', 'approved', false),
  ('zakariyah.shoroye@pitstop.com', '$2a$12$placeholder.hash.for.seed.data', 'Zakariyah Shoroye', 'member', 'fte', 'approved', false)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  employment_type = EXCLUDED.employment_type,
  approval_status = EXCLUDED.approval_status;
