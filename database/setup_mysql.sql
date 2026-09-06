-- =================================================================================
-- CHARGEBACK EVIDENCE RESPONDER - PRODUCTION MYSQL DATABASE SCHEMA & DML SCRIPT
-- =================================================================================
-- Author: Antigravity AI Risk Manager Team
-- Compatible with: MySQL 8.0+, MariaDB 10.5+
-- Direct Execution: mysql -u root -p<your_mysql_password> < database/setup_mysql.sql
-- =================================================================================

CREATE DATABASE IF NOT EXISTS `chargeback_responder`
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `chargeback_responder`;

-- Disable Foreign Key Checks for clean table drop & creation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `defense_responses`;
DROP TABLE IF EXISTS `predictions`;
DROP TABLE IF EXISTS `evidence`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `risk_configs`;
DROP TABLE IF EXISTS `dispute_ratio_states`;

SET FOREIGN_KEY_CHECKS = 1;

-- =================================================================================
-- 1. TABLE: disputes (Core Chargeback Dispute Cases)
-- =================================================================================
CREATE TABLE `disputes` (
  `dispute_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL UNIQUE,
  `dispute_amount` DECIMAL(12, 2) NOT NULL,
  `dispute_reason` VARCHAR(64) NOT NULL,
  `days_since_order` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_disputes_case_id` (`case_id`),
  INDEX `idx_disputes_reason` (`dispute_reason`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 2. TABLE: evidence (Captured Transaction & Fulfillment Evidence)
-- =================================================================================
CREATE TABLE `evidence` (
  `evidence_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
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
  INDEX `idx_evidence_case_id` (`case_id`),
  CONSTRAINT `fk_evidence_dispute` FOREIGN KEY (`dispute_id`) REFERENCES `disputes` (`dispute_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 3. TABLE: predictions (ML RandomForest Classifier Win Predictions & Routing)
-- =================================================================================
CREATE TABLE `predictions` (
  `prediction_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL,
  `win_probability` DECIMAL(5, 4) NOT NULL,
  `decision` VARCHAR(32) NOT NULL,
  `model_name` VARCHAR(128) DEFAULT 'RandomForestClassifier',
  `model_version` VARCHAR(32) DEFAULT '1.0',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_predictions_case_id` (`case_id`),
  INDEX `idx_predictions_decision` (`decision`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 4. TABLE: defense_responses (Gemini LLM Grounded Defense Payloads)
-- =================================================================================
CREATE TABLE `defense_responses` (
  `defense_response_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL,
  `response_text` LONGTEXT NOT NULL,
  `generated_by` VARCHAR(64) DEFAULT 'gemini-3.8-flash',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_defense_case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 5. TABLE: audit_logs (Immutable System Event Audit Trail)
-- =================================================================================
CREATE TABLE `audit_logs` (
  `audit_log_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `case_id` VARCHAR(64) NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `details` TEXT NOT NULL,
  `actor` VARCHAR(64) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_case_id` (`case_id`),
  INDEX `idx_audit_actor` (`actor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 6. TABLE: risk_configs (Three-Zone Policy & Dynamic Threshold Parameters)
-- =================================================================================
CREATE TABLE `risk_configs` (
  `risk_config_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `network_ceiling` DOUBLE NOT NULL DEFAULT 0.015,
  `representation_fee` DOUBLE NOT NULL DEFAULT 1500.0,
  `human_review_cost` DOUBLE NOT NULL DEFAULT 200.0,
  `trailing_period_days` INT NOT NULL DEFAULT 30,
  `base_strong_threshold` DOUBLE NOT NULL DEFAULT 0.70,
  `base_weak_threshold` DOUBLE NOT NULL DEFAULT 0.40,
  `t_cap` DOUBLE NOT NULL DEFAULT 0.95,
  `alpha` DOUBLE NOT NULL DEFAULT 0.20,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- 7. TABLE: dispute_ratio_states (Visa VAMP Merchant Ratio Metrics)
-- =================================================================================
CREATE TABLE `dispute_ratio_states` (
  `dispute_ratio_state_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `period_days` INT NOT NULL DEFAULT 30,
  `disputes_count` INT NOT NULL DEFAULT 1000,
  `disputes_lost_count` INT NOT NULL DEFAULT 9,
  `disputes_won_count` INT NOT NULL DEFAULT 91,
  `disputes_fought_count` INT NOT NULL DEFAULT 100,
  `loss_ratio` DOUBLE NOT NULL DEFAULT 0.009,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- DML DATA INITIALIZATION (REAL NATIVE MYSQL RECORDS)
-- =================================================================================

-- Risk Policy Config & Ratio Metrics Initialization
INSERT INTO `risk_configs` (`risk_config_id`, `network_ceiling`, `representation_fee`, `human_review_cost`, `trailing_period_days`, `base_strong_threshold`, `base_weak_threshold`, `t_cap`, `alpha`)
VALUES (1, 0.015, 1500.0, 200.0, 30, 0.70, 0.40, 0.95, 0.20);

INSERT INTO `dispute_ratio_states` (`dispute_ratio_state_id`, `period_days`, `disputes_count`, `disputes_lost_count`, `disputes_won_count`, `disputes_fought_count`, `loss_ratio`)
VALUES (1, 30, 1000, 9, 91, 100, 0.009);

-- Disputes Records
INSERT INTO `disputes` (`dispute_id`, `case_id`, `dispute_amount`, `dispute_reason`, `days_since_order`, `created_at`, `updated_at`) VALUES
(1, 'CB-8942-IN', 145000.00, 'fraudulent_transaction', 3, NOW() - INTERVAL 4 MINUTE, NOW() - INTERVAL 4 MINUTE),
(2, 'CB-7819-IN', 54200.00, 'item_not_received', 7, NOW() - INTERVAL 12 MINUTE, NOW() - INTERVAL 12 MINUTE),
(3, 'CB-6120-IN', 18900.00, 'not_as_described', 14, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 20 MINUTE),
(4, 'CB-5431-IN', 89500.00, 'canceled_recurring_billing', 21, NOW() - INTERVAL 42 MINUTE, NOW() - INTERVAL 35 MINUTE),
(5, 'CB-4310-IN', 12800.00, 'credit_not_processed', 10, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 1 HOUR),
(6, 'CB-3291-IN', 9450.00, 'item_not_received', 28, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR),
(7, 'CB-2104-IN', 210000.00, 'fraudulent_transaction', 2, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 3 HOUR),
(8, 'CB-1982-IN', 32000.00, 'not_as_described', 6, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 5 HOUR),
(9, 'CB-1540-IN', 14999.00, 'fraudulent_transaction', 25, NOW() - INTERVAL 8 HOUR, NOW() - INTERVAL 8 HOUR),
(10, 'CB-1205-IN', 78000.00, 'canceled_recurring_billing', 15, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 12 HOUR),
(11, 'CB-1102-IN', 45500.00, 'not_as_described', 11, NOW() - INTERVAL 14 HOUR, NOW() - INTERVAL 14 HOUR),
(12, 'CB-1050-IN', 22400.00, 'credit_not_processed', 19, NOW() - INTERVAL 16 HOUR, NOW() - INTERVAL 16 HOUR);

-- Evidence Records
INSERT INTO `evidence` (`case_id`, `dispute_id`, `order_exists`, `invoice_exists`, `payment_confirmed`, `delivery_status`, `tracking_number_present`, `customer_communication`, `refund_status`, `customer_prior_dispute_count`, `created_at`) VALUES
('CB-8942-IN', 1, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 4 MINUTE),
('CB-7819-IN', 2, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 12 MINUTE),
('CB-6120-IN', 3, TRUE, TRUE, TRUE, 'delivered_unconfirmed', TRUE, 'complained_before', 'no_refund', 1, NOW() - INTERVAL 25 MINUTE),
('CB-5431-IN', 4, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 42 MINUTE),
('CB-4310-IN', 5, TRUE, TRUE, TRUE, 'delivered_unconfirmed', TRUE, 'complained_before', 'refund_pending', 1, NOW() - INTERVAL 1 HOUR),
('CB-3291-IN', 6, TRUE, TRUE, TRUE, 'unknown', FALSE, 'no_contact', 'no_refund', 3, NOW() - INTERVAL 2 HOUR),
('CB-2104-IN', 7, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 3 HOUR),
('CB-1982-IN', 8, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 5 HOUR),
('CB-1540-IN', 9, TRUE, FALSE, FALSE, 'unknown', FALSE, 'no_contact', 'no_refund', 4, NOW() - INTERVAL 8 HOUR),
('CB-1205-IN', 10, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 12 HOUR),
('CB-1102-IN', 11, TRUE, TRUE, TRUE, 'delivered_confirmed', TRUE, 'acknowledged_receipt', 'no_refund', 0, NOW() - INTERVAL 14 HOUR),
('CB-1050-IN', 12, TRUE, TRUE, TRUE, 'delivered_unconfirmed', TRUE, 'complained_before', 'refund_pending', 1, NOW() - INTERVAL 16 HOUR);

-- Predictions Records
INSERT INTO `predictions` (`case_id`, `win_probability`, `decision`, `model_name`, `model_version`, `created_at`) VALUES
('CB-8942-IN', 0.9600, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 4 MINUTE),
('CB-7819-IN', 0.9400, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 12 MINUTE),
('CB-6120-IN', 0.5800, 'BORDERLINE', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 20 MINUTE),
('CB-5431-IN', 0.8500, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 35 MINUTE),
('CB-4310-IN', 0.4600, 'BORDERLINE', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 1 HOUR),
('CB-3291-IN', 0.1400, 'WEAK', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 2 HOUR),
('CB-2104-IN', 0.9800, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 3 HOUR),
('CB-1982-IN', 0.8900, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 5 HOUR),
('CB-1540-IN', 0.2200, 'WEAK', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 8 HOUR),
('CB-1205-IN', 0.8100, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 12 HOUR),
('CB-1102-IN', 0.8700, 'STRONG', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 14 HOUR),
('CB-1050-IN', 0.5200, 'BORDERLINE', 'RandomForestClassifier', '1.0', NOW() - INTERVAL 16 HOUR);

-- Audit Logs Records
INSERT INTO `audit_logs` (`case_id`, `action`, `details`, `actor`, `created_at`) VALUES
('CB-8942-IN', 'Case Received', 'High-value chargeback notice received from Visa Acquirer (Ref: TXN-8942-0192)', 'OPERATOR', NOW() - INTERVAL 4 MINUTE),
('CB-8942-IN', '3DS Verification', '3D-Secure 2.0 authentication liability shift verified with HDFC acquiring bank payload', 'SYSTEM', NOW() - INTERVAL 3 MINUTE),
('CB-8942-IN', 'ML Analysis', 'Predicted win confidence: 96% -> STRONG Zone (Auto-Respond Authorized)', 'ML_CLASSIFIER', NOW() - INTERVAL 2 MINUTE),
('CB-7819-IN', 'Case Received', 'Item Not Received dispute initiated by cardholder (Order #ORD-IN-2026-7819)', 'OPERATOR', NOW() - INTERVAL 12 MINUTE),
('CB-7819-IN', 'Courier Audit', 'FedEx Express tracking (FX-78192019-IN) verified with signed proof of delivery photo', 'SYSTEM', NOW() - INTERVAL 11 MINUTE),
('CB-6120-IN', 'Case Received', 'Merchandise quality dispute filed via Mastercard gateway', 'OPERATOR', NOW() - INTERVAL 25 MINUTE),
('CB-6120-IN', 'Interaction Logged', 'Customer email thread attached showing merchant offered 15% discount credit', 'SYSTEM', NOW() - INTERVAL 22 MINUTE),
('CB-6120-IN', 'ML Analysis', 'Predicted win confidence: 58% -> BORDERLINE Zone (Human Review Required)', 'ML_CLASSIFIER', NOW() - INTERVAL 20 MINUTE),
('CB-5431-IN', 'Case Received', 'Subscription renewal charge dispute filed by cardholder', 'OPERATOR', NOW() - INTERVAL 42 MINUTE),
('CB-5431-IN', 'Contract Audit', 'Annual SaaS contract digital agreement timestamp & IP match verified', 'SYSTEM', NOW() - INTERVAL 38 MINUTE),
('CB-5431-IN', 'ML Analysis', 'Predicted win confidence: 85% -> STRONG Zone', 'ML_CLASSIFIER', NOW() - INTERVAL 35 MINUTE);
