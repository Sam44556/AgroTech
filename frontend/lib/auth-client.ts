import { createAuthClient } from "better-auth/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
});