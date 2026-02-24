# DevBhakti Notification System - Project Summary

Is document mein DevBhakti ke real-time notification system ki puri jaankari di gayi hai.

---

## 🌟 1. Non-Technical Summary (Aasaan Bhasha Mein)

**Goal:** Jab bhi koi Devotee naya order place kare, Admin ko turant pata chal jaye bina page refresh kiye.

### Kaise Kaam Karta Hai?
1. **Real-time Alert:** Jaise hi order confirm hota hai, Admin ke computer/browser par ek pop-up (Toast) aata hai.
2. **Notification Sound:** Pop-up ke saath ek "Ding" ki awaaz aati hai taaki Admin ka dhyan turant jaye.
3. **Sticky Pop-ups:** Ye pop-ups apne aap nahi gayab hote. Admin ko khud "Close" karna padta hai ya "Dekho" par click karke order details dekhni hoti hai.
4. **Bell Icon (Ghanti):** Admin panel ke upar ek ghanti ka icon hai. Agar Admin screen ke samne nahi hai, toh wahan laal rang mein "Unread Count" (jaise 1, 2, 5) badh jata hai.
5. **History:** Ghanti par click karke Admin purane sare notifications ki list dekh sakta hai aur unhe "Mark as Read" kar sakta hai.

## 🔔 2. Kon se Actions par Notification jayega? (Triggers & Recipients)

Abhi system mein niche diye gaye actions par notifications set hain:

### 1. Naya Order Place Hona (Marketplace)
Jab koi Devotee product kharidta hai aur payment successful hoti hai:
- **Admin ko:** "New Master Order! 📢" (Pure order ki detail milti hai).
- **Temple / Seller ko:** "New Sub-order Received! 📦" (Unke specific products ka order notification).
- **Devotee ko:** "Order Placed Successfully! 🎉" (Confirmation message).

### 2. Notification Type & Sound
- Sabhi ko **Sound (Ding)** sunai dega.
- Sabhi ke **Bell Icon** mein count badhega.
- Sabhi ko **Sticky Toast (Pop-up)** dikhega (bina page refresh kiye).

---

## 🛠️ 3. Technical Summary (For Developers)

Hamne **Firebase Cloud Messaging (FCM)** aur **Firebase Admin SDK** ka upyog kiya hai.

### A. Infrastructure & Configuration
- **Firebase Project:** `devbhakti-c7132`
- **Frontend Keys:** `.env` file mein sahi API Keys, Sender ID aur VAPID Key set ki gayi hain.
- **Backend Auth:** Service Account JSON file (`devbhakti-c7132-firebase-adminsdk...json`) ko backend ke root mein rakha gaya hai taaki server Firebase se connect ho sake.

### B. Core Flow (Kahan Kya Laga Hai?)
1. **Token Registration (`frontend/src/hooks/useNotifications.ts`):** 
   - User jab login karta hai, browser ek unique "FCM Token" generate karta hai.
   - Ye token `/api/notifications/register-token` endpoint ke zariye database mein save hota hai.
   
2. **Trigger Point (`backend/src/controllers/marketplace/productOrderController.ts`):**
   - `createVerifiedOrder` function ke andar `notifyAdmins()` ko call kiya gaya hai.
   - Jaise hi payment verify hoti hai, ye function trigger hota hai.

3. **Notification Engine (`backend/src/services/firebaseService.ts`):**
   - **`notifyAdmins`**: Sabhi users jinka role 'ADMIN' hai, unhe dhundta hai.
   - **`notifyUser`**: Notification ko database (Prisma) mein save karta hai (Bell icon ke liye) aur phir FCM ke zariye push message bhejta hai.

4. **Real-time UI Update (`frontend/src/components/notifications/NotificationBell.tsx`):**
   - Ye component `onMessage` listener ka use karta hai.
   - Jab naya message aata hai, ye automatic 1.5 second ka delay lekar `fetchNotifications` call karta hai taaki Bell count update ho jaye.

### C. Major Fixes Done
- **401 Unauthorized Fix:** VAPID key aur configuration keys ko format kiya gaya.
- **Service Account Path:** Backend ko sahi rasta bataya gaya taaki woh root folder se JSON key file utha sake.
- **Sound & Persistence:** `useNotifications` hook mein `Audio` API add ki aur `sonner` toast ki duration `Infinity` set ki.

---

## 📁 Key Files Involved
- **Frontend:**
  - `src/lib/fcm.ts`: FCM logic/Permissions.
  - `src/lib/firebase.ts`: Firebase Init.
  - `src/hooks/useNotifications.ts`: Global notification handler.
  - `src/components/notifications/NotificationBell.tsx`: UI Ghanti component.
- **Backend:**
  - `src/services/firebaseService.ts`: Main logic engine.
  - `src/routes/notificationRoutes.ts`: API Endpoints for Register/Fetch.
  - `prisma/schema.prisma`: `FCMToken` aur `Notification` models.
