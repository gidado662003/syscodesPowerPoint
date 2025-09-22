const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = require("./app");

const PORT = process.env.PORT || 5000;
const { MONGO_URI } = process.env;

const server = http.createServer(app);
async function startServer() {
  try {
    // Connect to MongoDB first
    if (!MONGO_URI) {
      console.error(
        "❌ Failed to connect to MongoDB: MONGO_URI is not set. Add it to your .env file."
      );
      console.log("💡 Example: MONGO_URI=mongodb://localhost:27017/ecommerce");
      console.log("💡 If using Atlas, paste your full connection string");
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    // Start the server
    server.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    console.log("💡 Make sure MongoDB is running on your system");
    process.exit(1);
  }
}
startServer();
