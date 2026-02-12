import app from "./app";
import { env } from "./config/env";

// Start server (only in non-production)
if (env.NODE_ENV !== "production") {
    const PORT = env.PORT;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server ready at: http://localhost:${PORT}`);
    });
}

export default app;
