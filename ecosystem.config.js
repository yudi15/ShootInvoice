module.exports = {
  apps: [
    {
      name: "shoot-invoice-api",
      script: "./server.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        // Include any other environment variables your app needs
        MONGO_URI: mongodb+srv://root:bSAKFWq2UAVyIxJp@cluster0.3znej.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};