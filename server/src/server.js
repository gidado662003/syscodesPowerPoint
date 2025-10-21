const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = require("./app");

const PORT = process.env.PORT || 5001;
const { MONGO_URI } = process.env;

const server = http.createServer(app);
async function startServer() {
  try {
    // Connect to MongoDB first
    if (!MONGO_URI) {
      console.error(
        "❌ Failed to connect to MongoDB: MONGO_URI is not set. Add it to your .env file."
      );
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    // Start the server
    const HOST = process.env.HOST || "10.0.0.253";
    server.listen(PORT, HOST, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode at http://${HOST}:${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    console.log("💡 Make sure MongoDB is running on your system");
    process.exit(1);
  }
}
startServer();
