"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.PermissionManager = exports.AttributeManager = exports.Migration = exports.ServerTable = exports.ServerORMInstance = exports.ServerORM = void 0;
// Server package exports
var orm_1 = require("./orm");
Object.defineProperty(exports, "ServerORM", { enumerable: true, get: function () { return orm_1.ServerORM; } });
var orm_instance_1 = require("./orm-instance");
Object.defineProperty(exports, "ServerORMInstance", { enumerable: true, get: function () { return orm_instance_1.ServerORMInstance; } });
var table_1 = require("./table");
Object.defineProperty(exports, "ServerTable", { enumerable: true, get: function () { return table_1.ServerTable; } });
var migration_1 = require("./migration");
Object.defineProperty(exports, "Migration", { enumerable: true, get: function () { return migration_1.Migration; } });
var attribute_manager_1 = require("./attribute-manager");
Object.defineProperty(exports, "AttributeManager", { enumerable: true, get: function () { return attribute_manager_1.AttributeManager; } });
var permission_manager_1 = require("./permission-manager");
Object.defineProperty(exports, "PermissionManager", { enumerable: true, get: function () { return permission_manager_1.PermissionManager; } });
// Re-export Appwrite utilities and shared types
var appwrite_1 = require("appwrite");
Object.defineProperty(exports, "Query", { enumerable: true, get: function () { return appwrite_1.Query; } });
__exportStar(require("../shared/types"), exports);
__exportStar(require("../shared/table"), exports);
//# sourceMappingURL=index.js.map