import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

const getFilePath = (file: any) => {
  if (file) {
    return `/uploads/mandals/documents/${file.filename}`;
  }
  return null;
};

// 1. Get all documents for mandal
export const getMandalDocuments = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;

    const documents = await (prisma as any).mandalDocument.findMany({
      where: { mandalId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    console.error('Error fetching mandal documents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Add / Upload new document
export const addMandalDocument = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Document file is required.' });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Document title is required.' });
    }

    const fileUrl = getFilePath(file);

    const document = await (prisma as any).mandalDocument.create({
      data: {
        mandalId,
        title,
        description: description || null,
        fileUrl: fileUrl!,
        fileType: file.mimetype,
        fileSize: file.size
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error: any) {
    console.error('Error uploading mandal document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update existing document details or replace file
export const updateMandalDocument = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    const existingDoc = await (prisma as any).mandalDocument.findFirst({
      where: { id: id as string, mandalId: mandalId as string }
    });

    if (!existingDoc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (file) {
      updateData.fileUrl = getFilePath(file);
      updateData.fileType = file.mimetype;
      updateData.fileSize = file.size;
    }

    const updatedDocument = await (prisma as any).mandalDocument.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error: any) {
    console.error('Error updating mandal document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete document
export const deleteMandalDocument = async (req: Request, res: Response) => {
  try {
    const mandalId = (req as any).owner.ownerId;
    const { id } = req.params;

    const existingDoc = await (prisma as any).mandalDocument.findFirst({
      where: { id: id as string, mandalId: mandalId as string }
    });

    if (!existingDoc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    await (prisma as any).mandalDocument.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting mandal document:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
