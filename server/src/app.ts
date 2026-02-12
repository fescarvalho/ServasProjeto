import express from "express";
import cors from "cors";
import { corsConfig } from "./config/cors";
import routes from "./routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";

const app = express();

// Middlewares
app.use(cors(corsConfig));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.send("API com TypeScript rodando na Vercel! 🚀");
});

// API Routes
app.use("/", routes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
