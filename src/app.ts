import express, { Application, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
// import profileRoutes from "./routes/profileRoutes";
import blogRoutes from "./routes/blogRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";

const app: Application = express();

// السماح فقط للفرونت المحلي ونسخة Vercel
const allowedOrigins = [
  "localhost:3000",
  "https://aghyad-fanous-portfolio.vercel.app"
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true, // مهم جداً
  })
)

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("🌌 Portfolio API is running (TypeScript Edition)...");
});

app.use("/api/auth", authRoutes);
// app.use("/api/profile", profileRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/projects", projectRoutes);

export default app;
