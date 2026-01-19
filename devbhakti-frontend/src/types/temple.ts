
import { StaticImageData } from "next/image";

export interface Pooja {
  id?: string;
  name: string;
  price: number;
  time?: string;
  duration?: string;
  benefits?: string[];
  description?: string[];
  image?: StaticImageData | string;
  category?: string;
}

export interface TempleEvent {
  name: string;
  date: string;
}

export interface Temple {
  id: number;
  name: string;
  location: string;
  fullAddress?: string;
  description: string;
  history?: string;
  image: StaticImageData | string;
  heroImages?: (StaticImageData | string)[];
  gallery?: (StaticImageData | string)[];
  rating: number;
  reviews: number;
  category: string; // e.g., "Shiva", "Vishnu"
  liveStatus: boolean;
  openTime: string;
  phone?: string;
  website?: string;
  mapUrl?: string;
  viewers?: string; // For Live Darshan
  poojas?: Pooja[]; // Nested poojas for display efficiency on detail page
  upcomingEvents?: TempleEvent[];
}
