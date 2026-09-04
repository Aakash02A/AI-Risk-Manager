-- ====================================================================
-- Chargeback Evidence Responder - Local MySQL Database Setup Script
-- Execute this script in MySQL Workbench, DBeaver, or MySQL Command Line
-- ====================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `chargeback_responder`
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `chargeback_responder`;

-- 2. Drop existing tables if re-initializing
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `defense_responses`;
DROP TABLE IF EXISTS `predictions`;
DROP TABLE IF EXISTS `evidence`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `risk_configs`;
DROP TABLE IF EXISTS `dispute_ratio_states`;

-- 3. Create Tables
CREATE TABLE `disputes` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL UNIQUE,
  `dispute_amount` DECIMAL(12, 2) NOT NULL,
  `dispute_reason` VARCHAR(64) NOT NULL,
  `days_since_order` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `evidence` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL UNIQUE,
  `dispute_id` BIGINT,
  `order_exists` BOOLEAN NOT NULL DEFAULT TRUE,
  `invoice_exists` BOOLEAN NOT NULL DEFAULT TRUE,
  `payment_confirmed` BOOLEAN NOT NULL DEFAULT TRUE,
  `delivery_status` VARCHAR(64) NOT NULL,
  `tracking_number_present` BOOLEAN NOT NULL DEFAULT TRUE,
  `customer_communication` VARCHAR(64) NOT NULL,
  `refund_status` VARCHAR(64) NOT NULL,
  `customer_prior_dispute_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_evidence_dispute` FOREIGN KEY (`dispute_id`) REFERENCES `disputes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `predictions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL,
  `win_probability` DECIMAL(5, 4) NOT NULL,
  `decision` VARCHAR(32) NOT NULL,
  `model_name` VARCHAR(64) DEFAULT 'RandomForestClassifier',
  `model_version` VARCHAR(16) DEFAULT '1.0',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `defense_responses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL,
  `response_text` TEXT NOT NULL,
  `generated_by` VARCHAR(64) DEFAULT 'gemini-3.8-flash',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `details` TEXT NOT NULL,
  `performed_by` VARCHAR(64) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `risk_configs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `network_ceiling` DOUBLE DEFAULT 0.015,
  `base_strong_threshold` DOUBLE DEFAULT 0.70,
  `base_weak_threshold` DOUBLE DEFAULT 0.40,
  `alpha` DOUBLE DEFAULT 0.20,
  `t_cap` DOUBLE DEFAULT 0.95,
  `representation_fee` DOUBLE DEFAULT 1500.0,
  `human_review_cost` DOUBLE DEFAULT 200.0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `dispute_ratio_states` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `period_days` INT DEFAULT 30,
  `disputes_count` INT DEFAULT 1000,
  `disputes_lost_count` INT DEFAULT 9,
  `disputes_won_count` INT DEFAULT 91,
  `loss_ratio` DOUBLE DEFAULT 0.009,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- 4. INSERT REAL DATA DIRECTLY INTO MYSQL TABLES
-- ====================================================================

-- Risk Config & Ratio State
INSERT INTO `risk_configs` (`id`, `network_ceiling`, `base_strong_threshold`, `base_weak_threshold`, `alpha`, `t_cap`, `representation_fee`, `human_review_cost`)
VALUES (1, 0.015, 0.70, 0.40, 0.20, 0.95, 1500.0, 200.0);

INSERT INTO `dispute_ratio_states` (`id`, `period_days`, `disputes_count`, `disputes_lost_count`, `disputes_won_count`, `loss_ratio`)
VALUES (1, 30, 1000, 9, 91, 0.009);

-- Disputes Records
INSERT INTO `disputes` (`id`, `case_id`, `dispute_amount`, `dispute_reason`, `days_since_order`) VALUES
(1, 'CB-8942-IN', 145000.00, 'fraudulent_transaction', 3),
(2, 'CB-7819-IN', 54200.00, 'item_not_received', 7),
(3, 'CB-6120-IN', 18900.00, 'not_as_described', 14),
(4, 'CB-5431-IN', 89500.00, 'canceled_recurring_billing', 21),
(5, 'CB-4310-IN', 12800.00, 'credit_not_processed', 10),
(6, 'CB-3291-IN', 9450.00, 'item_not_received', 28),
(7, 'CB-2104-IN', 210000.00, 'fraudulent_transaction', 2),
(8, 'CB-1982-IN', 32000.00, 'not_as_described', 6),
(9, 'CB-1540-IN', 14999.00, 'fraudulent_transaction', 25),
(10, 'CB-1205-IN', 78000.00, 'canceled_recurring_billing', 15),
(11, 'CB-1102-IN', 45500.00, 'not_as_described', 11),
(12, 'CB-1050-IN', 22400.00, 'credit_not_processed', 19);

-- Evidence Records
INSERT INTO `evidence` (`case_id`, `dispute_id`, `order_exists`, `invoice_exists`, `payment_confirmed`, `delivery_status`, `tracking_number_present`, `customer_communication`, `refund_status`, `customer_prior_dispute_count`) VALUES
('CB-8942-IN', 1, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-7819-IN', 2, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-6120-IN', 3, TRUE, TRUE, TRUE, 'delivered_unconfirmed', TRUE, 'complained_before', 'no_refund', 1),
('CB-5431-IN', 4, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-4310-IN', 5, TRUE, TRUE, TRUE, 'delivered_unconfirmed', TRUE, 'complained_before', 'refund_pending', 1),
('CB-3291-IN', 6, TRUE, TRUE, TRUE, 'unknown', FALSE, 'no_contact', 'no_refund', 3),
('CB-2104-IN', 7, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-1982-IN', 8, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-1540-IN', 9, TRUE, FALSE, FALSE, 'unknown', FALSE, 'no_contact', 'no_refund', 4),
('CB-1205-IN', 10, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-1102-IN', 11, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0),
('CB-1050-IN', 12, TRUE, TRUE, TRUE, 'delivered_unconfirmed', TRUE, 'complained_before', 'refund_pending', 1);

-- Prediction Records
INSERT INTO `predictions` (`case_id`, `win_probability`, `decision`, `model_name`, `model_version`) VALUES
('CB-8942-IN', 0.9600, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-7819-IN', 0.9400, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-6120-IN', 0.5800, 'BORDERLINE', 'RandomForestClassifier', '1.0'),
('CB-5431-IN', 0.8500, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-4310-IN', 0.4600, 'BORDERLINE', 'RandomForestClassifier', '1.0'),
('CB-3291-IN', 0.1400, 'WEAK', 'RandomForestClassifier', '1.0'),
('CB-2104-IN', 0.9800, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-1982-IN', 0.8900, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-1540-IN', 0.2200, 'WEAK', 'RandomForestClassifier', '1.0'),
('CB-1205-IN', 0.8100, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-1102-IN', 0.8700, 'STRONG', 'RandomForestClassifier', '1.0'),
('CB-1050-IN', 0.5200, 'BORDERLINE', 'RandomForestClassifier', '1.0');

-- Audit Logs
INSERT INTO `audit_logs` (`case_id`, `action`, `details`, `performed_by`) VALUES
('CB-8942-IN', 'Case Received', 'High-value chargeback notice received from Visa Acquirer (Ref: TXN-8942-0192)', 'OPERATOR'),
('CB-8942-IN', '3DS Verification', '3D-Secure 2.0 authentication liability shift verified with HDFC acquiring bank payload', 'SYSTEM'),
('CB-8942-IN', 'ML Analysis', 'Predicted win confidence: 96% -> STRONG Zone (Auto-Respond Authorized)', 'ML_CLASSIFIER'),
('CB-7819-IN', 'Case Received', 'Item Not Received dispute initiated by cardholder (Order #ORD-IN-2026-7819)', 'OPERATOR'),
('CB-7819-IN', 'Courier Audit', 'FedEx Express tracking (FX-78192019-IN) verified with signed proof of delivery photo', 'SYSTEM'),
('CB-7819-IN', 'ML Analysis', 'Predicted win confidence: 94% -> STRONG Zone', 'ML_CLASSIFIER'),
('CB-6120-IN', 'Case Received', 'Merchandise quality dispute filed via Mastercard gateway', 'OPERATOR'),
('CB-6120-IN', 'Interaction Logged', 'Customer email thread attached showing merchant offered 15% discount credit', 'SYSTEM'),
('CB-6120-IN', 'ML Analysis', 'Predicted win confidence: 58% -> BORDERLINE Zone (Human Review Required)', 'ML_CLASSIFIER'),
('CB-5431-IN', 'Case Received', 'Subscription renewal charge dispute filed by cardholder', 'OPERATOR'),
('CB-5431-IN', 'Contract Audit', 'Annual SaaS contract digital agreement timestamp & IP match verified', 'SYSTEM'),
('CB-5431-IN', 'ML Analysis', 'Predicted win confidence: 85% -> STRONG Zone', 'ML_CLASSIFIER');
