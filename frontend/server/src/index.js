import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";

import path from "path";

import { connectDB } from "./lib/db.js";
import "./lib/scheduler.js"; // Start background jobs

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import gameRoutes from "./routes/game.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 10000;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/game", gameRoutes);

if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../../client/dist");
  console.log("Static path:", staticPath);
  console.log("Static path exists:", fs.existsSync(staticPath));

  app.use(express.static(staticPath));

  app.get("*", (req, res) => {
    const indexPath = path.join(__dirname, "../../client", "dist", "index.html");
    console.log("Index path:", indexPath);
    console.log("Index path exists:", fs.existsSync(indexPath));
    res.sendFile(indexPath);
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
