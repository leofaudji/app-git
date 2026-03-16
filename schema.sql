-- ============================================================
-- Git Webhook Auto-Deploy Application - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS `app_git_deploy` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `app_git_deploy`;

-- Roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `label` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `module` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  UNIQUE KEY `uniq_perm` (`module`, `action`)
) ENGINE=InnoDB;

-- Role-Permission pivot
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User-Role pivot
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Deployment logs
CREATE TABLE IF NOT EXISTS `deploy_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `triggered_by` ENUM('webhook','manual') NOT NULL DEFAULT 'manual',
  `user_id` INT UNSIGNED NULL,
  `branch` VARCHAR(100) DEFAULT 'main',
  `commit_hash` VARCHAR(64) DEFAULT '',
  `status` ENUM('success','failed','running') NOT NULL DEFAULT 'running',
  `output` TEXT,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- App settings
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT,
  `label` VARCHAR(100) NOT NULL,
  `type` ENUM('text','password','boolean','textarea') DEFAULT 'text',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- Seed Data
-- ============================================================

-- Roles
INSERT IGNORE INTO `roles` (`name`, `label`) VALUES
  ('admin', 'Administrator'),
  ('developer', 'Developer'),
  ('viewer', 'Viewer');

-- Permissions
INSERT IGNORE INTO `permissions` (`module`, `action`, `label`) VALUES
  ('dashboard', 'view', 'View Dashboard'),
  ('git', 'view', 'View Git Info'),
  ('git', 'pull', 'Execute Git Pull'),
  ('logs', 'view', 'View Deploy Logs'),
  ('logs', 'delete', 'Delete Deploy Logs'),
  ('users', 'view', 'View Users'),
  ('users', 'create', 'Create User'),
  ('users', 'update', 'Update User'),
  ('users', 'delete', 'Delete User'),
  ('roles', 'view', 'View Roles'),
  ('roles', 'manage', 'Manage Roles'),
  ('settings', 'view', 'View Settings'),
  ('settings', 'edit', 'Edit Settings'),
  ('webhook', 'receive', 'Receive Webhook');

-- Assign all permissions to admin
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT r.id, p.id FROM `roles` r, `permissions` p WHERE r.name = 'admin';

-- Developer permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT r.id, p.id FROM `roles` r
  JOIN `permissions` p ON (p.module = 'dashboard' AND p.action = 'view')
    OR (p.module = 'git' AND p.action IN ('view','pull'))
    OR (p.module = 'logs' AND p.action = 'view')
  WHERE r.name = 'developer';

-- Viewer permissions
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT r.id, p.id FROM `roles` r
  JOIN `permissions` p ON (p.module = 'dashboard' AND p.action = 'view')
    OR (p.module = 'git' AND p.action = 'view')
    OR (p.module = 'logs' AND p.action = 'view')
  WHERE r.name = 'viewer';

-- Default settings
INSERT IGNORE INTO `settings` (`key`, `value`, `label`, `type`) VALUES
  ('app_name', 'GitDeploy', 'Application Name', 'text'),
  ('git_dir', '', 'Git Repository Directory (absolute path)', 'text'),
  ('webhook_secret', 'change_me_secret_key', 'Webhook Secret Key', 'password'),
  ('git_branch', 'main', 'Default Branch to Pull', 'text'),
  ('notify_email', '', 'Notification Email', 'text'),
  ('auto_deploy', '1', 'Enable Auto Deploy on Webhook', 'boolean');
