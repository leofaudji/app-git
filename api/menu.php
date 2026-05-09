<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';

header('Content-Type: application/json');

$user = requireLogin();

// Full menu structure with permission guards
$allMenus = [
    [
        'id' => 'dashboard',
        'label' => 'Dashboard',
        'icon' => 'dashboard',
        'route' => '#dashboard',
        'perm' => ['module' => 'dashboard', 'action' => 'view'],
    ],
    [
        'id' => 'projects',
        'label' => 'Manage Projects',
        'icon' => 'projects',
        'route' => '#projects',
        'perm' => ['module' => 'projects', 'action' => 'view'],
    ],
    // --- Monitoring Group ---
    [
        'id' => 'monitoring',
        'label' => 'Observability',
        'icon' => 'audit',
        'perm' => ['module' => 'logs', 'action' => 'view'],
        'children' => [
            [
                'id' => 'logs',
                'label' => 'Deploy Logs',
                'icon' => 'logs',
                'route' => '#logs',
                'perm' => ['module' => 'logs', 'action' => 'view'],
            ],
            [
                'id' => 'webhook-logs',
                'label' => 'Webhook Logs',
                'icon' => 'webhook',
                'route' => '#webhook-logs',
                'perm' => ['module' => 'webhook_logs', 'action' => 'view'],
            ],
            [
                'id' => 'audit-logs',
                'label' => 'Audit Logs',
                'icon' => 'audit',
                'route' => '#audit-logs',
                'perm' => ['module' => 'audit', 'action' => 'view'],
            ],
        ]
    ],
    // --- Infrastructure Group ---
    [
        'id' => 'infrastructure',
        'label' => 'Infrastructure',
        'icon' => 'redis',
        'perm' => ['module' => 'settings', 'action' => 'view'],
        'children' => [
            [
                'id' => 'redis',
                'label' => 'Redis Dashboard',
                'icon' => 'redis',
                'route' => '#redis',
                'perm' => ['module' => 'settings', 'action' => 'view'],
            ],
            [
                'id' => 'env-manager',
                'label' => 'Env Manager',
                'icon' => 'env',
                'route' => '#env-manager',
                'perm' => ['module' => 'settings', 'action' => 'edit'],
            ],
            [
                'id' => 'backup',
                'label' => 'Database Backup',
                'icon' => 'backup',
                'route' => '#backup',
                'perm' => ['module' => 'settings', 'action' => 'edit'],
            ],
            [
                'id' => 'cloud-storage',
                'label' => 'Cloud Backups',
                'icon' => 'cloud',
                'route' => '#cloud-storage',
                'perm' => ['module' => 'settings', 'action' => 'view'],
            ],
        ]
    ],
    // --- Access Control ---
    [
        'id' => 'identity',
        'label' => 'Identity & Access',
        'icon' => 'users',
        'perm' => ['module' => 'users', 'action' => 'view'],
        'children' => [
            [
                'id' => 'users',
                'label' => 'Users',
                'icon' => 'users',
                'route' => '#users',
                'perm' => ['module' => 'users', 'action' => 'view'],
            ],
            [
                'id' => 'roles',
                'label' => 'Roles & Permissions',
                'icon' => 'roles',
                'route' => '#roles',
                'perm' => ['module' => 'roles', 'action' => 'view'],
            ],
        ]
    ],
    // --- Bottom/Settings ---
    [
        'id' => 'settings_group',
        'label' => 'System Settings',
        'icon' => 'settings',
        'perm' => null,
        'children' => [
            [
                'id' => 'settings',
                'label' => 'Global Settings',
                'icon' => 'settings',
                'route' => '#settings',
                'perm' => ['module' => 'settings', 'action' => 'view'],
            ],
            [
                'id' => 'changelog',
                'label' => 'System Updates',
                'icon' => 'changelog',
                'route' => '#changelog',
                'perm' => null,
            ],
            [
                'id' => 'profile',
                'label' => 'My Profile',
                'icon' => 'profile',
                'route' => '#profile',
                'perm' => null,
            ],
        ]
    ],
];

function filterMenu(array $items, array $userPerms): array
{
    $result = [];
    foreach ($items as $item) {
        // Check permission
        if (array_key_exists('perm', $item) && $item['perm'] !== null) {
            $mod = $item['perm']['module'];
            $act = $item['perm']['action'];
            if (!isset($userPerms[$mod]) || !in_array($act, $userPerms[$mod])) {
                continue;
            }
        }
        // Filter children
        if (!empty($item['children'])) {
            $item['children'] = filterMenu($item['children'], $userPerms);
            if (empty($item['children']))
                continue;
        }
        unset($item['perm']);
        $result[] = $item;
    }
    return $result;
}

$menu = filterMenu($allMenus, $user['permissions']);

jsonSuccess($menu);
