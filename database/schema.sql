-- =================================================================================
-- CHARGEBACK EVIDENCE RESPONDER - PRODUCTION DATABASE SCHEMA (DDL ONLY)
-- =================================================================================
-- MySQL 8.0+ Compatible

CREATE DATABASE IF NOT EXISTS `chargeback_responder`
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `chargeback_responder`;

-- Table: disputes
CREATE TABLE IF NOT EXISTS `disputes` (
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

-- Table: evidence
CREATE TABLE IF NOT EXISTS `evidence` (
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

-- Table: predictions
CREATE TABLE IF NOT EXISTS `predictions` (
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

-- Table: defense_responses
CREATE TABLE IF NOT EXISTS `defense_responses` (
    `defense_response_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `case_id` VARCHAR(64) NOT NULL,
    `response_text` LONGTEXT NOT NULL,
    `generated_by` VARCHAR(64) DEFAULT 'gemini-3.8-flash',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_defense_case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `audit_log_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `case_id` VARCHAR(64) NOT NULL,
    `action` VARCHAR(128) NOT NULL,
    `details` TEXT NOT NULL,
    `actor` VARCHAR(64) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_case_id` (`case_id`),
    INDEX `idx_audit_actor` (`actor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: risk_configs
CREATE TABLE IF NOT EXISTS `risk_configs` (
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

-- Table: dispute_ratio_states
CREATE TABLE IF NOT EXISTS `dispute_ratio_states` (
    `dispute_ratio_state_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `period_days` INT NOT NULL DEFAULT 30,
    `disputes_count` INT NOT NULL DEFAULT 1000,
    `disputes_lost_count` INT NOT NULL DEFAULT 9,
    `disputes_won_count` INT NOT NULL DEFAULT 91,
    `disputes_fought_count` INT NOT NULL DEFAULT 100,
    `loss_ratio` DOUBLE NOT NULL DEFAULT 0.009,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
