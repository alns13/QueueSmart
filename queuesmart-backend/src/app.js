import cors from "cors";
import express from "express";
import env from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import serviceRoutes from "./modules/services/service.routes.js";
import waitTimeRoutes from "./modules/waitTime/waitTime.routes.js";
import { adminQueueRouter, historyRouter, notificationRouter, queueRouter } from "./modules/operations/operations.routes.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "QueueSmart Backend is running" });
});

app.use("/auth", authRoutes);
app.use("/services", serviceRoutes);
app.use("/waitTime",waitTimeRoutes);
app.use("/queues", queueRouter);
app.use("/admin/queues", adminQueueRouter);
app.use("/notifications", notificationRouter);
app.use("/history", historyRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
