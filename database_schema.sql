-- =========================================================
-- CoupEx : Coupon Exchange & Cashback Platform
-- Database Schema (MySQL)
-- =========================================================

CREATE DATABASE IF NOT EXISTS coupex;
USE coupex;

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    phone           VARCHAR(15) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    upi_id          VARCHAR(100),
    wallet_balance  DECIMAL(10,2) DEFAULT 0.00,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- COUPONS
-- ---------------------------------------------------------
CREATE TABLE coupons (
    coupon_id       INT AUTO_INCREMENT PRIMARY KEY,
    seller_id       INT NOT NULL,
    store_name      VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    coupon_code     VARCHAR(50) NOT NULL,
    description     VARCHAR(255),
    discount_value  VARCHAR(50) NOT NULL,
    original_price  DECIMAL(10,2) NOT NULL,
    resale_price    DECIMAL(10,2) NOT NULL,
    expiry_date     DATE NOT NULL,
    status          ENUM('active','sold','expired','removed') DEFAULT 'active',
    submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

-- ---------------------------------------------------------
-- TRANSACTIONS  (buy / sell / cashback events)
-- ---------------------------------------------------------
CREATE TABLE transactions (
    transaction_id      INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id           INT NOT NULL,
    buyer_id            INT NOT NULL,
    seller_id           INT NOT NULL,
    amount_paid         DECIMAL(10,2) NOT NULL,
    cashback_earned     DECIMAL(10,2) DEFAULT 0.00,
    payment_method      VARCHAR(30) DEFAULT 'UPI',
    upi_reference_id    VARCHAR(50) UNIQUE,
    status              ENUM('success','failed','pending') DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);

-- ---------------------------------------------------------
-- SUPPORT_MESSAGES (help / chat box log)
-- ---------------------------------------------------------
CREATE TABLE support_messages (
    message_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT,
    sender          ENUM('user','bot') NOT NULL,
    message_text    VARCHAR(500) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ---------------------------------------------------------
-- Trigger idea (documented, MySQL events/cron in real system):
-- A scheduled job runs daily:
--   UPDATE coupons SET status = 'expired'
--   WHERE expiry_date < CURDATE() AND status = 'active';
-- ---------------------------------------------------------
