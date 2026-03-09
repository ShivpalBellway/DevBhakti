import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

// Get All Pooja Categories (Admin)
export const getAllPoojaCategoriesAdmin = async (req: Request, res: Response) => {
    try {
        const { status, search } = req.query;

        const where: any = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.name = { contains: search as string, mode: "insensitive" };
        }

        const categories = await prisma.poojaCategory.findMany({
            where,
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create or Sugest Pooja Category
export const createPoojaCategory = async (req: Request, res: Response) => {
    try {
        const { name, status = "APPROVED" } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const existing = await prisma.poojaCategory.findUnique({
            where: { name: name.trim() }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: "Category already exists" });
        }

        const category = await prisma.poojaCategory.create({
            data: {
                name: name.trim(),
                status
            }
        });

        res.status(201).json({
            success: true,
            message: status === "PENDING" ? "Category suggested successfully" : "Category created successfully",
            data: category
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Category Status (Admin)
export const updatePoojaCategoryStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const category = await prisma.poojaCategory.update({
            where: { id: id as string },
            data: { status }
        });

        res.status(200).json({
            success: true,
            message: `Category ${status.toLowerCase()} successfully`,
            data: category
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Category (Admin)
export const deletePoojaCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.poojaCategory.delete({ where: { id: id as string } });
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Public/Temple: Get Approved Categories
export const getApprovedPoojaCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.poojaCategory.findMany({
            where: { status: "APPROVED" },
            orderBy: { name: "asc" }
        });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
