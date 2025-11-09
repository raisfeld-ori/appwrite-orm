"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pm = void 0;
// Test file to verify imports work
const permission_manager_1 = require("./permission-manager");
// This should compile without errors
const pm = new permission_manager_1.PermissionManager();
exports.pm = pm;
console.log('Import test successful');
//# sourceMappingURL=test-import.js.map