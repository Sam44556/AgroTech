import express from "express";
import { createServer } from "http"; // NEW: Import HTTP server
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./utils/auth.js";
import { initializeSocket } from "./utils/socket.js"; // NEW: Import Socket.IO initializer
import farmerListingsRoutes from "./routes/farmer/listings/route.js";
import farmerProfileRoutes from "./routes/farmer/profile/route.js";
import farmerWeatherRoutes from "./routes/farmer/weather/route.js";
import farmerDashboardRoutes from "./routes/farmer/dashboard/route.js";
import farmerSettingsRoutes from "./routes/farmer/settings/route.js";
import farmerCropsRoutes from "./routes/farmer/crops/route.js";
import farmerMarketRoutes from "./routes/farmer/market/route.js";
import farmerChatRoutes from "./routes/farmer/chat/route.js";
import farmerOrdersRoutes from "./routes/farmer/orders/route.js";
import farmerExpertsRoutes from "./routes/farmer/experts/route.js";
import buyerDashboardRoutes from "./routes/buyer/dashboard/route.js";
import buyerProfileRoutes from "./routes/buyer/profile/route.js";
import buyerBrowseRoutes from "./routes/buyer/browse/route.js";
import buyerFavoritesRoutes from "./routes/buyer/favorites/route.js";
import buyerChatRoutes from "./routes/buyer/chat/route.js";
import buyerOrdersRoutes from "./routes/buyer/orders/route.js";
import expertDashboardRoutes from "./routes/expert/dashboard/route.js";
import expertProfileRoutes from "./routes/expert/profile/route.js";
import expertArticlesRoutes from "./routes/expert/articles/route.js";
import expertChatRoutes from "./routes/expert/chat/route.js";
import adminAnalyticsRoutes from "./routes/admin/analytics/route.js";
import adminUsersRoutes from "./routes/admin/users/route.js";
import adminMarketRoutes from "./routes/admin/market/route.js";
import adminProfileRoutes from "./routes/admin/profile/route.js";
import adminAlertsRoutes from "./routes/admin/alerts/route.js";
import authUtilsRoutes from "./routes/auth-utils/route.js";
import articlesRoutes from "./routes/articles/route.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render deployment (required for secure cookies)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// NEW: Create HTTP server from Express app
// EXPLANATION: Express is just middleware. To use Socket.IO, we need the underlying HTTP server.
// Think of it like: Express = your house, HTTP server = the foundation
const httpServer = createServer(app);

// NEW: Initialize Socket.IO with the HTTP server
// EXPLANATION: This attaches Socket.IO to the same server Express uses.
// Now both HTTP requests (Express) and WebSocket connections (Socket.IO) work on the same port!
const io = initializeSocket(httpServer);

// CORS configuration for frontend
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// In development allow the requesting origin (useful for local setups and ports)
const corsOptions = process.env.NODE_ENV === 'production' ? {
  origin: [FRONTEND_ORIGIN, "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
} : {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// API Routes
app.use("/api/farmer/listings", farmerListingsRoutes);
app.use("/api/farmer/profile", farmerProfileRoutes);
app.use("/api/farmer/weather", farmerWeatherRoutes);
app.use("/api/farmer/dashboard", farmerDashboardRoutes);
app.use("/api/farmer/settings", farmerSettingsRoutes);
app.use("/api/farmer/crops", farmerCropsRoutes);
app.use("/api/farmer/market", farmerMarketRoutes);
app.use("/api/farmer/chat", farmerChatRoutes);
app.use("/api/farmer/orders", farmerOrdersRoutes);
app.use("/api/farmer/experts", farmerExpertsRoutes);

// Buyer routes
app.use("/api/buyer/dashboard", buyerDashboardRoutes);
app.use("/api/buyer/profile", buyerProfileRoutes);
app.use("/api/buyer/browse", buyerBrowseRoutes);
app.use("/api/buyer/favorites", buyerFavoritesRoutes);
app.use("/api/buyer/chat", buyerChatRoutes);
app.use("/api/buyer/orders", buyerOrdersRoutes);

// Expert routes
app.use("/api/expert/dashboard", expertDashboardRoutes);
app.use("/api/expert/profile", expertProfileRoutes);
app.use("/api/expert/articles", expertArticlesRoutes);
app.use("/api/expert/chat", expertChatRoutes);

// Admin routes
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/market", adminMarketRoutes);
app.use("/api/admin/profile", adminProfileRoutes);
app.use("/api/admin/alerts", adminAlertsRoutes);

// Auth utilities
app.use("/api/auth-utils", authUtilsRoutes);

// Public routes
app.use("/api/articles", articlesRoutes);

// Add error logging middleware for Better Auth
app.use("/api/auth/", (req, res, next) => {
  console.log(`🔐 Auth request: ${req.method} ${req.path}`);
  console.log('📝 Request body:', req.body);
  next();
}, async (req, res, next) => {
  const authHandler = toNodeHandler(auth);

  try {
    await authHandler(req, res);
  } catch (error: any) {
    console.error('❌ Auth error:', error);

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      let message = 'This account already exists';

      if (field === 'phone') {
        message = 'This phone number is already registered. Please use a different phone number or login to your existing account.';
      } else if (field === 'email') {
        message = 'This email is already registered. Please login or use a different email.';
      }

      return res.status(400).json({
        error: message,
        field: field
      });
    }

    // Pass other errors to default error handler
    next(error);
  }
});

// Error handling middleware
import { Request, Response, NextFunction } from "express";

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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

// CHANGED: Listen on httpServer instead of app
// EXPLANATION: This allows both Express routes AND Socket.IO to work on the same port
httpServer.listen(PORT, () => {
  console.log(`🚀 AgroLink Backend running on port ${PORT}`);
  console.log(`🔐 Auth endpoints available at /api/auth/*`);
  console.log(`🔌 Socket.IO ready for real-time messaging`);
});