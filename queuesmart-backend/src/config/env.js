import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 8000,
  jwtSecret: process.env.JWT_SECRET || "group-3-queuesmart-jwt-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL || "admin@email.com",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
};

export default env;
