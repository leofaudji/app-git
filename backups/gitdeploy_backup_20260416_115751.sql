-- Database Backup
-- Generated: 2026-04-16 11:57:51
-- DB: Main Database
-- --------------------------------------------------------

SET FOREIGN_KEY_CHECKS=0;

-- Table: `audit_logs`
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int unsigned DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` VALUES 
('1', '1', 'update', 'projects', '1', 'Updated project: app-koperasis', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-17 13:49:59'),
('2', '1', 'update', 'projects', '1', 'Updated project: KSP SMKN 5 Malang', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-17 13:50:16'),
('3', '1', 'update', 'projects', '3', 'Updated project: Perum Puri Nirwana Pandanwangi', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-17 13:50:51'),
('4', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-17 14:50:23'),
('5', '1', 'check', 'security', '3', 'Security audit performed for Perum Puri Nirwana Pandanwangi. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-17 14:50:29'),
('6', '1', 'check', 'security', '3', 'Security audit performed for Perum Puri Nirwana Pandanwangi. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-17 15:00:35'),
('7', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-19 20:41:21'),
('8', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-19 20:41:25'),
('9', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-19 20:57:42'),
('10', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-19 20:59:49'),
('11', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-19 21:00:30'),
('12', '1', 'check', 'security', '3', 'Security audit performed for Perum Puri Nirwana Pandanwangi. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-19 21:03:47'),
('13', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-20 08:21:29'),
('14', '1', 'create', 'projects', '4', 'Created new project: app-git', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-20 08:26:26'),
('15', '1', 'create', 'projects', '5', 'Created new project: app-hris', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-20 08:26:39'),
('16', '1', 'create', 'projects', '6', 'Created new project: app-skoring', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-20 08:26:50'),
('17', '1', 'create', 'projects', '7', 'Created new project: crudworks', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-20 08:27:05'),
('18', '1', 'create', 'projects', '8', 'Created new project: smkn5-toko', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-20 08:27:17'),
('19', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 21:09:15'),
('20', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-26 21:23:28'),
('21', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:01:54'),
('22', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:31:42'),
('23', '1', 'pull_failed', 'git', '4', 'Git pull failed on branch main (commit 6c42ad8)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:49:05'),
('24', '1', 'pull_failed', 'git', '3', 'Git pull failed on branch main (commit 76e945f)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:49:50'),
('25', '1', 'pull_success', 'git', '6', 'Git pull success on branch main (commit 6c45088)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:50:02'),
('26', '1', 'pull_failed', 'git', '8', 'Git pull failed on branch main (commit 7d20c80)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:51:17'),
('27', '1', 'pull_success', 'git', '5', 'Git pull success on branch main (commit 98ddab3)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:51:30'),
('28', '1', 'pull_success', 'git', '5', 'Git pull success on branch main (commit 98ddab3)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 15:53:29'),
('29', '1', 'check', 'security', '1', 'Security audit performed for KSP SMKN 5 Malang. Score: 100', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '2026-03-27 16:12:13'),
('30', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-03-31 17:01:10'),
('31', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:09:53'),
('32', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:09:58'),
('33', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:21:49'),
('34', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:21:56'),
('35', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:24:05'),
('36', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:24:12'),
('37', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:25:00'),
('38', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:25:12'),
('39', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:25:20'),
('40', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:25:48'),
('41', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:26:32'),
('42', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:26:39'),
('43', '1', 'logout', 'auth', '1', 'User admin logged out', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:26:43'),
('44', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 00:26:51'),
('45', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '2026-04-01 23:38:48'),
('46', '1', 'login', 'auth', '1', 'User admin logged in', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-16 11:37:18');

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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
('19', '3', 'manual', '1', 'main', '76e945f', 'failed', 'From https://github.com/leofaudji/pnp-digital\n * branch            main       -> FETCH_HEAD\nerror: Your local changes to the following files would be overwritten by merge:\n	.gitignore\n	.htaccess\n	config/database.php\nPlease commit your changes or stash them before you merge.\nUpdating 76e945f..41c964c\nAborting', '::1', '2026-03-16 14:58:28'),
('20', '4', 'manual', '1', 'main', '6c42ad8', 'failed', 'From https://github.com/leofaudji/app-git\n * branch            main       -> FETCH_HEAD\n   6c42ad8..3c67d61  main       -> origin/main\nerror: Your local changes to the following files would be overwritten by merge:\n	api/auth.php\n	api/backup.php\n	api/dashboard.php\n	api/debug.php\n	api/git.php\n	api/menu.php\n	api/projects.php\n	assets/css/app.css\n	assets/js/app.js\n	assets/js/main.js\n	assets/js/pages/changelog.js\n	assets/js/pages/dashboard.js\n	assets/js/pages/git.js\n	assets/js/pages/logs.js\n	assets/js/pages/profile.js\n	assets/js/pages/projects.js\n	assets/js/pages/roles.js\n	assets/js/pages/settings.js\n	assets/js/pages/users.js\n	assets/js/pages/webhook_logs.js\n	changelog.md\n	index.php\n	schema.sql\nPlease commit your changes or stash them before you merge.\nerror: The following untracked working tree files would be overwritten by merge:\n	.env.test_probe\n	api/analytics.php\n	api/audit_logs.php\n	api/cron_health.php\n	api/env.php\n	api/health.php\n	api/migrate_app_url.php\n	api/migrate_drift.php\n	api/migrate_health.php\n	api/migrate_security.php\n	api/monitoring.php\n	api/resources.php\n	api/security.php\n	assets/js/pages/audit_logs.js\n	assets/js/pages/backup.js\n	assets/js/pages/envmanager.js\n	backups/gitdeploy_backup_20260319_134807.sql\n	debug_perms.php\n	drift_test.txt\n	includes/AuditLog.php\n	includes/HealthCheck.php\nPlease move or remove them before you merge.\nUpdating 6c42ad8..3c67d61\nAborting', '::1', '2026-03-27 15:49:04'),
('21', '3', 'manual', '1', 'main', '76e945f', 'failed', 'From https://github.com/leofaudji/pnp-digital\n * branch            main       -> FETCH_HEAD\n   41c964c..44bfc37  main       -> origin/main\nerror: Your local changes to the following files would be overwritten by merge:\n	.gitignore\n	.htaccess\n	config/database.php\nPlease commit your changes or stash them before you merge.\nUpdating 76e945f..44bfc37\nAborting', '::1', '2026-03-27 15:49:48'),
('22', '6', 'manual', '1', 'main', '6c45088', 'success', 'From https://github.com/leofaudji/app-skoring\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-27 15:50:01'),
('23', '8', 'manual', '1', 'main', '7d20c80', 'failed', 'From https://github.com/leofaudji/smkn5-toko\n * branch            main       -> FETCH_HEAD\n   2128ebe..8a67723  main       -> origin/main\nerror: Your local changes to the following files would be overwritten by merge:\n	pages/buku_panduan.php\n	storage/rate_limit/837ec5754f503cfaaee0929fd48974e7.json\nPlease commit your changes or stash them before you merge.\nUpdating 7d20c80..8a67723\nAborting', '::1', '2026-03-27 15:51:15'),
('24', '5', 'manual', '1', 'main', '98ddab3', 'success', 'From https://github.com/leofaudji/app-hris_v2\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-27 15:51:29'),
('25', '5', 'manual', '1', 'main', '98ddab3', 'success', 'From https://github.com/leofaudji/app-hris_v2\n * branch            main       -> FETCH_HEAD\nAlready up to date.', '::1', '2026-03-27 15:53:28');

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

-- Table: `project_changelogs`
DROP TABLE IF EXISTS `project_changelogs`;
CREATE TABLE `project_changelogs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `project_id` int unsigned NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changelog` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `project_changelogs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_changelogs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: `project_health`
DROP TABLE IF EXISTS `project_health`;
CREATE TABLE `project_health` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int unsigned NOT NULL,
  `status` enum('up','down') NOT NULL,
  `response_code` int DEFAULT NULL,
  `response_time` float DEFAULT NULL,
  `error_message` text,
  `checked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_health_project` (`project_id`,`checked_at` DESC),
  CONSTRAINT `fk_health_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `project_health` VALUES 
('1', '1', 'up', '200', '1.1254', NULL, '2026-03-17 14:04:48'),
('2', '3', 'up', '200', '1.0755', NULL, '2026-03-17 14:04:49'),
('3', '1', 'up', '200', '1.1618', NULL, '2026-03-17 14:11:08'),
('4', '3', 'up', '200', '0.7284', NULL, '2026-03-17 14:11:11'),
('5', '3', 'up', '200', '0.914', NULL, '2026-03-17 14:22:31'),
('6', '1', 'up', '200', '1.0326', NULL, '2026-03-17 14:22:33'),
('7', '1', 'up', '200', '1.7099', NULL, '2026-03-17 14:30:21'),
('8', '1', 'up', '200', '0.5292', NULL, '2026-03-17 14:30:53'),
('9', '3', 'up', '200', '1.7648', NULL, '2026-03-17 14:39:38'),
('10', '1', 'up', '200', '1.1578', NULL, '2026-03-19 20:41:32'),
('11', '3', 'up', '200', '1.8703', NULL, '2026-03-19 20:41:38');

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` VALUES 
('1', 'KSP SMKN 5 Malang', 'leofaudji/app-koperasi', 'app-koperasi', 'main', 'https://smkn5-ksp.crudworks.web.id', '0', '100', '{\"sensitive_files\":[{\"file\":\".env\",\"description\":\"Environment configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/.env\",\"code\":502},{\"file\":\".git\\/config\",\"description\":\"Git configuration directory\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/.git\\/config\",\"code\":502},{\"file\":\"config.php.bak\",\"description\":\"Backup of configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/config.php.bak\",\"code\":200},{\"file\":\"composer.lock\",\"description\":\"Dependency lock file (information disclosure)\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/composer.lock\",\"code\":200},{\"file\":\"phpinfo.php\",\"description\":\"PHP Information file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/smkn5-ksp.crudworks.web.id\\/phpinfo.php\",\"code\":200}],\"php_info\":\"Not detected (Secure)\",\"headers\":{\"date\":\"Fri, 27 Mar 2026 09:12:12 GMT\",\"content-type\":\"text\\/html; charset=UTF-8\",\"vary\":\"Accept-Encoding\",\"x-content-type-options\":\"nosniff\",\"server\":\"cloudflare\",\"strict-transport-security\":\"max-age=63072000; includeSubDomains; preload\",\"x-dynamic-cache\":\"MISS\",\"alt-svc\":\"h3=\\\":443\\\"; ma=86400\",\"report-to\":\"{\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800,\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=xWA9B8YZqpTH9qYs6dED041loUx9mJ%2FVlX9ATZe520jTJWljPc1QlojBWloxt%2FR9%2BiRb1iSi1C%2BCegtHBRT8lKoXwkx5CKtJZfCi5cRAOGdd1OHjZiT50vXchNRINpM6vNI2YwCbRiDjBV7qsQ%3D%3D\\\"}]}\",\"cf-cache-status\":\"DYNAMIC\",\"nel\":\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"success_fraction\\\":0.0,\\\"max_age\\\":604800}\",\"cf-ray\":\"9e2d45a46976aa1c-SIN\"},\"score\":100,\"php_status\":\"Secure\",\"missing_headers\":[\"Content-Security-Policy\",\"X-Frame-Options\",\"X-Content-Type-Options\",\"Strict-Transport-Security\"]}', '2026-03-27 16:12:13', '2026-03-19 20:41:21', '1.0.1', '', '', '1', '2026-03-16 13:18:16', '2026-03-27 16:12:13'),
('3', 'Perum Puri Nirwana Pandanwangi', 'leofaudji/pnp-digital', 'app-rt', 'main', 'https://pnp.crudworks.web.id', '1', '100', '{\"sensitive_files\":[{\"file\":\".env\",\"description\":\"Environment configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/.env\",\"code\":502},{\"file\":\".git\\/config\",\"description\":\"Git configuration directory\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/.git\\/config\",\"code\":502},{\"file\":\"config.php.bak\",\"description\":\"Backup of configuration file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/config.php.bak\",\"code\":404},{\"file\":\"composer.lock\",\"description\":\"Dependency lock file (information disclosure)\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/composer.lock\",\"code\":404},{\"file\":\"phpinfo.php\",\"description\":\"PHP Information file\",\"status\":\"Secure\",\"url\":\"https:\\/\\/pnp.crudworks.web.id\\/phpinfo.php\",\"code\":404}],\"php_info\":\"Not detected (Secure)\",\"headers\":{\"date\":\"Thu, 19 Mar 2026 14:03:47 GMT\",\"content-type\":\"text\\/html; charset=UTF-8\",\"vary\":\"Accept-Encoding\",\"expires\":\"Thu, 19 Nov 1981 08:52:00 GMT\",\"cache-control\":\"no-store, no-cache, must-revalidate\",\"pragma\":\"no-cache\",\"set-cookie\":\"PHPSESSID=og093535422ufvafbe2hrdiuue; path=\\/; SameSite=Lax\",\"server\":\"cloudflare\",\"strict-transport-security\":\"max-age=63072000; includeSubDomains; preload\",\"x-dynamic-cache\":\"MISS\",\"alt-svc\":\"h3=\\\":443\\\"; ma=86400\",\"report-to\":\"{\\\"group\\\":\\\"cf-nel\\\",\\\"max_age\\\":604800,\\\"endpoints\\\":[{\\\"url\\\":\\\"https:\\/\\/a.nel.cloudflare.com\\/report\\/v4?s=Ifq0YwIeux0HqacJFvZfixjxTYHETL6HU8ERQ9O0lrI%2BhaxysvGitvmOYfyOW0C8RXg6079sSb2QWW5Nk7ZsICNWXPC%2BlPUgP70a%2Fuehb4HRuVGCAanLQosQcA1UjPex\\\"}]}\",\"cf-cache-status\":\"DYNAMIC\",\"nel\":\"{\\\"report_to\\\":\\\"cf-nel\\\",\\\"success_fraction\\\":0.0,\\\"max_age\\\":604800}\",\"cf-ray\":\"9ded05c81d128213-SIN\"},\"score\":100,\"php_status\":\"Secure\",\"missing_headers\":[\"Content-Security-Policy\",\"X-Frame-Options\",\"X-Content-Type-Options\",\"Strict-Transport-Security\"]}', '2026-03-19 21:03:47', '2026-03-19 21:03:41', '1.0.1', '', '', '1', '2026-03-16 13:44:47', '2026-03-19 21:03:47'),
('4', 'app-git', 'leofaudji/app-git', 'app-git', 'main', '', '0', NULL, NULL, NULL, NULL, '1.0.0', '', '', '1', '2026-03-20 08:26:26', '2026-03-20 08:26:26'),
('5', 'app-hris', 'leofaudji/app-hris', 'app-hris', 'main', '', '0', NULL, NULL, NULL, NULL, '1.0.0', '', '', '1', '2026-03-20 08:26:39', '2026-03-20 08:26:39'),
('6', 'app-skoring', 'leofaudji/app-skoring', 'app-skoring', 'main', '', '0', NULL, NULL, NULL, NULL, '1.0.0', '', '', '1', '2026-03-20 08:26:50', '2026-03-20 08:26:50'),
('7', 'crudworks', 'leofaudji/web-crudworks', 'crudworks', 'main', '', '0', NULL, NULL, NULL, NULL, '1.0.0', '', '', '1', '2026-03-20 08:27:05', '2026-03-20 08:27:05'),
('8', 'smkn5-toko', 'leofaudji/smkn5-toko', 'smkn5-toko', 'main', '', '0', NULL, NULL, NULL, NULL, '1.0.0', '', '', '1', '2026-03-20 08:27:17', '2026-03-20 08:27:17');

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
('backup_auto_enable', '0', 'Enable Automatic Backups', 'boolean', '2026-04-01 23:46:35'),
('backup_base_dir', 'D:\\laragon\\backups\\gitdeploy', 'Global Backups Directory (absolute path)', 'text', '2026-04-01 23:32:28'),
('backup_cron_secret', '123456', 'Cron Secret Token', 'password', '2026-04-16 11:44:14'),
('backup_last_run', '', 'Last Auto Backup Run', 'text', '2026-04-01 23:46:35'),
('backup_schedule_days', 'Sun', 'Backup Schedule Days (Comma-separated)', 'text', '2026-04-16 11:44:14'),
('backup_schedule_time', '02:00', 'Backup Schedule Time (HH:mm)', 'text', '2026-04-01 23:46:35'),
('git_base_dir', 'D:\\laragon\\www\\testing-git', 'Global Projects Base Directory', 'text', '2026-03-16 13:12:08'),
('git_branch', 'main', 'Default Branch to Pull', 'text', '2026-03-16 11:27:37'),
('notify_email', 'leofaudji@gmail.com', 'Notification Email', 'text', '2026-03-16 11:51:22'),
('webhook_secret_default', '1234567890abcdefgh', 'Default Webhook Secret', 'password', '2026-03-16 13:25:27');

-- Table: `user_roles`
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `user_id` int unsigned NOT NULL,
  `role_id` int unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_roles` VALUES 
('1', '1'),
('2', '2');

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
('1', 'admin', 'admin@gitdeploy.local', '$2y$10$q9RPibI/0wUxHoc/uZXiqObypS2MgHc2a3.Xl0wFzzi.sNr9hVLCu', 'Administrator', NULL, '1', '2026-04-16 11:37:18', '2026-03-16 11:28:00', '2026-04-16 11:37:18'),
('2', 'developer', 'dev@gitdeploy.local', '$2y$10$yV0xlUF1TmG2ZqP3h3GBNecW12YyihX8Bg6RRuXCQtTiVfTvCmTdi', 'Developer User', NULL, '1', NULL, '2026-03-16 11:28:00', '2026-03-16 11:28:00');

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

SET FOREIGN_KEY_CHECKS=1;
