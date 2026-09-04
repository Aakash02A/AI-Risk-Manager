-- Chargeback Evidence Responder Database Schema
-- MySQL 8+ Compatible

CREATE DATABASE IF NOT EXISTS chargeback_responder;
USE chargeback_responder;

-- Table: disputes
CREATE TABLE IF NOT EXISTS disputes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    dispute_amount DECIMAL(12, 2) NOT NULL,
    dispute_reason ENUM(
        'item_not_received',
        'not_as_described',
        'unauthorized_transaction',
        'duplicate_charge'
    ) NOT NULL,
    days_since_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_disputes_case_id (case_id),
    INDEX idx_disputes_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: evidence
CREATE TABLE IF NOT EXISTS evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    order_exists BOOLEAN NOT NULL DEFAULT TRUE,
    invoice_exists BOOLEAN NOT NULL DEFAULT TRUE,
    payment_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_status ENUM(
        'delivered_confirmed',
        'delivered_unconfirmed',
        'not_delivered',
        'unknown'
    ) NOT NULL,
    tracking_number_present BOOLEAN NOT NULL DEFAULT FALSE,
    customer_communication ENUM(
        'acknowledged_receipt',
        'complained_before',
        'no_contact'
    ) NOT NULL,
    refund_status ENUM(
        'no_refund',
        'partial_refund',
        'full_refund'
    ) NOT NULL,
    customer_prior_dispute_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES disputes(case_id) ON DELETE CASCADE,
    INDEX idx_evidence_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: predictions
CREATE TABLE IF NOT EXISTS predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    win_probability DECIMAL(5, 4) NOT NULL,
    decision ENUM('STRONG', 'BORDERLINE', 'WEAK') NOT NULL,
    model_name VARCHAR(128) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES disputes(case_id) ON DELETE CASCADE,
    INDEX idx_predictions_case_id (case_id),
    INDEX idx_predictions_decision (decision),
    INDEX idx_predictions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: defense_responses
CREATE TABLE IF NOT EXISTS defense_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    response_text LONGTEXT NOT NULL,
    generated_by VARCHAR(64) NOT NULL DEFAULT 'gemini-3.8-flash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES disputes(case_id) ON DELETE CASCADE,
    INDEX idx_defense_case_id (case_id),
    INDEX idx_defense_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    details TEXT,
    actor VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_case_id (case_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: risk_config
CREATE TABLE IF NOT EXISTS risk_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    network_ceiling DECIMAL(5, 4) NOT NULL DEFAULT 0.0150,
    representation_fee DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
    human_review_cost DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
    trailing_period_days INT NOT NULL DEFAULT 30,
    base_strong_threshold DECIMAL(5, 4) NOT NULL DEFAULT 0.8000,
    base_weak_threshold DECIMAL(5, 4) NOT NULL DEFAULT 0.3000,
    t_cap DECIMAL(5, 4) NOT NULL DEFAULT 0.9500,
    alpha DECIMAL(5, 4) NOT NULL DEFAULT 0.2000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: dispute_ratio_state
CREATE TABLE IF NOT EXISTS dispute_ratio_state (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    period_days INT NOT NULL DEFAULT 30,
    disputes_count INT NOT NULL DEFAULT 1000,
    disputes_lost_count INT NOT NULL DEFAULT 9,
    disputes_won_count INT NOT NULL DEFAULT 91,
    disputes_fought_count INT NOT NULL DEFAULT 100,
    loss_ratio DECIMAL(5, 4) NOT NULL DEFAULT 0.0090,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

