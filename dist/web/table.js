"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebTable = void 0;
const table_1 = require("../shared/table");
const validator_1 = require("./validator");
class WebTable extends table_1.BaseTable {
    constructor(databases, databaseId, collectionId, schema) {
        super(databases, databaseId, collectionId, schema);
    }
    /**
     * Override validation to use WebValidator
     */
    validateData(data, requireAll = false) {
        validator_1.WebValidator.validateAndThrow(data, this.schema, requireAll);
    }
}
exports.WebTable = WebTable;
//# sourceMappingURL=table.js.map