"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
// db.ts
var supabase_js_1 = require("@supabase/supabase-js");
require("dotenv/config");
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_KEY;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
