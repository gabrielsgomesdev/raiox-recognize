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
var fs_1 = require("fs");
var path_1 = require("path");
var csv_parser_1 = require("csv-parser");
var db_js_1 = require("./db.js");
var embeddins_js_1 = require("./embeddins.js");
var IMAGES_DIR = path_1.default.join(process.cwd(), "images"); // pasta local das imagens
var CSV_FILE = path_1.default.join(process.cwd(), "metadata.csv");
function uploadImagem(filePath, fileName) {
    return __awaiter(this, void 0, void 0, function () {
        var fileBuffer, uploadError, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fileBuffer = fs_1.default.readFileSync(filePath);
                    return [4 /*yield*/, db_js_1.supabase.storage
                            .from("lesoes")
                            .upload(fileName, fileBuffer, { upsert: true })];
                case 1:
                    uploadError = (_a.sent()).error;
                    if (uploadError)
                        throw uploadError;
                    data = db_js_1.supabase.storage.from("lesoes").getPublicUrl(fileName).data;
                    if (!(data === null || data === void 0 ? void 0 : data.publicUrl))
                        throw new Error("Não foi possível obter publicUrl");
                    return [2 /*return*/, data.publicUrl];
            }
        });
    });
}
function popular() {
    return __awaiter(this, void 0, void 0, function () {
        var results;
        var _this = this;
        return __generator(this, function (_a) {
            results = [];
            fs_1.default.createReadStream(CSV_FILE)
                .pipe((0, csv_parser_1.default)())
                .on("data", function (row) { return results.push(row); })
                .on("end", function () { return __awaiter(_this, void 0, void 0, function () {
                var _i, results_1, row, fileName, tipo, descricao, benigno, filePath, url, embedding, error, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("\uD83D\uDCCA Total de registros no CSV: ".concat(results.length));
                            _i = 0, results_1 = results;
                            _a.label = 1;
                        case 1:
                            if (!(_i < results_1.length)) return [3 /*break*/, 8];
                            row = results_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 6, , 7]);
                            fileName = row.filename;
                            tipo = row.diagnosis;
                            descricao = row.description || tipo;
                            benigno = row.benign === "true" || row.benign === "1";
                            filePath = path_1.default.join(IMAGES_DIR, fileName);
                            if (!fs_1.default.existsSync(filePath)) {
                                console.warn("\u26A0 Imagem n\u00E3o encontrada: ".concat(fileName));
                                return [3 /*break*/, 7];
                            }
                            return [4 /*yield*/, uploadImagem(filePath, fileName)];
                        case 3:
                            url = _a.sent();
                            return [4 /*yield*/, (0, embeddins_js_1.embedImageDescription)("".concat(tipo, " - ").concat(descricao))];
                        case 4:
                            embedding = _a.sent();
                            return [4 /*yield*/, db_js_1.supabase.from("lesoes").insert({
                                    nome_arquivo: fileName,
                                    url: url,
                                    tipo: tipo,
                                    benigno: benigno,
                                    descricao: descricao,
                                    embedding: embedding,
                                })];
                        case 5:
                            error = (_a.sent()).error;
                            if (error)
                                console.error("\u274C Erro ao inserir ".concat(fileName, ":"), error);
                            else
                                console.log("\u2705 Inserido: ".concat(fileName));
                            return [3 /*break*/, 7];
                        case 6:
                            err_1 = _a.sent();
                            console.error("❌ Erro geral:", err_1);
                            return [3 /*break*/, 7];
                        case 7:
                            _i++;
                            return [3 /*break*/, 1];
                        case 8:
                            console.log("🎯 Importação finalizada!");
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
popular().catch(console.error);
