import { app } from "./app";
import connectDB from "./utils/db";
require("dotenv").config();

const PORT = process.env.PORT || 8080;

// Create server
app.listen(PORT, () => {
  console.log(`Server is running with port http://localhost:${PORT}`);
  connectDB();
});
