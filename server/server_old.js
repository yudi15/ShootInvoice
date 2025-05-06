require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const userRoutes = require("./routes/userRoutes");
const fs = require("fs");
const compression = require("compression");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add compression
app.use(compression());

// Static files (logo uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add this near the top of your server.js file
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory");
}

// Add this logging to help debug static file serving
app.use((req, res, next) => {
  if (req.url.startsWith("/uploads")) {
    console.log("Attempting to serve static file:", req.url);
  }
  next();
});

// Add more detailed logging
app.use((req, res, next) => {
  if (req.url.includes("uploads") || req.url.includes("logo")) {
    console.log("File request:", req.url);

    // Check if file exists
    const filePath = req.url.startsWith("/uploads/")
      ? path.join(__dirname, req.url)
      : null;

    if (filePath) {
      fs.access(filePath, fs.constants.F_OK, (err) => {
        console.log(`File ${filePath} ${err ? "does not exist" : "exists"}`);
      });
    }
  }
  next();
});

// Add a simple test route at the root level, before other routes
app.get("/", (req, res) => {
  res.send("Server is running correctly");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
}

// Add a redirect for incorrectly formatted logo paths
app.use("/document/uploads", (req, res) => {
  const correctPath = req.url;
  console.log(
    `Redirecting from /document/uploads${req.url} to /uploads${req.url}`
  );
  res.redirect(`/uploads${req.url}`);
});

// Make sure this comes before the other routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// For static assets
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1d", // Cache for 1 day
    etag: true,
  })
);

// For API responses that don't change often
app.get("/api/documents/types", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
  // Response data...
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
