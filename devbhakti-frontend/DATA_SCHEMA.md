# Project Data Schema Documentation

This document references the structure of the static data currently used in the project for **Temples**, **Poojas**, and **Marketplace Items**. 
It serves as a guide for understanding the data models and their inconsistencies across the application.

## 1. Temples

**Sources:**
- `src/data/poojas.ts` (Used for linking with Poojas)
- `src/components/landing/TemplesSection.tsx` (Used for UI display)
- `src/components/landing/LiveDarshanSection.tsx` (Used for Live Darshan previews)

**Current Schema Analysis:**
There are multiple definitions of "Temple" data across the codebase, with varying fields and ID types.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | `poojas.ts` | e.g., `"t1"`, `"t2"` |
| `id` | `number` | `TemplesSection.tsx`, `TempleDetailClient.tsx` | e.g., `1`, `2` |
| `name` | `string` | All | Name of the temple |
| `location` | `string` | All | City, State (e.g., "Varanasi, Uttar Pradesh") |
| `fullAddress` | `string` | `TempleDetailClient.tsx` | Complete postal address |
| `description` | `string` | All | Brief description |
| `history` | `string` | `TempleDetailClient.tsx` | Historical background (separate from description) |
| `image` | `string` \| `StaticImageData` | All | Main display image |
| `heroImages` | `any[]` | `TempleDetailClient.tsx` | Array of images for the top carousel |
| `gallery` | `any[]` | `TempleDetailClient.tsx` | Array of images for the gallery tab |
| `rating` | `number` | `TemplesSection.tsx`, `TempleDetailClient.tsx` | User rating (e.g., 4.9) |
| `reviews` | `number` | `TemplesSection.tsx`, `TempleDetailClient.tsx` | Count of reviews |
| `category` | `string` | `TemplesSection.tsx` | e.g., "Shiva", "Vishnu" |
| `liveStatus` | `boolean` | `TemplesSection.tsx`, `TempleDetailClient.tsx` | Whether live darshan is available |
| `openTime` | `string` | `TemplesSection.tsx`, `TempleDetailClient.tsx` | Opening hours (e.g., "4:00 AM - 11:00 PM") |
| `phone` | `string` (optional) | `TempleDetailClient.tsx` | Contact number |
| `website` | `string` (optional) | `TempleDetailClient.tsx` | Official website URL |
| `mapUrl` | `string` (optional) | `TempleDetailClient.tsx` | Google Maps URL |
| `viewers` | `string` | `LiveDarshanSection.tsx` | Viewer count (e.g., "12.5K") |
| `isLive` | `boolean` | `LiveDarshanSection.tsx` | Live status |
| `poojas` | `Object[]` | `TempleDetailClient.tsx` | **Inconsistency**: List of poojas *nested* inside the temple object. Contains `{ name, time, price, benefits }`. |
| `upcomingEvents` | `Object[]` | `TempleDetailClient.tsx` | List of events `{ name, date }`. |

**Critical Inconsistencies Identified:**
1.  **ID Mismatch**: `poojas.ts` uses string IDs ("t1"), while UI components use number IDs (1).
2.  **Data Duplication**: `TempleDetailClient.tsx` contains a hardcoded `temples` array that duplicates and extends data found elsewhere, instead of fetching from a central source.
3.  **Nested vs. Relational**: In `TempleDetailClient.tsx`, `poojas` are nested inside the temple object. In `poojas.ts`, `poojas` are separate entities linked by `templeId`.

**Note:** It is recommended to unify these into a single interface in `src/types` and centralized data in `src/data`.

---

## 2. Poojas

**Source:** `src/data/poojas.ts`

**Current Schema:**
The data is centralized in `src/data/poojas.ts` but has a rich, nested structure.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., `"1"`) |
| `name` | `string` | Name of the Pooja |
| `category` | `string` | e.g., "Aarti", "Abhishekam" |
| `price` | `number` | Base price in INR |
| `duration` | `string` | e.g., "30 mins", "2 hours" |
| `description` | `string[]` | Array of short descriptive points |
| `time` | `string` | Scheduled time (e.g., "5:00 AM", "Flexible") |
| `image` | `string` \| `StaticImageData` | Image source |
| `about` | `string` | Detailed long-form description |
| `benefits` | `string[]` | List of spiritual benefits |
| `bullets` | `string[]` | (Optional) Short tags like "Peace", "Prosperity" |
| `process` | `string` | Summary of the ritual process |
| `processSteps` | `ProcessStep[]` | Detailed steps (see sub-type below) |
| `templeId` | `string` | References Temple ID (maps to definitions in `poojas.ts`) |
| `templeIds` | `string[]` | (Optional) List of linked temple IDs |
| `templeDetails` | `string` | Specific availability or context for the temple |
| `packages` | `Package[]` | Pricing tiers (see sub-type below) |
| `faqs` | `FAQ[]` | Frequently asked questions |
| `reviews` | `Review[]` | (Optional) User reviews |

**Sub-Types:**

**ProcessStep**
```typescript
{
  title: string;
  description: string;
}
```

**Package**
```typescript
{
  name: string;      // e.g., "Basic", "Family"
  price: number;     // e.g., 501
  description: string;
}
```

**FAQ**
```typescript
{
  q: string;
  a: string;
}
```

**Review**
```typescript
{
  name: string;
  location: string;
  message: string;
  rating: number;
}
```

---

## 3. Marketplace Items

**Source:** `src/components/landing/MarketplaceSection.tsx`

**Current Schema:**
Defined locally within the component.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Product name |
| `temple` | `string` | Name of the source temple (not ID) |
| `price` | `string` | Formatted price string (e.g., "₹1,299") |
| `rating` | `number` | Product rating |
| `image` | `StaticImageData` | Product image |
| `badge` | `string` | Promotional badge (e.g., "Bestseller") |
