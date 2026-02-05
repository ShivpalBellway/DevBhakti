import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Simple in-memory cache to prevent quota exhaustion
// Key: channelId, Value: { videoId: string | null, timestamp: number }
const cache: Record<string, { videoId: string | null; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Key: videoId, Value: { isLive: boolean, timestamp: number }
const videoLiveCache: Record<string, { isLive: boolean; timestamp: number }> = {};
const VIDEO_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const extractYouTubeChannelId = (input?: string | null): string | null => {
    if (!input) return null;
    const s = String(input).trim();
    if (!s) return null;

    // Raw Channel ID (common): UCxxxxxxxxxxxxxxxxxxxxxx
    if (/^UC[\w-]{20,}$/i.test(s) && !s.includes('/') && !s.includes('.')) {
        return s;
    }

    // URLs containing /channel/UC...
    const channelMatch = s.match(/\/channel\/(UC[\w-]{20,})/i);
    if (channelMatch?.[1]) return channelMatch[1];

    return null;
};

export const extractYouTubeVideoId = (input?: string | null): string | null => {
    if (!input) return null;
    const s = String(input).trim();
    if (!s) return null;

    // Raw video id
    if (/^[\w-]{11}$/.test(s)) return s;

    // watch?v=VIDEOID
    const watchMatch = s.match(/[?&]v=([\w-]{11})/);
    if (watchMatch?.[1]) return watchMatch[1];

    // youtu.be/VIDEOID
    const shortMatch = s.match(/youtu\.be\/([\w-]{11})/);
    if (shortMatch?.[1]) return shortMatch[1];

    // /embed/VIDEOID
    const embedMatch = s.match(/\/embed\/([\w-]{11})/);
    if (embedMatch?.[1]) return embedMatch[1];

    // /live/VIDEOID
    const liveMatch = s.match(/\/live\/([\w-]{11})/);
    if (liveMatch?.[1]) return liveMatch[1];

    return null;
};

export const isYouTubeVideoLive = async (videoId: string): Promise<boolean> => {
    if (!YOUTUBE_API_KEY) {
        console.warn("YOUTUBE_API_KEY is not set.");
        return false;
    }

    const id = (videoId || '').trim();
    if (!id) return false;

    const cached = videoLiveCache[id];
    if (cached && (Date.now() - cached.timestamp < VIDEO_CACHE_DURATION)) {
        return cached.isLive;
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${id}&key=${YOUTUBE_API_KEY}`;
        const response = await axios.get(url);
        const item = response.data?.items?.[0];

        const details = item?.liveStreamingDetails;
        const actualStartTime = details?.actualStartTime;
        const actualEndTime = details?.actualEndTime;

        const isLive = Boolean(actualStartTime) && !actualEndTime;
        videoLiveCache[id] = { isLive, timestamp: Date.now() };
        return isLive;
    } catch (error: any) {
        console.error(`YouTube API Error for video ${id}:`, error.message);
        return false;
    }
};

export const getLiveVideoForChannel = async (channelId: string): Promise<string | null> => {
    if (!YOUTUBE_API_KEY) {
        console.warn("YOUTUBE_API_KEY is not set.");
        return null;
    }

    // Check cache
    const cached = cache[channelId];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.videoId;
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.items && response.data.items.length > 0) {
            const videoId = response.data.items[0].id.videoId;
            // Update cache
            cache[channelId] = { videoId, timestamp: Date.now() };
            return videoId;
        } else {
            // No live video found
            cache[channelId] = { videoId: null, timestamp: Date.now() };
            return null;
        }
    } catch (error: any) {
        console.error(`YouTube API Error for channel ${channelId}:`, error.message);
        // On error, return null but don't aggressively cache errors (maybe short cache?)
        return null;
    }
};
