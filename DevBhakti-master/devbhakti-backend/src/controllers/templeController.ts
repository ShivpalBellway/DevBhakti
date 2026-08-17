import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { localize, getEnglish, getLang } from '../utils/localization';

const JWT_SECRET = process.env.JWT_SECRET || 'devbhakti_secret_key_2026';

const getUserIdFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

// getLang is now imported from ../utils/localization

export const getTempleFilters = async (req: Request, res: Response) => {
  try {
    const lang = getLang(req);

    // Fetch distinct categories and locations from Active Temples
    const temples = await prisma.temple.findMany({
      where: {
        isActive: true
      },
      select: {
        category: true,
        location: true
      }
    });

    const categoriesSet = new Set<string>();
    const locationsSet = new Set<string>();

    temples.forEach(t => {
      // category & location are now Json — pick selected lang
      const cat = t.category as any;
      const loc = t.location as any;
      if (cat) {
        const val = (cat[lang] || cat['en'] || '').trim();
        if (val) categoriesSet.add(val);
      }
      if (loc) {
        const val = (loc[lang] || loc['en'] || '').trim();
        if (val) locationsSet.add(val);
      }
    });

    // Fetch distinct pooja names
    const poojas = await prisma.pooja.findMany({
      where: { status: true },
      select: { name: true }
    });

    const poojasSet = new Set<string>();
    poojas.forEach(p => {
      const name = p.name as any;
      if (name) {
        const val = (name[lang] || name['en'] || '').trim();
        if (val) poojasSet.add(val);
      }
    });

    // Fetch all active temples for dropdown
    const allTemples = await prisma.temple.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        location: true
      }
    });

    const templesList = allTemples.map(t => ({
        id: t.id,
        name: (t.name as any)[lang] || (t.name as any)['en'] || '',
        location: (t.location as any)[lang] || (t.location as any)['en'] || ''
    }));

    // Fetch all active pooja categories
    const poojaCatList = await prisma.poojaCategory.findMany({
      where: { status: "APPROVED" },
    });
    
    const poojaCategories = poojaCatList.map(c => ({
      id: c.id,
      name: (c.name as any)[lang] || (c.name as any)['en'] || '',
      nameSlug: c.nameSlug
    }));

    res.json({
      success: true,
      data: {
        categories: Array.from(categoriesSet).sort(),
        locations: Array.from(locationsSet).sort(),
        poojas: Array.from(poojasSet).sort(),
        temples: templesList,
        poojaCategories
      }
    });

  } catch (error) {
    console.error('Fetch temple filters error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch filters' });
  }
};

export const getAllTemples = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const lang = getLang(req);
    const { search, category, location, pooja, poojaId } = req.query;

    const whereClause: any = {
      isActive: true
    };

    // Search: Handled in JS for case-insensitivity on Json fields

    // Category filter — match English value (stored in JSON)
    if (category && category !== 'All') {
      whereClause.category = { path: ['en'], equals: String(category) };
    }

    // Location filter — match English value
    if (location && location !== 'All') {
      whereClause.location = { path: ['en'], string_contains: String(location) };
    }

    // Pooja filtering by name (English)
    if (pooja && pooja !== 'All') {
      whereClause.poojas = {
        some: {
          name: { path: ['en'], equals: String(pooja) },
          status: true
        }
      };
    }

    // Pooja filtering by ID
    if (poojaId) {
      whereClause.poojas = {
        some: {
          OR: [
            { id: String(poojaId) },
            { masterPoojaId: String(poojaId) }
          ],
          status: true
        }
      };
    }

    let temples = await prisma.temple.findMany({
      where: whereClause,
      include: {
        user: {
          select: { isVerified: true }
        },
        poojas: {
          where: { status: true }
        }
      }
    });

    // Case-insensitive filtering in JS
    if (search) {
      const lowQuery = String(search).toLowerCase();
      temples = temples.filter((t: any) => {
        const nameEn = (t.name?.en || '').toLowerCase();
        const nameHi = (t.name?.hi || '').toLowerCase();
        const locEn = (t.location?.en || '').toLowerCase();
        const locHi = (t.location?.hi || '').toLowerCase();
        
        return nameEn.includes(lowQuery) || 
               nameHi.includes(lowQuery) || 
               locEn.includes(lowQuery) || 
               locHi.includes(lowQuery);
      });
    }

    // Rank results if searching — compare English name
    if (search) {
      const lowQuery = String(search).toLowerCase();
      temples.sort((a, b) => {
        const nameA = getEnglish(a.name).toLowerCase();
        const nameB = getEnglish(b.name).toLowerCase();

        if (nameA === lowQuery && nameB !== lowQuery) return -1;
        if (nameB === lowQuery && nameA !== lowQuery) return 1;
        if (nameA.startsWith(lowQuery) && !nameB.startsWith(lowQuery)) return -1;
        if (nameB.startsWith(lowQuery) && !nameA.startsWith(lowQuery)) return 1;
        const aInName = nameA.includes(lowQuery);
        const bInName = nameB.includes(lowQuery);
        if (aInName && !bInName) return -1;
        if (bInName && !aInName) return 1;

        return 0;
      });
    }

    let favoritedTempleIds = new Set<string>();

    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
          templeId: { not: null }
        },
        select: { templeId: true }
      });
      favorites.forEach(fav => {
        if (fav.templeId) favoritedTempleIds.add(fav.templeId);
      });
    }

    const templesWithDetails = temples.map((temple) => {
      const hasUserLiveFlag = temple.isLive;
      const hasLiveSource = !!(temple.liveUrl || temple.channelId);
      const isLiveNow = !!(hasUserLiveFlag && hasLiveSource);
      const resolvedLiveUrl: string | null = temple.liveUrl || null;

      return {
        ...temple,
        isLiveNow,
        liveUrl: resolvedLiveUrl,
        isFavorite: favoritedTempleIds.has(temple.id)
      };
    });

    res.json({ success: true, data: localize(templesWithDetails, lang) });
  } catch (error) {
    console.error('Fetch temples error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temples' });
  }
};


export const getTempleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lang = getLang(req);
    const userId = getUserIdFromRequest(req);

    const temple = await prisma.temple.findFirst({
      where: {
        OR: [
          { id: id as string },
          { slug: id as string },
          { subdomain: id as string }
        ],
        isActive: true,
      },
      include: {
        user: {
          select: { isVerified: true }
        }
      }
    });

    if (!temple) {
      return res.status(404).json({ success: false, message: 'Temple not found' });
    }

    const [poojas, events] = await Promise.all([
      prisma.pooja.findMany({
        where: {
          templeId: temple.id,
          status: true
        }
      }),
      prisma.event.findMany({
        where: {
          OR: [
            { templeId: temple.id },
            { templeId: null }
          ],
          status: true
        },
        include: {
          Pooja: {
            where: {
              status: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    ]);

    const hasUserLiveFlag = temple.isLive;
    const hasLiveSource = !!((temple as any).liveUrl || (temple as any).channelId);
    const isLiveNow = !!(hasUserLiveFlag && hasLiveSource);
    const resolvedLiveUrl: string | null = (temple as any).liveUrl || null;

    let isFavorite = false;
    if (userId) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_templeId: {
            userId: userId,
            templeId: temple.id
          }
        }
      });
      if (fav) isFavorite = true;
    }

    res.json({
      success: true,
      data: localize({
        ...temple,
        poojas,
        events,
        isLiveNow,
        liveUrl: resolvedLiveUrl,
        isFavorite
      }, lang)
    });

  } catch (error) {
    console.error('Fetch temple details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch temple details' });
  }
};


export const registerTemple = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    res.status(201).json({ success: true, message: "Temple registered successfully", data: body });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid temple data' });
  }
};

export const getPoojaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lang = getLang(req);
    const userId = getUserIdFromRequest(req);

    console.log(`[DEBUG] getPoojaById called with ID: ${id}`);

    const pooja = await prisma.pooja.findFirst({
      where: {
        status: true,
        AND: [
          {
            OR: [
              { id: String(id) },
              { slug: String(id) }
            ]
          },
          {
            OR: [
              { isMaster: true },
              { templeId: null },
              {
                temple: {
                  isActive: true,
                  user: {
                    isVerified: true,
                    role: 'INSTITUTION'
                  }
                }
              },
              {
                mandal: {
                  status: 'APPROVED',
                  isActive: true
                }
              }
            ]
          }
        ]
      },
      include: {
        temple: true,
        mandal: true,
        templeCopies: {
          where: {
            status: true,
            OR: [
              { 
                temple: { 
                  isActive: true,
                  user: { isVerified: true } 
                } 
              },
              { templeId: null }
            ]
          },
          include: {
            temple: {
              select: {
                id: true,
                name: true,       // Json field — localize() will handle
                location: true,   // Json field — localize() will handle
                image: true
              }
            }
          }
        }
      }
    });

    if (!pooja) {
      return res.status(404).json({ success: false, message: 'Pooja not found' });
    }

    const standardFaqs = await prisma.standardFAQ.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    let isFavorite = false;
    if (userId) {
      const fav = await prisma.favorite.findUnique({
        where: {
          userId_poojaId: {
            userId: userId,
            poojaId: pooja.id
          }
        }
      });
      if (fav) isFavorite = true;
    }

    res.json({ success: true, data: localize({ ...pooja, isFavorite, standardFaqs }, lang) });

  } catch (error) {
    console.error('Get pooja error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pooja' });
  }
};

const getLowestPriceOfPoojaRecord = (p: any): number => {
  let prices: number[] = [];
  if (p.price !== undefined && p.price !== null) {
    const val = Number(p.price);
    if (!isNaN(val) && val > 0) prices.push(val);
  }
  if (p.packages) {
    try {
      const pkgs = typeof p.packages === 'string' ? JSON.parse(p.packages) : p.packages;
      if (Array.isArray(pkgs)) {
        pkgs.forEach((pkg: any) => {
          if (pkg && pkg.price !== undefined && pkg.price !== null) {
            const val = Number(pkg.price);
            if (!isNaN(val) && val > 0) prices.push(val);
          }
        });
      }
    } catch (e) {}
  }
  const validPrices = prices.filter(val => val > 0);
  return validPrices.length > 0 ? Math.min(...validPrices) : (p.price || 0);
};

const resolvePoojaLowestPriceInfo = (pooja: any, filterLocation?: string) => {
  const resolvedPooja = { ...pooja };
  
  if (pooja.isMaster && pooja.templeCopies && pooja.templeCopies.length > 0) {
    let candidates = pooja.templeCopies;
    if (filterLocation && filterLocation !== 'All') {
      const lowLoc = filterLocation.toLowerCase().trim();
      candidates = candidates.filter((c: any) => {
        if (!c.temple) return false;
        const locEn = (c.temple.location?.en || '').toLowerCase().trim();
        const locHi = (c.temple.location?.hi || '').toLowerCase().trim();
        return locEn.includes(lowLoc) || locHi.includes(lowLoc);
      });
    }

    if (candidates.length > 0) {
      let bestCopy = candidates[0];
      let bestPrice = getLowestPriceOfPoojaRecord(bestCopy);

      for (let i = 1; i < candidates.length; i++) {
        const currentPrice = getLowestPriceOfPoojaRecord(candidates[i]);
        if (currentPrice < bestPrice) {
          bestPrice = currentPrice;
          bestCopy = candidates[i];
        }
      }

      resolvedPooja.temple = bestCopy.temple;
      resolvedPooja.price = bestCopy.price;
      resolvedPooja.packages = bestCopy.packages;
    }
  }

  resolvedPooja.computedLowestPrice = getLowestPriceOfPoojaRecord(resolvedPooja);
  return resolvedPooja;
};

export const getAllPoojas = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const lang = getLang(req);
    const { templeId, mandalId, category, location, search, categoryId } = req.query;

    const where: any = {
      status: true
    };

    // Search: Handled in JS for case-insensitivity on Json fields

    if (mandalId) {
      where.mandalId = String(mandalId);
      where.mandal = {
        status: 'APPROVED',
        isActive: true
      };
    } else if (templeId) {
      where.templeId = String(templeId);
      where.temple = {
        isActive: true,
        user: { isVerified: true }
      };
    } else {
      // Global View: Deduplicate - Show Master poojas (if they have at least one active copy) OR Standalone poojas
      where.OR = [
        {
          isMaster: true,
          templeCopies: {
            some: {
              status: true,
              temple: {
                isActive: true,
                user: { isVerified: true }
              }
            }
          }
        },
        {
          AND: [
            { isMaster: false },
            { masterPoojaId: null },
            {
              OR: [
                {
                  temple: {
                    isActive: true,
                    user: { isVerified: true }
                  }
                },
                {
                  mandal: {
                    status: 'APPROVED',
                    isActive: true
                  }
                }
              ]
            }
          ]
        }
      ];
    }

    if (categoryId && categoryId !== 'All') {
      where.categoryId = String(categoryId);
    } else if (category && category !== 'All') {
      where.category = { path: ['en'], equals: String(category) };
    }

    if (location && location !== 'All') {
      const locationFilter = { location: { path: ['en'], string_contains: String(location) } };
      
      if (templeId) {
        where.temple = {
          ...where.temple,
          location: locationFilter.location
        };
      } else {
        // Advanced Global Filtering: Master poojas with copies in this location OR Standalone poojas in this location
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            {
              isMaster: true,
              templeCopies: {
                some: {
                  temple: {
                    location: locationFilter.location,
                    isActive: true,
                    user: { isVerified: true }
                  },
                  status: true
                }
              }
            },
            {
              isMaster: false,
              masterPoojaId: null,
              temple: {
                location: locationFilter.location,
                isActive: true,
                user: { isVerified: true }
              }
            },
            {
              isMaster: false,
              masterPoojaId: null,
              mandal: {
                status: 'APPROVED',
                isActive: true
              }
            }
          ]
        });
      }
    }

    const poojas = await prisma.pooja.findMany({
      where,
      include: {
        temple: {
          select: {
            id: true,
            name: true,       // Json — localize() handles
            location: true,   // Json — localize() handles
            image: true
          }
        },
        mandal: {
          select: {
            id: true,
            name: true,       // Json — localize() handles
            address: true,
            city: true,
            state: true,
            image: true
          }
        },
        templeCopies: {
          where: { 
            status: true,
            temple: {
              isActive: true,
              user: { isVerified: true }
            }
          },
          include: {
            temple: {
              select: {
                id: true,
                name: true,
                location: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: { templeCopies: true }
        }
      }
    });

    let finalPoojas = poojas;

    // Case-insensitive filtering in JS
    if (search) {
      const lowQuery = String(search).toLowerCase();
      finalPoojas = poojas.filter((p: any) => {
        const nameEn = (p.name?.en || '').toLowerCase();
        const nameHi = (p.name?.hi || '').toLowerCase();
        const aboutEn = (p.about?.en || '').toLowerCase();
        const aboutHi = (p.about?.hi || '').toLowerCase();

        return nameEn.includes(lowQuery) || 
               nameHi.includes(lowQuery) || 
               aboutEn.includes(lowQuery) || 
               aboutHi.includes(lowQuery);
      });
    }

    // Deduplicate Poojas in the backend API for Global View by lowest price representation
    if (!templeId) {
      const resolvedList = finalPoojas.map(p => resolvePoojaLowestPriceInfo(p, location as string));

      const uniquePoojasMap = new Map();
      resolvedList.forEach((p: any) => {
        const nameVal = p.name?.en || p.name?.hi || '';
        const key = nameVal.toLowerCase().trim();
        if (!key) return;
        
        const existing = uniquePoojasMap.get(key);
        const isBetter = !existing || p.computedLowestPrice < existing.computedLowestPrice;
        
        if (isBetter) {
          uniquePoojasMap.set(key, p);
        }
      });
      finalPoojas = Array.from(uniquePoojasMap.values());
    }

    let favoritedPoojaIds = new Set<string>();

    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: userId,
          poojaId: { not: null }
        },
        select: { poojaId: true }
      });
      favorites.forEach(fav => {
        if (fav.poojaId) favoritedPoojaIds.add(fav.poojaId);
      });
    }

    const poojasWithFav = finalPoojas.map(pooja => ({
      ...pooja,
      isFavorite: favoritedPoojaIds.has(pooja.id)
    }));

    res.json({ success: true, data: localize(poojasWithFav, lang) });
  } catch (error) {
    console.error('Fetch poojas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch poojas' });
  }
};
