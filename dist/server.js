"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = __importDefault(require("./utils/db"));
const cloudinary_1 = require("cloudinary");
require("dotenv").config();
// cloudinary config
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.COULD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY
});
const PORT = process.env.PORT || 8080;
// Create server
app_1.app.listen(PORT, () => {
    console.log(`Server is running with port http://localhost:${PORT}`);
    (0, db_1.default)();
});
