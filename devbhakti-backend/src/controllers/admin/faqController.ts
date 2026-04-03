import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

// Admin: Get all FAQs (active + inactive), ordered by order field
export const getFAQs = async (req: Request, res: Response) => {
    try {
        const faqs = await prisma.standardFAQ.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: faqs });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ success: false, message: 'Error fetching FAQs' });
    }
};

// Public: Get only active FAQs, ordered by order field
export const getActiveFAQs = async (req: Request, res: Response) => {
    try {
        const faqs = await prisma.standardFAQ.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: faqs });
    } catch (error) {
        console.error('Error fetching active FAQs:', error);
        res.status(500).json({ success: false, message: 'Error fetching FAQs' });
    }
};

// Admin: Create a new FAQ
export const createFAQ = async (req: Request, res: Response) => {
    try {
        const { question, answer, order, isActive } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ success: false, message: 'Question and answer are required' });
        }

        const faq = await prisma.standardFAQ.create({
            data: {
                question: question.trim(),
                answer: answer.trim(),
                order: parseInt(order as string) || 0,
                isActive: isActive === true || isActive === 'true'
            }
        });

        res.status(201).json({ success: true, message: 'FAQ created successfully', data: faq });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({ success: false, message: 'Error creating FAQ' });
    }
};

// Admin: Update an existing FAQ
export const updateFAQ = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { question, answer, order, isActive } = req.body;

        const existing = await prisma.standardFAQ.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }

        const faq = await prisma.standardFAQ.update({
            where: { id },
            data: {
                question: question !== undefined ? question.trim() : existing.question,
                answer: answer !== undefined ? answer.trim() : existing.answer,
                order: order !== undefined ? parseInt(order as string) : existing.order,
                isActive: isActive !== undefined
                    ? (isActive === true || isActive === 'true')
                    : existing.isActive
            }
        });

        res.json({ success: true, message: 'FAQ updated successfully', data: faq });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({ success: false, message: 'Error updating FAQ' });
    }
};

// Admin: Delete a FAQ
export const deleteFAQ = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const existing = await prisma.standardFAQ.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'FAQ not found' });
        }
        await prisma.standardFAQ.delete({ where: { id } });
        res.json({ success: true, message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({ success: false, message: 'Error deleting FAQ' });
    }
};
