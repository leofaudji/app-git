import { App } from "./app.js";
import { Router } from "./router.js";
import { Api, Toast } from "./api.js";

// Page modules
import { PageDashboard } from "./pages/dashboard.js";
import { PageProjects } from "./pages/projects.js";
import { PageGit } from "./pages/git.js";
import { PageLogs } from "./pages/logs.js";
import { PageWebhookLogs } from "./pages/webhook_logs.js";
import { PageUsers } from "./pages/users.js";
import { PageRoles } from "./pages/roles.js";
import { PageSettings } from "./pages/settings.js";
import { PageProfile } from "./pages/profile.js";

// Expose some objects globally for convenience in inline handlers (like onclick)
// or for debugging. Mobile sidebar helper needs Router.
window.RouterInstance = Router;
window.Api = Api;
window.Toast = Toast;
window.App = App;

// Expose Pages globally to fix ReferenceErrors in inline onclick handlers
window.PageDashboard = PageDashboard;
window.PageProjects = PageProjects;
window.PageGit = PageGit;
window.PageLogs = PageLogs;
window.PageWebhookLogs = PageWebhookLogs;
window.PageUsers = PageUsers;
window.PageRoles = PageRoles;
window.PageSettings = PageSettings;
window.PageProfile = PageProfile;

// Helper global function for inline onclicks
window.closeMobileSidebar = () => {
    if (window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
