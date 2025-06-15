const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Configure environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/authRoutes.js");
const productRoutes = require("./routes/productRoutes.js");
const categoryRoutes = require("./routes/categoryRoutes.js");
const stockMovementRoutes = require("./routes/stockMovementRoutes.js");
const customerRoutes = require("./routes/customerRoutes.js");
const dashboardRoutes = require("./routes/dashboardRoutes.js");
const orderRoutes = require("./routes/orderRoutes");
const salesRoutes = require("./routes/salesRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler.js");
const connectDB = require("./config/db.js");


const app = express();

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sales", salesRoutes);

// Error handler middleware
app.use(errorHandler);

// Serve static assets in production
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "dist")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "dist", "index.html"));
//   });
// }

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    environment: process.env.NODE_ENV || "development",
  });
});
