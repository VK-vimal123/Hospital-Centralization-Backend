USE hospital_sterilization;

-- Seed Admin User (password is 'password123' hashed with bcrypt)
-- $2a$10$X.aY.H6v5Jz4J1/R5g/22OTWz0Cq8i.D3F28p2aZ4b1H6zCjM.v7O
INSERT INTO users (name, email, password, role) VALUES 
('System Admin', 'admin@hospital.com', '$2a$10$X.aY.H6v5Jz4J1/R5g/22OTWz0Cq8i.D3F28p2aZ4b1H6zCjM.v7O', 'Admin'),
('Jane Staff', 'staff@hospital.com', '$2a$10$X.aY.H6v5Jz4J1/R5g/22OTWz0Cq8i.D3F28p2aZ4b1H6zCjM.v7O', 'Sterilization Staff'),
('Bob Tech', 'tech@hospital.com', '$2a$10$X.aY.H6v5Jz4J1/R5g/22OTWz0Cq8i.D3F28p2aZ4b1H6zCjM.v7O', 'Maintenance Staff');

-- Seed Cycle Profiles
INSERT INTO cycle_profiles (name, cycle_type, minimum_temperature, maximum_temperature, minimum_duration, pressure_min, pressure_max) VALUES
('Standard Steam 134°C', 'Steam', 134.00, 137.00, 3, 30.00, 32.00),
('Extended Steam 134°C', 'Steam', 134.00, 137.00, 18, 30.00, 32.00),
('Standard Steam 121°C', 'Steam', 121.00, 124.00, 15, 15.00, 17.00);

-- Seed Equipment
INSERT INTO equipment (equipment_id, name, category, manufacturer, model, serial_number, location, installation_date, status) VALUES
('AUTO-001', 'Main Autoclave A', 'Steam Sterilizer', 'Steris', 'Amsco 400', 'SN-2023-001', 'CSSD Room 1', '2023-01-15', 'Active'),
('AUTO-002', 'Backup Autoclave B', 'Steam Sterilizer', 'Getinge', 'HS66', 'SN-2023-088', 'CSSD Room 1', '2023-06-20', 'Active'),
('WASHER-001', 'Instrument Washer', 'Washer Disinfector', 'Belimed', 'WD 290', 'WD-290-001', 'Decon Area', '2022-11-10', 'Active');
