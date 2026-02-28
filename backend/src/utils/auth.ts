import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from "./email.js";

const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            // Manually construct the frontend URL using the token from the provided URL
            const token = new URL(url).searchParams.get("token");
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}&email=${user.email}`;

            console.log(`📧 AGROLINK: Triggering verification email for ${user.email} (Non-blocking)`);
            console.log(`🔗 Verification URL: ${verificationUrl}`);

            // FIRE AND FORGET: We don't 'await' this so the sign-up is instant
            sendVerificationEmail({
                to: user.email,
                subject: "Verify your AgroTech Account 🌱",
                verificationUrl: verificationUrl,
                userName: user.name || "there"
            }).then(() => {
                console.log(`✅ AGROLINK: Background email sent to ${user.email}`);
            }).catch((err) => {
                console.error(`❌ AGROLINK: Background email FAILED for ${user.email}:`, err);
            });
        },
    },

    trustedOrigins: [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ].filter(Boolean) as string[],
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: false,
                input: true,
            },
            location: {
                type: "string",
                required: false,
                input: true,
            },
            role: {
                type: "string",
                required: false,
                input: true,
            },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        includeAdditionalFields: true, // This includes custom user fields in session
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const phone = (user as any).phone;
                    if (phone) {
                        const existingPhone = await prisma.user.findUnique({
                            where: { phone }
                        });
                        if (existingPhone) {
                            throw new APIError("BAD_REQUEST", {
                                message: "Phone number already in use"
                            });
                        }
                    }
                }
            }
        }
    },
    plugins: [],
});