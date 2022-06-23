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
const express = require("express");
const R = require("ramda");
const helpers_1 = require("../auth/helpers");
const router = express.Router();
const passport = require('../auth/passport');
router.post('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            handleResponse(res, 500, { error: err });
        }
        if (!user) {
            handleResponse(res, 401, { error: info });
        }
        if (user) {
            const userObj = R.omit(['password', 'token'], user);
            res.status(200).json({
                status: 'success',
                user: userObj,
                token: user.token
            });
        }
    })(req, res, next);
}));
router.post('/signup', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield helpers_1.default.createUser(req);
        const token = helpers_1.default.encodeToken(user[0]);
        passport.authenticate('local', (err, user, info) => {
            if (user) {
                const userObj = R.omit(['password', 'token'], user);
                res.status(200).json({
                    status: 'success',
                    user: userObj,
                    token: token
                });
            }
        })(req, res, next);
    }
    catch (err) {
        handleResponse(res, err.status || 500, { error: err.message || err });
    }
}));
router.put('/change-password', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield helpers_1.default.changePassword(req);
        const userObj = R.omit(['password', 'token'], user);
        res.status(200).json({
            status: 'success',
            user: userObj,
        });
    }
    catch (err) {
        handleResponse(res, err.status || 500, { error: err.message || err });
    }
}));
function handleResponse(res, code, statusMsg) {
    res.status(code).json(statusMsg);
}
exports.default = router;
//# sourceMappingURL=auth.js.map