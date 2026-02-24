import { Router, Request, Response } from "express";
import { farmerOnlyRoute } from "../../../middleware/auths";
import { prisma } from "../../../utils/prisma";
import bcrypt from "bcryptjs";
import argon2 from "argon2";
import crypto from "crypto";
import { verifyStoredPassword } from "../../../utils/password";
import { auth } from "../../../utils/auth";
import { fromNodeHeaders } from "better-auth/node";

const router = Router();

/**
 * GET /api/farmer/settings - Get user settings and preferences
 */
router.get("/", farmerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          // Default values will be used from schema
        }
      });
    }

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        image: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        user,
        settings
      }
    });

  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings"
    });
  }
});


/**
 * PATCH /api/farmer/settings/password - Change user password
 */
router.patch("/password", farmerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    // Get user's current password hash
    // Find the account row that stores a password for this user. Some auth providers
    // may use different providerId values; search by userId and non-null password.
    const account = await prisma.account.findFirst({
      where: {
        userId,
        password: { not: null }
      },
      select: {
        id: true,
        password: true
      }
    });

    if (!account || !account.password) {
      return res.status(400).json({
        success: false,
        message: "No password found for this account"
      });
    }

    // Verify current password. Try bcrypt first (explicitly), log result, then fall back to argon2.
      // First try to validate via Better Auth sign-in (preferred)
      let isCurrentPasswordValid = false;
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          try {
            const signInRes = await auth.api.signIn({ body: { identifier: user.email, password: currentPassword } });
            console.log('Better Auth signIn response:', { ok: !!signInRes, keys: Object.keys(signInRes || {}) });
            // Accept common success shapes
            if (signInRes && (signInRes.session || signInRes.success || signInRes.user)) {
              isCurrentPasswordValid = true;
            }
          } catch (baErr) {
            console.log('Better Auth signIn attempt failed or returned non-success:', baErr?.message || baErr);
          }
        }
      } catch (err) {
        console.error('Error attempting Better Auth signIn verification:', err);
      }

      // Fallback to local verification helper (covers legacy formats)
      if (!isCurrentPasswordValid) {
        try {
          const stored = account.password || '';
          console.log(`Password change: account id=${account.id}, storedPrefix=${stored.slice(0,12)}, storedLen=${stored.length}`);
          const verify = await verifyStoredPassword(stored, currentPassword);
          console.log(`Local verification result for account ${account.id}: valid=${verify.valid}, method=${verify.method}`);
          isCurrentPasswordValid = verify.valid;
        } catch (err) {
          console.error('Error verifying current password locally:', err);
        }
      }
    // Remove the misplaced closing brace here

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    // Log security event
    console.log(`Password changed for user ${userId} at ${new Date().toISOString()}`);

    // Invalidate all existing sessions so the user must re-login
    try {
      await prisma.session.deleteMany({ where: { userId } });
      console.log(`Cleared sessions for user ${userId} after password change`);
    } catch (sessErr) {
      console.warn('Failed to clear sessions after password change:', sessErr);
    }

    res.json({
      success: true,
      message: "Password changed successfully. Please log in again."
    });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
});

/**
 * DELETE /api/farmer/account - Delete user account (soft delete)
 */
router.delete("/account", farmerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { password, confirmation } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account"
      });
    }

    if (confirmation !== "DELETE MY ACCOUNT") {
      return res.status(400).json({
        success: false,
        message: "Please type 'DELETE MY ACCOUNT' to confirm account deletion"
      });
    }

    // Verify password
    const account = await prisma.account.findFirst({
      where: {
        userId,
        password: { not: null }
      },
      select: {
        password: true
      }
    });

    if (!account || !account.password) {
      return res.status(400).json({
        success: false,
        message: "Cannot verify password for account deletion"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password"
      });
    }

    // Get user info before deletion for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true
      }
    });

    // Perform soft delete by anonymizing user data
    const deletedAt = new Date();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${randomSuffix}@deleted.com`,
        name: `Deleted User ${randomSuffix}`,
        phone: null,
        location: null,
        image: null,
        emailVerified: false,
        updatedAt: deletedAt
      }
    });

    // Delete sensitive data
    await prisma.account.deleteMany({
      where: { userId }
    });

    await prisma.session.deleteMany({
      where: { userId }
    });

    await prisma.userSettings.deleteMany({
      where: { userId }
    });

    // Log security event
    console.log(`Account deleted for user ${user?.email} (${user?.name}) at ${deletedAt.toISOString()}`);

    res.json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account"
    });
  }
});

export default router;