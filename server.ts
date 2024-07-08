import { app } from "./app";
import connectDB from "./utils/db";
import {v2 as cloudinary} from "cloudinary"
require("dotenv").config();

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.COULD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY
})

const PORT = process.env.PORT || 8080;

// Create server
app.listen(PORT, () => {
  console.log(`Server is running with port http://localhost:${PORT}`);
  connectDB();
});
