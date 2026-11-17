CREATE TABLE `customer_requests` (
    `id` CHAR(36) NOT NULL,
    `customer_name` VARCHAR(150) NOT NULL,
    `customer_email` VARCHAR(254) NULL,
    `customer_phone` VARCHAR(30) NULL,
    `subject` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `is_priority` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    CONSTRAINT `chk_customer_name_len` CHECK (CHAR_LENGTH(TRIM(`customer_name`)) BETWEEN 2 AND 150),
    CONSTRAINT `chk_subject_len` CHECK (CHAR_LENGTH(TRIM(`subject`)) BETWEEN 3 AND 200),
    CONSTRAINT `chk_description_len` CHECK (CHAR_LENGTH(TRIM(`description`)) BETWEEN 10 AND 5000),
    CONSTRAINT `chk_email_len` CHECK (`customer_email` IS NULL OR CHAR_LENGTH(TRIM(`customer_email`)) BETWEEN 1 AND 254),
    CONSTRAINT `chk_phone_len` CHECK (`customer_phone` IS NULL OR CHAR_LENGTH(TRIM(`customer_phone`)) BETWEEN 1 AND 30)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `idx_requests_list`
    ON `customer_requests` (`is_priority` DESC, `created_at` DESC, `id` DESC);
