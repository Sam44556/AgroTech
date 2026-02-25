import { Router, Request, Response } from "express";
import { buyerOnlyRoute } from "../../../middleware/auths";
import { prisma } from "../../../utils/prisma";
import { uploadToCloudinary, deleteFromCloudinary, upload } from "../../../utils/cloudnary";

const router = Router();

/**
 * GET /api/buyer/profile - Get buyer's profile data
 */
router.get("/", buyerOnlyRoute, async (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;

    // Get user and buyer profile data
    const [user, buyerProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: buyerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
          image: true,
          createdAt: true
        }
      }),
      prisma.buyerProfile.findUnique({
        where: { userId: buyerId }
      })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Create buyer profile if it doesn't exist
    let profile = buyerProfile;
    if (!profile) {
      profile = await prisma.buyerProfile.create({
        data: {
          userId: buyerId,
          totalOrders: 0,
          totalSpent: 0,
          favoriteCount: 0
        }
      });
    }

    res.json({
      success: true,
      data: {
        user,
        profile
      }
    });

  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile data"
    });
  }
});

/**
 * PUT /api/buyer/profile - Update buyer's profile
 */
router.put("/", buyerOnlyRoute, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const buyerId = req.user!.id;
    const {
      name,
      phone,
      location,
      deliveryAddress,
      paymentMethod
    } = req.body as any;

    // Update user basic info
    const updateUserData: any = {};
    if (name !== undefined) updateUserData.name = name;
    if (phone !== undefined) updateUserData.phone = phone;
    if (location !== undefined) updateUserData.location = location;

    // If an image file is provided, upload to Cloudinary and set image
    if (req.file) {
      try {
        const imageUrl = await uploadToCloudinary((req.file as Express.Multer.File).buffer, "avatars");

        // Attempt to delete existing image
        try {
          const existing = await prisma.user.findUnique({ where: { id: buyerId }, select: { image: true } });
          if (existing?.image) {
            await deleteFromCloudinary(existing.image).catch((e) => console.warn("Failed to delete old image:", e));
          }
        } catch (e) {
          console.warn("Failed to check/delete existing image:", e);
        }

        updateUserData.image = imageUrl;
      } catch (uploadErr) {
        console.error("Failed to upload profile image:", uploadErr);
        return res.status(500).json({ success: false, message: "Failed to upload image" });
      }
    }

    // Update buyer profile specific info
    const updateProfileData: any = {};
    if (deliveryAddress !== undefined) updateProfileData.deliveryAddress = deliveryAddress;
    if (paymentMethod !== undefined) updateProfileData.paymentMethod = paymentMethod;

    const [updatedUser, updatedProfile] = await Promise.all([
      // Update user table
      Object.keys(updateUserData).length > 0
        ? prisma.user.update({
            where: { id: buyerId },
            data: {
              ...updateUserData,
              updatedAt: new Date()
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              location: true,
              image: true,
              createdAt: true
            }
          })
        : prisma.user.findUnique({
            where: { id: buyerId },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              location: true,
              image: true,
              createdAt: true
            }
          }),
      
      // Update or create buyer profile
      Object.keys(updateProfileData).length > 0
        ? prisma.buyerProfile.upsert({
            where: { userId: buyerId },
            update: {
              ...updateProfileData,
              updatedAt: new Date()
            },
            create: {
              userId: buyerId,
              ...updateProfileData,
              totalOrders: 0,
              totalSpent: 0,
              favoriteCount: 0
            }
          })
        : prisma.buyerProfile.upsert({
            where: { userId: buyerId },
            update: {},
            create: {
              userId: buyerId,
              totalOrders: 0,
              totalSpent: 0,
              favoriteCount: 0
            }
          })
    ]);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
        profile: updatedProfile
      }
    });

  } catch (error) {
    console.error("Error updating buyer profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
});

export default router;