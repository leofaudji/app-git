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
        'id'    => 'dashboard',
        'label' => 'Dashboard',
        'icon'  => 'dashboard',
        'route' => '#dashboard',
        'perm'  => ['module' => 'dashboard', 'action' => 'view'],
    ],
    [
        'id'    => 'changelog',
        'label' => 'Changelog',
        'icon'  => 'logs',
        'route' => '#changelog',
        'perm'  => null, // accessible to everyone logged in
    ],
    [
        'id'    => 'projects',
        'label' => 'Manage Projects',
        'icon'  => 'git',
        'route' => '#projects',
        'perm'  => ['module' => 'projects', 'action' => 'view'],
    ],
    [
        'id'    => 'git',
        'label' => 'Git Operations',
        'icon'  => 'git',
        'children' => [
            [
                'id'    => 'git-status',
                'label' => 'Status & Branch',
                'route' => '#git-status',
                'perm'  => ['module' => 'git', 'action' => 'view'],
            ],
            [
                'id'    => 'git-pull',
                'label' => 'Pull Now',
                'route' => '#git-pull',
                'perm'  => ['module' => 'git', 'action' => 'pull'],
            ],
        ],
    ],
    [
        'id'    => 'logs',
        'label' => 'Deploy Logs',
        'icon'  => 'logs',
        'route' => '#logs',
        'perm'  => ['module' => 'logs', 'action' => 'view'],
    ],
    [
        'id'    => 'webhook-logs',
        'label' => 'Webhook Logs',
        'icon'  => '📬',
        'route' => '#webhook-logs',
        'perm'  => ['module' => 'webhook_logs', 'action' => 'view'],
    ],
    [
        'id'    => 'users',
        'label' => 'Users',
        'icon'  => 'users',
        'route' => '#users',
        'perm'  => ['module' => 'users', 'action' => 'view'],
    ],
    [
        'id'    => 'roles',
        'label' => 'Roles & Permissions',
        'icon'  => 'roles',
        'route' => '#roles',
        'perm'  => ['module' => 'roles', 'action' => 'view'],
    ],
    [
        'id'    => 'settings',
        'label' => 'Settings',
        'icon'  => 'settings',
        'route' => '#settings',
        'perm'  => ['module' => 'settings', 'action' => 'view'],
    ],
    [
        'id'    => 'profile',
        'label' => 'Profile',
        'icon'  => 'profile',
        'route' => '#profile',
        'perm'  => null, // always visible to any logged-in user
    ],
];

function filterMenu(array $items, array $userPerms): array {
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
            if (empty($item['children'])) continue;
        }
        unset($item['perm']);
        $result[] = $item;
    }
    return $result;
}

$menu = filterMenu($allMenus, $user['permissions']);

jsonSuccess($menu);
