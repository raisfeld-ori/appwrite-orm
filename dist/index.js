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
exports.ClientWrapper = exports.DatabasesWrapper = exports.PermissionManager = exports.AttributeManager = exports.Migration = exports.ServerTable = exports.ServerORMInstance = exports.ServerORM = void 0;
// Main exports - users can import from root or specific modules
__exportStar(require("./shared/types"), exports);
__exportStar(require("./shared/table"), exports);
__exportStar(require("./web"), exports);
// Export server but exclude Query to avoid conflict
var server_1 = require("./server");
Object.defineProperty(exports, "ServerORM", { enumerable: true, get: function () { return server_1.ServerORM; } });
Object.defineProperty(exports, "ServerORMInstance", { enumerable: true, get: function () { return server_1.ServerORMInstance; } });
Object.defineProperty(exports, "ServerTable", { enumerable: true, get: function () { return server_1.ServerTable; } });
Object.defineProperty(exports, "Migration", { enumerable: true, get: function () { return server_1.Migration; } });
Object.defineProperty(exports, "AttributeManager", { enumerable: true, get: function () { return server_1.AttributeManager; } });
Object.defineProperty(exports, "PermissionManager", { enumerable: true, get: function () { return server_1.PermissionManager; } });
Object.defineProperty(exports, "DatabasesWrapper", { enumerable: true, get: function () { return server_1.DatabasesWrapper; } });
Object.defineProperty(exports, "ClientWrapper", { enumerable: true, get: function () { return server_1.ClientWrapper; } });
//# sourceMappingURL=index.js.map