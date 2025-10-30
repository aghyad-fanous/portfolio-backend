import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
// import profileRoutes from "./routes/profileRoutes";
// import blogRoutes from "./routes/blogRoutes";
// import projectRoutes from "./routes/projectRoutes";
// import newsletterRoutes from "./routes/newsletterRoutes";

const app: Application = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("🌌 Portfolio API is running (TypeScript Edition)...");
});

app.use("/api/auth", authRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/blogs", blogRoutes);
// app.use("/api/projects", projectRoutes);
// app.use("/api/newsletter", newsletterRoutes);

export default app;
