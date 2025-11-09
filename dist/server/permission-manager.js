"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionManager = void 0;
class PermissionManager {
    /**
     * Convert JSON role to Appwrite permissions array
     */
    convertRoleToPermissions(role) {
        const permissions = [];
        // Default public read if no specific permissions
        if (!role || Object.keys(role).length === 0) {
            return ['read("any")'];
        }
        // Convert role object to Appwrite permission strings
        for (const [action, value] of Object.entries(role)) {
            if (value === 'any' || value === 'public') {
                permissions.push(`${action}("any")`);
            }
            else if (typeof value === 'string') {
                permissions.push(`${action}("${value}")`);
            }
            else if (Array.isArray(value)) {
                value.forEach(v => permissions.push(`${action}("${v}")`));
            }
        }
        return permissions.length > 0 ? permissions : ['read("any")'];
    }
}
exports.PermissionManager = PermissionManager;
//# sourceMappingURL=permission-manager.js.map