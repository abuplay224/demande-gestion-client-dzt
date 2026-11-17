CREATE TABLE `api_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `access_token_hash` VARCHAR(191) NOT NULL,
    `access_expires_at` DATETIME(3) NOT NULL,
    `refresh_token_hash` VARCHAR(191) NOT NULL,
    `previous_refresh_hash` VARCHAR(191) NULL,
    `refresh_expires_at` DATETIME(3) NOT NULL,
    `device_name` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `api_sessions_access_token_hash_key` ON `api_sessions` (`access_token_hash`);
CREATE UNIQUE INDEX `api_sessions_refresh_token_hash_key` ON `api_sessions` (`refresh_token_hash`);
CREATE UNIQUE INDEX `api_sessions_previous_refresh_hash_key` ON `api_sessions` (`previous_refresh_hash`);
CREATE INDEX `api_sessions_user_id_idx` ON `api_sessions` (`user_id`);

ALTER TABLE `api_sessions`
    ADD CONSTRAINT `api_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
