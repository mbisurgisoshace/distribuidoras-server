"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../db/connection");
class AuditoriaService {
}
AuditoriaService.log = (tabla, id_tabla, object, accion, usuario) => __awaiter(this, void 0, void 0, function* () {
    const log = yield connection_1.default('Auditoria').insert({ tabla, id_tabla, object, accion, usuario }, '*');
    return log;
});
exports.default = AuditoriaService;
//# sourceMappingURL=AuditoriaService.js.map