import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const NEWS_SETTING_KEY = 'mandal_news_list';

// Helper to fetch news array from GlobalSetting
async function getNewsFromDB(): Promise<any[]> {
    const setting = await prisma.globalSetting.findUnique({
        where: { key: NEWS_SETTING_KEY }
    });
    if (!setting || !Array.isArray(setting.value)) {
        return [];
    }
    return setting.value as any[];
}

// Helper to save news array to GlobalSetting
async function saveNewsToDB(newsList: any[]) {
    return await prisma.globalSetting.upsert({
        where: { key: NEWS_SETTING_KEY },
        update: { value: newsList },
        create: {
            key: NEWS_SETTING_KEY,
            value: newsList
        }
    });
}

// Admin: Get all news items
router.get('/admin', async (req: Request, res: Response) => {
    try {
        const news = await getNewsFromDB();
        res.json({ success: true, data: news });
    } catch (error: any) {
        console.error('Error fetching admin news:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch news items' });
    }
});

// Public: Get active news items
router.get('/', async (req: Request, res: Response) => {
    try {
        const news = await getNewsFromDB();
        const activeNews = news.filter((item: any) => item.isActive !== false);
        res.json({ success: true, data: activeNews });
    } catch (error: any) {
        console.error('Error fetching public news:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch public news items' });
    }
});

// Public: Get active news item by id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const news = await getNewsFromDB();
        const item = news.find((newsItem: any) => newsItem.id === id && newsItem.isActive !== false);

        if (!item) {
            return res.status(404).json({ success: false, message: 'News item not found' });
        }

        res.json({ success: true, data: item });
    } catch (error: any) {
        console.error('Error fetching public news item:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch public news item' });
    }
});

// Admin: Create news item
router.post('/admin', async (req: Request, res: Response) => {
    try {
        const { title, description, content, image, category, festival, mandalId, mandalName, isActive } = req.body;

        if (!title || (typeof title === 'string' && !title.trim())) {
            return res.status(400).json({ success: false, message: 'News title is required' });
        }

        const currentNews = await getNewsFromDB();

        const newItem = {
            id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title,
            description: description || '',
            content: content || description || '',
            image: image || '',
            category: category || 'Ganeshotsav',
            festival: festival || 'Ganesh Utsav',
            mandalId: mandalId || null,
            mandalName: mandalName || null,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            publishedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedNews = [newItem, ...currentNews];
        await saveNewsToDB(updatedNews);

        res.json({ success: true, message: 'Mandal News created successfully', data: newItem });
    } catch (error: any) {
        console.error('Error creating news:', error);
        res.status(500).json({ success: false, message: 'Failed to create news item' });
    }
});

// Admin: Update news item
router.put('/admin/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, content, image, category, festival, mandalId, mandalName, isActive } = req.body;

        const currentNews = await getNewsFromDB();
        const index = currentNews.findIndex((item: any) => item.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'News item not found' });
        }

        const updatedItem = {
            ...currentNews[index],
            title: title !== undefined ? title : currentNews[index].title,
            description: description !== undefined ? description : currentNews[index].description,
            content: content !== undefined ? content : currentNews[index].content,
            image: image !== undefined ? image : currentNews[index].image,
            category: category !== undefined ? category : currentNews[index].category,
            festival: festival !== undefined ? festival : currentNews[index].festival,
            mandalId: mandalId !== undefined ? mandalId : currentNews[index].mandalId,
            mandalName: mandalName !== undefined ? mandalName : currentNews[index].mandalName,
            isActive: isActive !== undefined ? Boolean(isActive) : currentNews[index].isActive,
            updatedAt: new Date().toISOString(),
        };

        currentNews[index] = updatedItem;
        await saveNewsToDB(currentNews);

        res.json({ success: true, message: 'Mandal News updated successfully', data: updatedItem });
    } catch (error: any) {
        console.error('Error updating news:', error);
        res.status(500).json({ success: false, message: 'Failed to update news item' });
    }
});

// Admin: Toggle active status
router.patch('/admin/:id/toggle', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentNews = await getNewsFromDB();
        const index = currentNews.findIndex((item: any) => item.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'News item not found' });
        }

        currentNews[index].isActive = !currentNews[index].isActive;
        currentNews[index].updatedAt = new Date().toISOString();

        await saveNewsToDB(currentNews);

        res.json({
            success: true,
            message: `News item ${currentNews[index].isActive ? 'activated' : 'deactivated'} successfully`,
            data: currentNews[index]
        });
    } catch (error: any) {
        console.error('Error toggling news status:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle news status' });
    }
});

// Admin: Delete news item
router.delete('/admin/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentNews = await getNewsFromDB();
        const filteredNews = currentNews.filter((item: any) => item.id !== id);

        if (filteredNews.length === currentNews.length) {
            return res.status(404).json({ success: false, message: 'News item not found' });
        }

        await saveNewsToDB(filteredNews);

        res.json({ success: true, message: 'Mandal News deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting news item:', error);
        res.status(500).json({ success: false, message: 'Failed to delete news item' });
    }
});

export default router;
