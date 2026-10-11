
USE cpos_db;

-- 1. Users and authentication
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mobile_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'CUSTOMER',
        'PARKING_OPERATOR',
        'BRANCH_MANAGER',
        'SUPER_ADMIN'
    ) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Parking locations
CREATE TABLE IF NOT EXISTS parking_locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_slots INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Parking slots
CREATE TABLE IF NOT EXISTS parking_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    slot_type ENUM('REGULAR', 'COMPACT', 'ACCESSIBLE', 'EV')
        NOT NULL DEFAULT 'REGULAR',
    status ENUM('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE')
        NOT NULL DEFAULT 'AVAILABLE',
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_slots_location
        FOREIGN KEY (location_id)
        REFERENCES parking_locations(location_id),

    CONSTRAINT uq_location_slot
        UNIQUE (location_id, slot_number)
);

-- 4. Reservations
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM(
        'PENDING',
        'CONFIRMED',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_reservation_slot
        FOREIGN KEY (slot_id)
        REFERENCES parking_slots(slot_id),

    INDEX idx_reservation_user (user_id),
    INDEX idx_reservation_slot_time (slot_id, start_time, end_time)
);
