"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcryptjs");
const moment = require("moment");
const jwt = require("jwt-simple");
const connection_1 = require("../db/connection");
class AuthHelpers {
    static comparePass(userPassword, databasePassword) {
        return bcrypt.compareSync(userPassword, databasePassword);
    }
    static createUser(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = bcrypt.genSaltSync();
            const hash = bcrypt.hashSync(req.body.password, salt);
            const email = req.body.email;
            const username = req.body.username;
            try {
                let user = yield (0, connection_1.default)('Users').where({ username: req.body.username }).first();
                if (user)
                    return Promise.reject({ status: 403, message: 'El usuario ya existe' });
                user = yield (0, connection_1.default)('Users').insert({ email, username, password: hash }, '*');
                return user;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    static changePassword(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const salt = bcrypt.genSaltSync();
            const hash = bcrypt.hashSync(req.body.password, salt);
            const username = req.body.username;
            try {
                let user = yield (0, connection_1.default)('Users').where({ username: req.body.username }).first();
                if (!user)
                    return Promise.reject({ status: 404, message: 'El usuario no existe' });
                user = yield (0, connection_1.default)('Users').update({ password: hash }).where({ username });
                return user;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    static loginRequired(req, res, next) {
        if (!req.user)
            return res.status(401).json({ status: 'Por favor inicie sesion' });
        return next();
    }
    static encodeToken(user) {
        const playload = {
            exp: moment().add(7, 'days').unix(),
            iat: moment().unix(),
            sub: user.id
        };
        return jwt.encode(playload, process.env.TOKEN_SECRET);
    }
    static decodeToken(token, callback) {
        let payload;
        try {
            payload = jwt.decode(token, process.env.TOKEN_SECRET);
        }
        catch (err) {
            return callback(err.message);
        }
        return callback(null, payload);
    }
    static ensureAuthenticated(req, res, next) {
        if (!(req.headers && req.headers.authorization)) {
            return res.status(401).json({
                status: 'Por favor inicie sesion',
                redirect: 'login'
            });
        }
        const header = req.headers.authorization.split(' ');
        const token = header[1];
        AuthHelpers.decodeToken(token, (err, payload) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                return res.status(401).json({
                    status: err,
                    redirect: 'login'
                });
            }
            else {
                try {
                    const user = yield (0, connection_1.default)('Users').where({ id: parseInt(payload.sub) }).first();
                    if (!user) {
                        res.status(401).json({
                            status: 'El usuario no existe',
                            redirect: 'login'
                        });
                        return;
                    }
                    req.user = user;
                    next();
                }
                catch (err) {
                    res.status(500).json({
                        status: `error: ${err}`
                    });
                }
            }
        }));
    }
    static ensureIsUser(req, res, next) {
        const user = req.user;
        if (user.rol === 'admin' || user.rol === 'user') {
            next();
        }
        else {
            res.status(403).json({
                status: 'El usuario no esta autorizado',
                redirect: 'login'
            });
            return;
        }
    }
}
exports.default = AuthHelpers;
//# sourceMappingURL=helpers.js.map