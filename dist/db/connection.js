"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex = require("knex");
const config = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'local';
exports.default = knex(config[environment]);
function knexForEnv(env) {
    return knex(config[env]);
}
exports.knexForEnv = knexForEnv;
//# sourceMappingURL=connection.js.map