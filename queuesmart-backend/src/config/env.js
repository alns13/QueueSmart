import dotenv from "dotenv";

dotenv.config();

const isTest = Boolean(process.env.NODE_TEST_CONTEXT);

function required(name, testValue) {
  const value = isTest ? testValue : (process.env[name] || "");
  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env and provide a secure value.`);
  }
  return value;
}

const jwtSecret = required(
  "JWT_SECRET",
  "queuesmart-test-only-jwt-secret-never-use-in-production"
);
const adminEmail = required("ADMIN_EMAIL", "admin@email.com");
const adminPassword = required("ADMIN_PASSWORD", "admin123");

if (!isTest && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long.");
}

if (!isTest && jwtSecret.startsWith("replace-with-")) {
  throw new Error("JWT_SECRET must be replaced with a private random value.");
}

if (!isTest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error("ADMIN_EMAIL must be a valid email address.");
}

if (!isTest && (adminPassword.length < 12 || adminPassword.startsWith("replace-with-"))) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
}

const env = {
  port: Number(process.env.PORT) || 8000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  adminEmail,
  adminPassword,
};

export default env;
