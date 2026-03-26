-- GitDeploy Database Backup
-- Generated: 2026-03-19 13:48:07
-- Host: 127.0.0.1 | DB: app_git_deploy
-- --------------------------------------------------------

SET FOREIGN_KEY_CHECKS=0;

-- Table: `roles`
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` VALUES 
('1', 'admin', 'Administrator', '2026-03-16 11:27:37'),
('2', 'developer', 'Developer', '2026-03-16 11:27:37'),
('3', 'viewer', 'Viewer', '2026-03-16 11:27:37');

-- Table: `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` VALUES 
('1', 'admin', 'admin@gitdeploy.local', '$2y$10$q9RPibI/0wUxHoc/uZXiqObypS2MgHc2a3.Xl0wFzzi.sNr9hVLCu', 'Administrator', NULL, '1', '2026-03-17 11:38:36', '2026-03-16 11:28:00', '2026-03-17 11:38:36'),
('2', 'developer', 'dev@gitdeploy.local', '$2y$10$yV0xlUF1TmG2ZqP3h3GBNecW12YyihX8Bg6RRuXCQtTiVfTvCmTdi', 'Developer User', NULL, '1', NULL, '2026-03-16 11:28:00', '2026-03-16 11:28:00');

-- Table: `permissions`
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_perm` (`module`,`action`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` VALUES 
('1', 'dashboard', 'view', 'View Dashboard'),
('2', 'git', 'view', 'View Git Info'),
('3', 'git', 'pull', 'Execute Git Pull'),
('4', 'logs', 'view', 'View Deploy Logs'),
('5', 'logs', 'delete', 'Delete Deploy Logs'),
('6', 'users', 'view', 'View Users'),
('7', 'users', 'create', 'Create User'),
('8', 'users', 'update', 'Update User'),
('9', 'users', 'delete', 'Delete User'),
('10', 'roles', 'view', 'View Roles'),
('11', 'roles', 'manage', 'Manage Roles'),
('12', 'settings', 'view', 'View Settings'),
('13', 'settings', 'edit', 'Edit Settings'),
('14', 'webhook', 'receive', 'Receive Webhook'),
('15', 'projects', 'view', 'View Projects'),
('16', 'projects', 'manage', 'Manage Projects'),
('17', 'webhook_logs', 'view', 'View Webhook Logs'),
('18', 'webhook_logs', 'delete', 'Delete Webhook Logs'),
('19', 'audit', 'view', 'View Audit Logs');

-- Table: `role_permissions`
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` int unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `role_permissions` VALUES 
('1', '1'),
('2', '1'),
('3', '1'),
('1', '2'),
('2', '2'),
('3', '2'),
('1', '3'),
('2', '3'),
('1', '4'),
('2', '4'),
('3', '4'),
('1', '5'),
('1', '6'),
('1', '7'),
('1', '8'),
('1', '9'),
('1', '10'),
('1', '11'),
('1', '12'),
('1', '13'),
('1', '14'),
('1', '15'),
('1', '16'),
('1', '17'),
('1', '18'),
('1', '19');

-- Table: `projects`
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `repo_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `folder_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'main',
  `app_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_drift` tinyint(1) DEFAULT '0',
  `security_score` int DEFAULT NULL,
  `security_details` text COLLATE utf8mb4_unicode_ci,
  `last_security_check` datetime DEFAULT NULL,
  `last_drift_check` datetime DEFAULT NULL,
  `current_version` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '1.0.0',
  `webhook_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` VALUES 
('1', 'KSP SMKN 5 Malang', 'leofaudji/app-koperasi', 'app-koperasi', 'main', 'https://smkn5-ksp.crudworks.web.id', '0', '100', '{\"sensitive_files\":[{\"file\":\".env\",\"description\":\"Environment configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/.env\",\"code\":502},{\"file\":\".git\\/config\",\"description\":\"Git configuration directory\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/.git\\/config\",\"code\":502},{\"file\":\"config.php.bak\",\"description\":\"Backup of configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/config.php.bak\",\"code\":200},{\"file\":\"composer.lock\",\"description\":\"Dependency lock file (information disclosure)\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/composer.lock\",\"code\":200},{\"file\":\"phpinfo.php\",\"description\":\"PHP Information file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/phpinfo.php\",\"code\":200}],\"php_info\":\"Not detected (Secure)\",\"headers\":{\"date\":\"Thu, 19 Mar 2026 13:41:25 GMT\",\"content-type\":\"text\\/html; charset=UTF-8\",\"vary\":\"Accept-Encoding\",\"x-content-type-options\":\"nosniff\",\"server\":\"cloudflare\",\"strict-transport-security\":\"max-age=63072000; includeSubDomains; preload\",\"x-dynamic-cache\":\"HIT\",\"alt-svc\":\"h3=\\\":443\\\"; ma=86400\",\"report-to\":\"{\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800,\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=yxLdEKiXU2SnXX9G4VoZdNfGdIue4Tw2S57aQmN0ApCfNgpuf%2BydWFF4iJauvV04AzQfWSHxTTkxGzpS684NqdVqzKYx26SD6mRIJwTB7T8ydx%2FcZnTHzUXIWvPuck6w7sRIRyt9\\\"}]}\",\"cf-cache-status\":\"DYNAMIC\",\"nel\":\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"success_fraction\\\":0.0,\\\"max_age\\\":604800}\",\"cf-ray\":\"9dece501ea6da092-SIN\"},\"score\":100,\"php_status\":\"Secure\",\"missing_headers\":[\"Content-Security-Policy\",\"X-Frame-Options\",\"X-Content-Type-Options\",\"Strict-Transport-Security\"]}', '2026-03-19 20:41:25', '2026-03-19 20:41:21', '1.0.1', '', '', '1', '2026-03-16 13:18:16', '2026-03-19 20:41:25'),
('3', 'Perum Puri Nirwana Pandanwangi', 'leofaudji/pnp-digital', 'app-rt', 'main', 'https://pnp.crudworks.web.id', '1', '100', '{\"sensitive_files\":[{\"file\":\".env\",\"description\":\"Environment configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/.env\",\"code\":502},{\"file\":\".git\\/config\",\"description\":\"Git configuration directory\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/.git\\/config\",\"code\":502},{\"file\":\"config.php.bak\",\"description\":\"Backup of configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/config.php.bak\",\"code\":404},{\"file\":\"composer.lock\",\"description\":\"Dependency lock file (information disclosure)\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/composer.lock\",\"code\":404},{\"file\":\"phpinfo.php\",\"description\":\"PHP Information file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/phpinfo.php\",\"code\":404}],\"php_info\":\"Not detected (Secure)\",\"headers\":{\"date\":\"Tue, 17 Mar 2026 08:00:36 GMT\",\"content-type\":\"text\\/html; charset=UTF-8\",\"vary\":\"Accept-Encoding\",\"expires\":\"Thu, 19 Nov 1981 08:52:00 GMT\",\"cache-control\":\"no-store, no-cache, must-revalidate\",\"pragma\":\"no-cache\",\"set-cookie\":\"PHPSESSID=vb86nv4s207kvgeq03j4h4digh; path=\\/; SameSite=Lax\",\"server\":\"cloudflare\",\"strict-transport-security\":\"max-age=63072000; includeSubDomains; preload\",\"x-dynamic-cache\":\"MISS\",\"alt-svc\":\"h3=\\\":443\\\"; ma=86400\",\"report-to\":\"{\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800,\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=wYprV4x2DJ5NDtLUG2%2BWYFxPoeMp4U1d%2Br506TyKrOQJ4Zya%2FsCvS0wRsEe1WDcCLdtR8KVgLEn6sDljj3j8oUT8ceHYnwhniR%2BSH43Wz90l1NLm\\\"}]}\",\"cf-cache-status\":\"DYNAMIC\",\"nel\":\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"success_fraction\\\":0.0,\\\"max_age\\\":604800}\",\"cf-ray\":\"9dda77015b2afe08-SIN\"},\"score\":100,\"php_status\":\"Secure\",\"missing_headers\":[\"Content-Security-Policy\",\"X-Frame-Options\",\"X-Content-Type-Options\",\"Strict-Transport-Security\"]}', '2026-03-17 15:00:35', '2026-03-17 15:03:10', '1.0.1', '', '', '1', '2026-03-16 13:44:47', '2026-03-17 15:03:10');

-- Table: `deploy_logs`
DROP TABLE IF EXISTS `deploy_logs`;
CREATE TABLE `deploy_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `project_id` int unsigned DEFAULT NULL,
  `triggered_by` enum('webhook','manual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `user_id` int unsigned DEFAULT NULL,
  `branch` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'main',
  `commit_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `status` enum('success','failed','running') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'running',
  `output` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `deploy_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `deploy_logs_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `deploy_logs` VALUES 
('1', NULL, 'webhook', NULL, 'main', '', 'running', NULL, '::1', '2026-03-16 11:57:33'),
('2', NULL, 'webhook', NULL, 'main', '', 'running', NULL, '::1', '2026-03-16 12:01:19'),
('3', NULL, 'webhook', NULL, 'main', '', 'running', NULL, '::1', '2026-03-16 12:02:04'),
('4', NULL, 'webhook', NULL, 'main', '', 'running', NULL, '::1', '2026-03-16 12:02:41'),
('5', NULL, 'webhook', NULL, 'main', '76e945f', 'success', 'From https://github.com/leofaudji/pnp-digital\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-16 12:08:39'),
('6', NULL, 'manual', '1', 'main', '76e945f', 'success', 'From https://github.com/leofaudji/pnp-digital\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-16 12:11:02'),
('7', '1', 'manual', '1', 'main', '97e209b', 'success', 'From https://github.com/leofaudji/app-koperasi\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-16 13:20:55'),
('12', '1', 'manual', '1', 'main', '2ea8d85', 'success', 'From https://github.com/leofaudji/app-koperasi\n * branch            main       -> FETCH_HEAD\n   97e209b..2ea8d85  main       -> origin/main\nUpdating 97e209b..2ea8d85\nFast-forward\n check_settings.php                  |  5 --\n database/migrate_biaya_pinjaman.sql | 32 -------------\n database/migrate_credit_score.sql   |  2 -\n database/migrate_topup.sql          |  3 --\n database/migration_agunan_v2.sql    | 54 ---------------------\n dump_settings.php                   |  5 --\n list_settings.php                   |  5 --\n migration_audit_logs.php            | 44 -----------------\n migration_pengumuman.php            | 43 -----------------\n settings_list.txt                   | 94 -------------------------------------\n test_menu.php                       | 33 -------------\n update_settings_db.php              | 23 ---------\n verify_db.php                       |  7 ---\n write_settings.php                  |  5 --\n 14 files changed, 355 deletions(-)\n delete mode 100644 check_settings.php\n delete mode 100644 database/migrate_biaya_pinjaman.sql\n delete mode 100644 database/migrate_credit_score.sql\n delete mode 100644 database/migrate_topup.sql\n delete mode 100644 database/migration_agunan_v2.sql\n delete mode 100644 dump_settings.php\n delete mode 100644 list_settings.php\n delete mode 100644 migration_audit_logs.php\n delete mode 100644 migration_pengumuman.php\n delete mode 100644 settings_list.txt\n delete mode 100644 test_menu.php\n delete mode 100644 update_settings_db.php\n delete mode 100644 verify_db.php\n delete mode 100644 write_settings.php', '::1', '2026-03-16 13:27:39'),
('14', '1', 'manual', '1', 'main', '63e0bb0', 'success', 'From https://github.com/leofaudji/app-koperasi\n * branch            main       -> FETCH_HEAD\n   2ea8d85..63e0bb0  main       -> origin/main\nUpdating 2ea8d85..63e0bb0\nFast-forward\n .gitignore | 2 ++\n 1 file changed, 2 insertions(+)\n create mode 100644 .gitignore', '::1', '2026-03-16 13:40:55'),
('15', '1', 'webhook', NULL, 'main', '63e0bb0', 'success', 'From https://github.com/leofaudji/app-koperasi\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-16 13:47:00'),
('16', '3', 'webhook', NULL, 'main', '76e945f', 'failed', 'From https://github.com/leofaudji/pnp-digital\n * branch            main       -> FETCH_HEAD\nerror: Your local changes to the following files would be overwritten by merge:\n	.gitignore\n	.htaccess\n	config/database.php\nPlease commit your changes or stash them before you merge.\nUpdating 76e945f..41c964c\nAborting', '::1', '2026-03-16 13:48:34'),
('17', '1', 'webhook', NULL, 'main', 'f221486', 'success', 'From https://github.com/leofaudji/app-koperasi\n * branch            main       -> FETCH_HEAD\n   63e0bb0..f221486  main       -> origin/main\nUpdating 63e0bb0..f221486\nFast-forward', '::1', '2026-03-16 13:52:23'),
('18', '1', 'webhook', NULL, 'main', '34588a4', 'success', 'From https://github.com/leofaudji/app-koperasi\n * branch            main       -> FETCH_HEAD\n   f221486..34588a4  main       -> origin/main\nUpdating f221486..34588a4\nFast-forward\n CHANGELOG.md                 |  80 ++++++++++++\n api/config/menus.json        |   7 +\n assets/js/app.js             |  72 ++++++++++\n assets/js/pages/changelog.js | 304 +++++++++++++++++++++++++++++++++++++++++++\n index.html                   |  16 +++\n 5 files changed, 479 insertions(+)\n create mode 100644 CHANGELOG.md\n create mode 100644 assets/js/pages/changelog.js', '::1', '2026-03-16 14:09:42'),
('19', '3', 'manual', '1', 'main', '76e945f', 'failed', 'From https://github.com/leofaudji/pnp-digital\n * branch            main       -> FETCH_HEAD\nerror: Your local changes to the following files would be overwritten by merge:\n	.gitignore\n	.htaccess\n	config/database.php\nPlease commit your changes or stash them before you merge.\nUpdating 76e945f..41c964c\nAborting', '::1', '2026-03-16 14:58:28');

-- Table: `webhook_logs`
DROP TABLE IF EXISTS `webhook_logs`;
CREATE TABLE `webhook_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `project_id` int unsigned DEFAULT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'push',
  `payload_summary` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `status` enum('success','failed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headers` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `webhook_logs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `webhook_logs` VALUES 
('1', '1', 'push', 'leofaudji/app-koperasi [main]', 'success', 'Deployment triggered', '::1', '{\"User-Agent\":\"\",\"Signature\":\"sha256=40f87a4915bfcb4f99bc16126062673444b4a333a5b2d16aecdc752bae1cf784\",\"Event\":\"push\"}', '2026-03-16 13:47:01'),
('2', '1', 'push', 'leofaudji/app-koperasi [main]', 'failed', 'Invalid signature', '::1', '{\"User-Agent\":\"\",\"Signature\":\"sha256=40f87a4915bfcb4f99bc16126062673444b4a333a5b2d16aecdc752bae1cf784wrong\",\"Event\":\"push\"}', '2026-03-16 13:47:01'),
('3', NULL, 'push', 'unknown/repo [main]', 'failed', 'No active project found for repository \'unknown/repo\'', '::1', '{\"User-Agent\":\"\",\"Signature\":\"sha256=97bf123aef589963a6e8f96f336b343d958bfb0bf7decebb2a93471db2e88a92\",\"Event\":\"push\"}', '2026-03-16 13:47:01'),
('4', '3', 'push', 'leofaudji/pnp-digital [main]', 'success', 'Deployment triggered', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=6ceb6420417bdeddcd2c76a7559a8fa23f53b50ce93b781e90bc95c63859560a\",\"Event\":\"push\"}', '2026-03-16 13:48:35'),
('5', '1', 'push', 'leofaudji/app-koperasi [main]', 'success', 'Deployment triggered', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=7c65be59dc21d5f62f05f1a7462d43db870c03b247981b1f98ac5e5839784345\",\"Event\":\"push\"}', '2026-03-16 13:52:25'),
('6', '1', 'push', 'leofaudji/app-koperasi [main]', 'success', 'Deployment triggered', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=866972f3a49a4a6deae83a5101db1658ef14af8688eddd5274ed07ae7a4500cf\",\"Event\":\"push\"}', '2026-03-16 14:09:44'),
('7', NULL, 'push', 'leofaudji/app-git [main]', 'failed', 'No active project found for repository \'leofaudji/app-git\'', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=cc214beca52f791af2ba092e089113a8b3b8ed30bab6a61279c69116ff86bf04\",\"Event\":\"push\"}', '2026-03-16 14:16:41'),
('8', NULL, 'push', 'leofaudji/app-git [main]', 'failed', 'No active project found for repository \'leofaudji/app-git\'', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=a20ddbe32418cfe1217dbd3ba7fd530ca1a9356c5cf65dc40aae731ba7732308\",\"Event\":\"push\"}', '2026-03-16 15:19:41'),
('9', NULL, 'push', 'leofaudji/app-git [main]', 'failed', 'No active project found for repository \'leofaudji/app-git\'', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=69ff7eb40ad1704ecba52ced4691e1c2fc6ed88c5b45ea5ae7368c8b59cfa130\",\"Event\":\"push\"}', '2026-03-16 15:22:33'),
('10', NULL, 'push', 'leofaudji/app-git [main]', 'failed', 'No active project found for repository \'leofaudji/app-git\'', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/d712f74\",\"Signature\":\"sha256=1368fe32af4a2b78fb7a71c10650ad7de4f3c8a4036292a3dea36b7b7ab4b2a5\",\"Event\":\"push\"}', '2026-03-16 15:29:07'),
('11', NULL, 'push', 'leofaudji/app-git [main]', 'failed', 'No active project found for repository \'leofaudji/app-git\'', '::1', '{\"User-Agent\":\"GitHub-Hookshot\\/c3be25b\",\"Signature\":\"sha256=152d65d91fd3f56482165d0631aec1e39421790070d5b8b1192a55a955abee9c\",\"Event\":\"push\"}', '2026-03-17 08:03:32');

-- Table: `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('text','password','boolean','textarea') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` VALUES 
('app_name', 'CRUDWorks Project', 'Application Name', 'text', '2026-03-16 13:02:40'),
('auto_deploy', '1', 'Enable Auto Deploy on Webhook', 'boolean', '2026-03-16 11:27:37'),
('git_base_dir', 'D:\\laragon\\www\\testing-git', 'Global Projects Base Directory', 'text', '2026-03-16 13:12:08'),
('git_branch', 'main', 'Default Branch to Pull', 'text', '2026-03-16 11:27:37'),
('notify_email', 'leofaudji@gmail.com', 'Notification Email', 'text', '2026-03-16 11:51:22'),
('webhook_secret_default', '1234567890abcdefgh', 'Default Webhook Secret', 'password', '2026-03-16 13:25:27');

SET FOREIGN_KEY_CHECKS=1;
