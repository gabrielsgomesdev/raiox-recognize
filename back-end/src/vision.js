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
exports.describeImage = describeImage;
var openai_1 = require("openai");
var client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
/**
 * Retorna texto descrevendo a imagem.
 * Aceita dataURL (data:image/...;base64,XXX)
 */
function describeImage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var model, completion, msg;
        var _c, _d, _e, _f;
        var dataUrl = _b.dataUrl, _g = _b.prompt, prompt = _g === void 0 ? "Descreva objetivamente o que há na imagem, em uma frase clara e útil para um pré diagnóstico médico, detalhe as características das ou da lesão; Tenha em mente que estamos tratando apenas de tipos de câncer." : _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
                    return [4 /*yield*/, client.chat.completions.create({
                            model: model,
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: prompt },
                                        { type: "image_url", image_url: { url: dataUrl } },
                                    ],
                                },
                            ],
                            max_tokens: 300,
                        })];
                case 1:
                    completion = _h.sent();
                    msg = (_f = (_e = (_d = (_c = completion.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.content) === null || _f === void 0 ? void 0 : _f.trim();
                    return [2 /*return*/, msg || ""];
            }
        });
    });
}
