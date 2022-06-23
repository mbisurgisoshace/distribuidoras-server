"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatKeys = exports.camelizeKeys = exports.camelize = void 0;
const _ = require("lodash");
const util_1 = require("util");
exports.camelize = (str) => {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/\s+/g, '_').replace(/\/+/g, '_').toLowerCase();
};
exports.camelizeKeys = (object) => {
    if (util_1.isArray(object)) {
        let result = [];
        object.forEach(o => {
            let newObject = {};
            _.map(o, (value, key) => {
                newObject[exports.camelize(key)] = value;
            });
            result.push(newObject);
        });
        return result;
    }
    else {
        let result = {};
        _.map(object, (value, key) => {
            result[exports.camelize(key)] = value;
        });
        return result;
    }
};
exports.formatKeys = (object, removedKey = '') => {
    if (util_1.isArray(object)) {
        let result = [];
        object.forEach(o => {
            let newObject = {};
            _.map(o, (value, key) => {
                if (key !== removedKey) {
                    const newKey = key.replace(/_/g, '');
                    newObject[newKey] = value;
                }
            });
            result.push(newObject);
        });
        return result;
    }
    else {
        let result = {};
        _.map(object, (value, key) => {
            if (key !== removedKey) {
                const newKey = key.replace(/_/g, '');
                result[newKey] = value;
            }
        });
        return result;
    }
};
//# sourceMappingURL=utils.js.map