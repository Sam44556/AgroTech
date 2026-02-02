import express from "express";
import cors from "cors";
import { toNodeHandler,fromNodeHeaders } from "better-auth/node";
import { auth } from "./utils/auth";

const app = express();
const PORT = 5000;

// CORS configuration for frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Your Next.js frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // Allow cookies/sessions
  })
);

// Parse JSON bodies
app.use(express.json());

// Add error logging middleware for Better Auth
app.use("/api/auth/", (req, res, next) => {
  console.log(`🔐 Auth request: ${req.method} ${req.path}`);
  console.log('📝 Request body:', req.body);
  next();
}, toNodeHandler(auth));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: "Internal server error", 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Test endpoint
app.get("/", (req, res) => {
  res.send("AgroLink Backend Server 🌱");
});

// Protected endpoint example
app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    return res.json({ user: session.user, session: session.session });
  } catch (error) {
    console.error('❌ /api/me error:', error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AgroLink Backend running on http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints available at http://localhost:${PORT}/api/auth/*`);
});