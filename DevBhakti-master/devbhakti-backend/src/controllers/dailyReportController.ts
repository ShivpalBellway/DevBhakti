import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateDailyReportData } from '../services/dailyReportEngine';
import { generateDailyReportPDF } from '../services/pdfReportGenerator';
import { runDailyActivityReports } from '../jobs/dailyReportJob';
import path from 'path';
import fs from 'fs';

export const getDailyReport = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType, date } = req.query;

    if (!entityId || !entityType) {
      return res.status(400).json({ success: false, message: 'entityId and entityType (TEMPLE | MANDAL) are required' });
    }

    const type = (entityType as string).toUpperCase() as 'TEMPLE' | 'MANDAL';

    // Generate or fetch cached report data
    const reportData = await generateDailyReportData(entityId as string, type, date as string | undefined);
    return res.json({ success: true, data: reportData });
  } catch (error: any) {
    console.error('Error fetching daily report:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const getDailyReportHistory = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType, limit = '10' } = req.query;

    if (!entityId || !entityType) {
      return res.status(400).json({ success: false, message: 'entityId and entityType are required' });
    }

    const type = (entityType as string).toUpperCase();
    const take = parseInt(limit as string) || 10;

    const reports = await (prisma as any).dailyActivityReport.findMany({
      where: {
        ...(type === 'TEMPLE' ? { templeId: entityId as string } : { mandalId: entityId as string })
      },
      orderBy: { reportDate: 'desc' },
      take
    });

    return res.json({ success: true, data: reports });
  } catch (error: any) {
    console.error('Error fetching daily report history:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const triggerDailyReportJob = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    console.log(`[Admin Trigger] Manually running Daily Activity Reports for date: ${date || 'yesterday'}`);
    
    // Execute job asynchronously
    runDailyActivityReports(date).catch(err => console.error('[Async Job Error]', err));

    return res.json({ success: true, message: 'Daily Activity Report job triggered successfully.' });
  } catch (error: any) {
    console.error('Error triggering daily report job:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
