# DevBhakti VPS Deployment - IP Address Fix

## Problem समझना
जब आप VPS पर IP address (147.93.27.62:5000) से access कर रहे थे, तो middleware IP को subdomain के रूप में समझ रहा था और किसी भी path को main domain पर redirect कर रहा था।

## Solution
हमने middleware और templeUtils को update किया है ताकि वे IP addresses को main domain के रूप में पहचानें।

## VPS पर Deploy करने के steps:

### 1. Backend को update करें (अगर जरूरी हो)
```bash
cd /var/www/devbhakti
git pull origin master
```

### 2. Frontend को update करें
```bash
cd /var/www/devbhakti/devbhakti-frontend
git pull origin master
npm install  # अगर नई dependencies हों
npm run build
```

### 3. PM2 reload करें
```bash
pm2 reload devbhakti-frontend
```

### 4. Logs check करें
```bash
pm2 logs devbhakti-frontend --lines 50
```

## Testing

### Test करें:
1. Browser में जाएं: `http://147.93.27.62:5000`
2. कोई भी temple पर click करें
3. अब `/poojas`, `/booking` जैसे links click करें
4. Links अब same domain (147.93.27.62:5000) पर काम करने चाहिए

### Subdomain testing (production में):
1. जब आप proper domain setup करेंगे (जैसे devbhakti.in)
2. तब subdomain `kashi.devbhakti.in` पर:
   - `/` (root) temple profile दिखाएगा
   - किसी भी दूसरे path को main domain पर redirect करेगा (auth/cart sharing के लिए)

## Future: Domain setup के बाद

जब आप proper domain connect करेंगे:
1. DNS में A record add करें: `devbhakti.in` → `147.93.27.62`
2. Wildcard subdomain add करें: `*.devbhakti.in` → `147.93.27.62`
3. Environment variables update करें if needed
4. SSL certificate setup करें (Let's Encrypt)

## Notes:
- IP address access अब properly काम करेगा
- Subdomain functionality domain setup के बाद activate होगी
- Middleware automatically detect करेगा कि IP vs subdomain क्या है
