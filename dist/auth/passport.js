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
const passport = require("passport");
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const connection_1 = require("../db/connection");
const helpers_1 = require("./helpers");
let opts = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderWithScheme('JWT'),
    secretOrKey: process.env.TOKEN_SECRET
};
passport.use(new passport_jwt_1.Strategy(opts, (jwt_payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield connection_1.default('Users').where({ username: jwt_payload.username }).first();
        if (!user)
            return done(null, false, 'El usuario no existe');
        if (!helpers_1.default.comparePass(jwt_payload.password, user.password)) {
            return done(null, false, 'Contrasena incorrecta');
        }
        else {
            return done(null, user);
        }
    }
    catch (err) {
        return done(err);
    }
})));
passport.use(new passport_local_1.Strategy(opts, (username, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield connection_1.default('Users').where({ username }).first();
        if (!user)
            return done(null, false, 'El usuario no existe');
        if (!helpers_1.default.comparePass(password, user.password)) {
            return done(null, false, 'Contrasena incorrecta');
        }
        else {
            user.token = helpers_1.default.encodeToken(user);
            return done(null, user);
        }
    }
    catch (err) {
        return done(err);
    }
})));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield connection_1.default('Users').where({ id }).first();
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
}));
module.exports = passport;
//# sourceMappingURL=passport.js.map