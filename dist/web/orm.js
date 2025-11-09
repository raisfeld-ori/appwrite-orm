"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebORM = void 0;
const appwrite_1 = require("appwrite");
const types_1 = require("../shared/types");
const orm_instance_1 = require("./orm-instance");
class WebORM {
    constructor(config) {
        this.schemas = new Map();
        // Validate required configuration values
        (0, types_1.validateRequiredConfig)(config);
        this.config = config;
        this.client = new appwrite_1.Client()
            .setEndpoint(config.endpoint)
            .setProject(config.projectId);
        this.databases = new appwrite_1.Databases(this.client);
    }
    /**
     * Initialize the ORM with table definitions
     */
    init(tables) {
        // Store schemas for validation
        tables.forEach(table => {
            this.schemas.set(table.name, table.schema);
        });
        return new orm_instance_1.WebORMInstance(this.databases, this.config.databaseId, this.schemas);
    }
}
exports.WebORM = WebORM;
//# sourceMappingURL=orm.js.map