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
exports.fileToDataUrl = fileToDataUrl;
var fs = require("fs/promises");
var crypto = require("crypto");
var mime_types_1 = require("mime-types");
var sharp = null;
try {
    sharp = (await Promise.resolve().then(function () { return require("sharp"); })).default;
}
catch (_a) {
    /* sharp opcional */
}
/**
 * Lê arquivo de imagem, opcionalmente reduz, e devolve dataURL + metadados
 */
function fileToDataUrl(filePath_1) {
    return __awaiter(this, arguments, void 0, function (filePath, _a) {
        var buf, hash, mimeType, output, fmt, pipeline, _b, base64, dataUrl;
        var _c = _a === void 0 ? {} : _a, _d = _c.maxWidth, maxWidth = _d === void 0 ? 1600 : _d, _e = _c.maxHeight, maxHeight = _e === void 0 ? 1600 : _e, _f = _c.quality, quality = _f === void 0 ? 82 : _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0: return [4 /*yield*/, fs.readFile(filePath)];
                case 1:
                    buf = _g.sent();
                    hash = crypto.createHash("sha256").update(buf).digest("hex");
                    mimeType = mime_types_1.default.lookup(filePath) || "application/octet-stream";
                    output = buf;
                    if (!(sharp && mimeType.startsWith("image/"))) return [3 /*break*/, 6];
                    fmt = mimeType === "image/png" ? "png" : "jpeg";
                    pipeline = sharp(buf)
                        .rotate()
                        .resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: true });
                    if (!(fmt === "png")) return [3 /*break*/, 3];
                    return [4 /*yield*/, pipeline.png({ compressionLevel: 9 }).toBuffer()];
                case 2:
                    _b = _g.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, pipeline.jpeg({ quality: quality, mozjpeg: true }).toBuffer()];
                case 4:
                    _b = _g.sent();
                    _g.label = 5;
                case 5:
                    output = _b;
                    mimeType = fmt === "png" ? "image/png" : "image/jpeg";
                    _g.label = 6;
                case 6:
                    base64 = output.toString("base64");
                    dataUrl = "data:".concat(mimeType, ";base64,").concat(base64);
                    return [2 /*return*/, { dataUrl: dataUrl, mimeType: mimeType, hash: hash, bytes: output.length }];
            }
        });
    });
}
