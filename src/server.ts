import * as http from 'http';
import * as debug from 'debug';

require('dotenv').config();

import App from './app';

const port = normalizePort(process.env.PORT || 3000);
App.set('port', port);

const server = http.createServer(App);
server.listen(port);
server.on('listening', onListening);

function normalizePort(val: number | string): number | string | boolean {
	let port: number = typeof val === 'string' ? parseInt(val, 10) : val;
	if (isNaN(port)) return val;
	else if (port >= 0) return port;
	else return false;
}

function onListening(): void {
	let addr = server.address();
	let bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
	debug(`Listening on ${bind}`);
}
