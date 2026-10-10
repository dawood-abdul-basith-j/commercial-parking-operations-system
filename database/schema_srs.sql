USE cpos_schema_test;

-- =========================================================
-- 1. ROLE-BASED ACCESS CONTROL
-- =========================================================

CREATE TABLE IF NOT EXISTS roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_permission_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (role_id),
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (permission_id),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id)
);

-- =========================================================
-- 2. CUSTOMERS AND VEHICLES
-- =========================================================

CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    address VARCHAR(255),
    driving_license_number VARCHAR(50) UNIQUE,
    loyalty_points INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(40) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(40),
    CONSTRAINT fk_vehicles_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

-- =========================================================
-- 3. PARKING FACILITIES AND LAYOUT
-- =========================================================

CREATE TABLE IF NOT EXISTS parking_locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    total_capacity INT NOT NULL DEFAULT 0,
    operating_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS parking_layouts (
    layout_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    layout_name VARCHAR(100) NOT NULL,
    floor_number VARCHAR(20),
    total_slots INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_layouts_location FOREIGN KEY (location_id) REFERENCES parking_locations (location_id)
);

CREATE TABLE IF NOT EXISTS parking_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS parking_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    layout_id INT NOT NULL,
    category_id INT NOT NULL,
    slot_number VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    slot_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    sensor_status VARCHAR(30),
    occupied BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_slots_layout FOREIGN KEY (layout_id) REFERENCES parking_layouts (layout_id),
    CONSTRAINT fk_slots_category FOREIGN KEY (category_id) REFERENCES parking_categories (category_id),
    CONSTRAINT uq_layout_slot UNIQUE (layout_id, slot_number)
);

-- =========================================================
-- 4. PRICING POLICIES
-- =========================================================

CREATE TABLE IF NOT EXISTS pricing_policies (
    pricing_policy_id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    vehicle_type VARCHAR(40) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    daily_rate DECIMAL(10, 2) NOT NULL,
    weekend_rate DECIMAL(10, 2),
    peak_hour_rate DECIMAL(10, 2),
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    CONSTRAINT fk_pricing_location FOREIGN KEY (location_id) REFERENCES parking_locations (location_id)
);

-- =========================================================
-- 5. OPERATORS AND BOOKINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS operators (
    operator_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    location_id INT NOT NULL,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    shift VARCHAR(50),
    contact_number VARCHAR(20),
    employment_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_operators_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_operators_location FOREIGN KEY (location_id) REFERENCES parking_locations (location_id)
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    slot_id INT NOT NULL,
    booking_date DATE NOT NULL,
    reservation_time DATETIME NOT NULL,
    expected_entry_time DATETIME NOT NULL,
    expected_exit_time DATETIME NOT NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    booking_source VARCHAR(40),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles (vehicle_id),
    CONSTRAINT fk_bookings_slot FOREIGN KEY (slot_id) REFERENCES parking_slots (slot_id),
    INDEX idx_booking_customer (customer_id),
    INDEX idx_booking_slot_time (
        slot_id,
        expected_entry_time,
        expected_exit_time
    ),
    INDEX idx_booking_status (booking_status)
);

-- =========================================================
-- 6. PARKING SESSIONS, QR VERIFICATION AND ISSUES
-- =========================================================


CREATE TABLE IF NOT EXISTS parking_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    check_in_time DATETIME NULL,
    check_out_time DATETIME NULL,
    parking_duration INT,
    session_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT fk_sessions_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
);


CREATE TABLE IF NOT EXISTS qr_verifications (
    qr_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    qr_code VARCHAR(255) NOT NULL,
    otp VARCHAR(20),
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME NOT NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_qr_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id)
);

CREATE TABLE IF NOT EXISTS issue_reports (
    issue_id INT AUTO_INCREMENT PRIMARY KEY,
    operator_id INT NOT NULL,
    booking_id INT NOT NULL,
    issue_description TEXT NOT NULL,
    issue_type VARCHAR(80),
    issue_status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_issues_operator FOREIGN KEY (operator_id) REFERENCES operators (operator_id),
    CONSTRAINT fk_issues_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id)
);

-- =========================================================
-- 7. PAYMENTS, INVOICES AND REFUNDS
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(40) NOT NULL,
    transaction_reference VARCHAR(150),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_date DATETIME NULL,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
    INDEX idx_payments_booking (booking_id),
    UNIQUE KEY uq_payment_transaction (transaction_reference)
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    payment_id INT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    generated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
    CONSTRAINT fk_invoices_payment FOREIGN KEY (payment_id) REFERENCES payments (payment_id)
);

CREATE TABLE IF NOT EXISTS refunds (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    payment_id INT NOT NULL,
    manager_id INT NOT NULL,
    refund_amount DECIMAL(12, 2) NOT NULL,
    reason TEXT,
    refund_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_at DATETIME NULL,
    CONSTRAINT fk_refunds_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments (payment_id),
    CONSTRAINT fk_refunds_manager FOREIGN KEY (manager_id) REFERENCES users (user_id)
);

-- =========================================================
-- 8. NOTIFICATIONS AND REPORTING
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    booking_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    sent_time DATETIME NULL,
    read_status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    CONSTRAINT fk_notifications_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    CONSTRAINT fk_notifications_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id)
);

CREATE TABLE IF NOT EXISTS reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    manager_id INT NOT NULL,
    report_type VARCHAR(80) NOT NULL,
    report_name VARCHAR(150) NOT NULL,
    generated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    report_file VARCHAR(255),
    CONSTRAINT fk_reports_manager FOREIGN KEY (manager_id) REFERENCES users (user_id)
);

-- =========================================================
-- 9. AUDIT LOG AND SYSTEM SETTINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    action_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    INDEX idx_audit_user_time (user_id, action_timestamp)
);

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT
);