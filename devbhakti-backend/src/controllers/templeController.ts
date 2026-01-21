import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAllTemples = async (req: Request, res: Response) => {
  try {
    const temples = await prisma.temple.findMany({
      include: {
        poojas: true
      }
    });
    res.json({ success: true, data: temples });
  } catch (error) {
    console.error('Fetch temples error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temples' });
  }

};

export const getTempleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const temple = await prisma.temple.findUnique({
      where: { id: id as string },

      include: {
        poojas: true,
        events: true
      }
    });
    
    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }
    
    res.json({ success: true, data: temple });

  } catch (error) {
    console.error('Fetch temple details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temple details' });
  }

};


export const registerTemple = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Logic to save to DB will go here after schema is defined
    res.status(201).json({ success: true, message: "Temple registered successfully", data: body });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid temple data' });
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
      return res.status(404).json({ success: false, message: 'Pooja not found' });
    }
    
    res.json({ success: true, data: pooja });

  } catch (error) {
    console.error('Get pooja error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pooja' });
  }

};
export const getAllPoojas = async (req: Request, res: Response) => {
  try {
    const poojas = await prisma.pooja.findMany({
      include: {
        temple: {
          select: {
            name: true,
            location: true,
            image: true
          }
        }
      }
    });
    res.json({ success: true, data: poojas });
  } catch (error) {
    console.error('Fetch poojas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch poojas' });
  }

};
