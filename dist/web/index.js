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
exports.Query = exports.WebValidator = exports.WebTable = exports.WebORMInstance = exports.WebORM = void 0;
// Web package exports
var orm_1 = require("./orm");
Object.defineProperty(exports, "WebORM", { enumerable: true, get: function () { return orm_1.WebORM; } });
var orm_instance_1 = require("./orm-instance");
Object.defineProperty(exports, "WebORMInstance", { enumerable: true, get: function () { return orm_instance_1.WebORMInstance; } });
var table_1 = require("./table");
Object.defineProperty(exports, "WebTable", { enumerable: true, get: function () { return table_1.WebTable; } });
var validator_1 = require("./validator");
Object.defineProperty(exports, "WebValidator", { enumerable: true, get: function () { return validator_1.WebValidator; } });
// Re-export Appwrite utilities and shared types
var appwrite_1 = require("appwrite");
Object.defineProperty(exports, "Query", { enumerable: true, get: function () { return appwrite_1.Query; } });
__exportStar(require("../shared/types"), exports);
__exportStar(require("../shared/table"), exports);
//# sourceMappingURL=index.js.map