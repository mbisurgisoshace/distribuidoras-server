"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const debug = require("debug");
require('dotenv').config();
const app_1 = require("./app");
const port = normalizePort(process.env.PORT || 3000);
app_1.default.set('port', port);
const server = http.createServer(app_1.default);
server.listen(port);
server.on('listening', onListening);
function normalizePort(val) {
    let port = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(port))
        return val;
    else if (port >= 0)
        return port;
    else
        return false;
}
function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
}
//# sourceMappingURL=server.js.map