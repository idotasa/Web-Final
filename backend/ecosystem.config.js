module.exports = {
  apps: [
    {
      name: "web-final-backend",
      script: "./dist/server.js",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
