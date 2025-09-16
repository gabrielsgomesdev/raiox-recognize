"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var chokidar_1 = require("chokidar");
var path = require("path");
var axios_1 = require("axios");
var fs = require("fs/promises");
var form_data_1 = require("form-data");
var fsSync = require("fs");
var util_js_1 = require("./util.js");
var vision_js_1 = require("./vision.js");
var db_js_1 = require("./db.js");
var embeddins_js_1 = require("./embeddins.js");
var WATCH_DIR = process.env.WATCH_DIR || "./imagens-inbox";
var N8N_URL = process.env.N8N_WEBHOOK_URL;
var SECRET = process.env.N8N_SHARED_SECRET || "";
var PROCESSED_DIR = path.join(WATCH_DIR, "..", "imagens-processadas");
await fs.mkdir(PROCESSED_DIR, { recursive: true });
var validExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
console.log("\uD83D\uDC40 Monitorando: ".concat(WATCH_DIR));
chokidar_1.default.watch(WATCH_DIR, { ignoreInitial: true, depth: 0 }).on("add", function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var ext, fileName, _a, dataUrl, mimeType, hash, bytes, text, embedding, error, form, headers, resp, dest, err_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                ext = path.extname(filePath).toLowerCase();
                if (!validExt.has(ext))
                    return [2 /*return*/];
                fileName = path.basename(filePath);
                console.log("\uD83D\uDCF8 Nova imagem: ".concat(fileName));
                _c.label = 1;
            case 1:
                _c.trys.push([1, 8, , 9]);
                return [4 /*yield*/, (0, util_js_1.fileToDataUrl)(filePath)];
            case 2:
                _a = _c.sent(), dataUrl = _a.dataUrl, mimeType = _a.mimeType, hash = _a.hash, bytes = _a.bytes;
                return [4 /*yield*/, (0, vision_js_1.describeImage)({
                        dataUrl: dataUrl,
                        prompt: "Descreva objetivamente o que há na imagem, em uma frase clara e útil para um pré diagnóstico médico, detalhe as características das ou da lesão; Tenha em mente que estamos tratando apenas de tipos de câncer. (pt-BR).",
                    })];
            case 3:
                text = _c.sent();
                return [4 /*yield*/, (0, embeddins_js_1.embedImageDescription)(text)];
            case 4:
                embedding = _c.sent();
                return [4 /*yield*/, db_js_1.supabase.from("imagens").insert({
                        file_name: fileName,
                        description: text,
                        sha256: hash,
                        embedding: embedding,
                    })];
            case 5:
                error = (_c.sent()).error;
                if (error)
                    console.error("❌ Erro supabase:", error);
                form = new form_data_1.default();
                form.append("data", fsSync.createReadStream(filePath), fileName); // envia o arquivo real
                form.append("analyzed", JSON.stringify(text)); // ⚠ envia todos os dados para o chat
                form.append("description", text);
                form.append("sha256", hash);
                form.append("receivedAt", new Date().toISOString());
                headers = __assign({}, form.getHeaders());
                if (SECRET)
                    headers["X-Shared-Secret"] = SECRET;
                return [4 /*yield*/, axios_1.default.post(N8N_URL, form, { headers: headers, timeout: 30000 })];
            case 6:
                resp = _c.sent();
                console.log("\u2705 n8n respondeu:", resp.status, resp.data);
                dest = path.join(PROCESSED_DIR, fileName);
                return [4 /*yield*/, fs.rename(filePath, dest)];
            case 7:
                _c.sent();
                return [3 /*break*/, 9];
            case 8:
                err_1 = _c.sent();
                console.error("❌ Erro ao processar:", ((_b = err_1 === null || err_1 === void 0 ? void 0 : err_1.response) === null || _b === void 0 ? void 0 : _b.data) || err_1.message);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
