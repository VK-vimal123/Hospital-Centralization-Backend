CREATE DATABASE IF NOT EXISTS hospital_sterilization;
USE hospital_sterilization;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Sterilization Staff', 'Maintenance Staff') NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    location VARCHAR(255),
    installation_date DATE,
    status ENUM('Active', 'Inactive', 'Maintenance', 'Retired') DEFAULT 'Active',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cycle_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cycle_type VARCHAR(100) NOT NULL,
    minimum_temperature DECIMAL(5,2),
    maximum_temperature DECIMAL(5,2),
    minimum_duration INT,
    pressure_min DECIMAL(5,2),
    pressure_max DECIMAL(5,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sterilization_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    profile_id INT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    operator_id INT NOT NULL,
    cycle_type VARCHAR(100),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    temperature DECIMAL(5,2),
    pressure DECIMAL(5,2),
    duration INT,
    chemical_indicator ENUM('PASS', 'FAIL'),
    biological_indicator ENUM('PASS', 'FAIL', 'PENDING'),
    result ENUM('PASS', 'FAIL', 'WARNING'),
    failure_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (profile_id) REFERENCES cycle_profiles(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    technician_id INT NOT NULL,
    maintenance_type VARCHAR(100),
    service_date DATE NOT NULL,
    description TEXT,
    parts_replaced TEXT,
    status ENUM('Completed', 'Pending', 'In Progress') DEFAULT 'Completed',
    next_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id INT,
    previous_value JSON,
    new_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
