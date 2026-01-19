import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllTemples = async (req: Request, res: Response) => {
  try {
    // For now, we return an empty array or static data until migrations are run
    // const temples = await prisma.temple.findMany();
    res.json({ message: "Get all temples endpoint", data: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch temples' });
  }
};

export const registerTemple = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Logic to save to DB will go here after schema is defined
    res.status(201).json({ message: "Temple registered successfully", data: body });
  } catch (error) {
    res.status(400).json({ error: 'Invalid temple data' });
  }
};

export const getPoojaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pooja = await prisma.pooja.findUnique({
      where: { id: String(id) },
      include: {
        temple: true
      }
    });
    
    if (!pooja) {
      return res.status(404).json({ error: 'Pooja not found' });
    }
    
    res.json(pooja);
  } catch (error) {
    console.error('Get pooja error:', error);
    res.status(500).json({ error: 'Failed to fetch pooja' });
  }
};
