import { Temple } from "@/types/temple";

// Import Main Temple Images
import templeKashi from "@/assets/temple-kashi.jpg";
import templeTirupati from "@/assets/temple-tirupati.jpg";
import templeSiddhivinayak from "@/assets/temple-siddhivinayak.jpg";
import templeMeenakshi from "@/assets/temple-meenakshi.jpg";
import templeJagannath from "@/assets/temple-jagannath.jpg";
import templeSomnath from "@/assets/temple-somnath.jpg";

// Import Gallery/Hero Images
// Note: In a real app, these might come from a CMS or CDN.
import Kashi1 from "@/assets/temples/Kashi Vishwanath Banner 1.png";
import Kashi2 from "@/assets/temples/Kashi Vishwanath Banner 2.png";
import Kashi3 from "@/assets/temples/Kashi Vishwanath Banner 3.png";
import Kashi4 from "@/assets/temples/KashiVishwanathTemple (4).jpeg";
import Kashi5 from "@/assets/temples/KashiVishwanathTemple (5).jpeg";

import Tirupati1 from "@/assets/temples/TirupatiBalajiTemple1.jpg";
import Tirupati2 from "@/assets/temples/TirupatiBalajiTemple2.jpg";

import Siddhi1 from "@/assets/temples/SiddhivinayakTemple1.webp";
import Siddhi2 from "@/assets/temples/SiddhivinayakTemple2.webp";
import Siddhi3 from "@/assets/temples/SiddhivinayakTemple3.webp";
import Siddhi4 from "@/assets/temples/SiddhivinayakTemple4.jpg";

export const temples: Temple[] = [
  {
    id: 1,
    name: "Kashi Vishwanath Temple",
    location: "Varanasi, Uttar Pradesh",
    fullAddress: "Lahori Tola, Varanasi, Uttar Pradesh 221001",
    description: "The Kashi Vishwanath Temple is one of the most famous Hindu temples dedicated to Lord Shiva. It is located in Vishwanath Gali of Varanasi, Uttar Pradesh, India. The temple stands on the western bank of the holy river Ganga, and is one of the twelve Jyotirlingas.",
    history: "The temple has been referenced in Hindu scriptures for a very long time as a central part of worship in the Shaiva philosophy. The original Vishwanath temple was destroyed by the army of Qutb-ud-din Aibak in 1194 CE. The temple was rebuilt by a Gujarati merchant, but was demolished again during the reign of Mughal emperor Aurangzeb.",
    image: templeKashi,
    heroImages: [Kashi1, Kashi2, Kashi3, Kashi4, Kashi5],
    gallery: [Kashi1, Kashi2, Kashi3, Kashi4, Kashi5],
    rating: 4.9,
    reviews: 12500,
    category: "Shiva",
    liveStatus: true,
    viewers: "12.5K",
    openTime: "4:00 AM - 11:00 PM",
    phone: "+91 542 239 2629",
    website: "https://shrikashivishwanath.org",
    mapUrl: "https://maps.app.goo.gl/Xy6awaBzAhxCKQHz8",
    poojas: [
        { name: "Mangala Aarti", time: "3:00 AM", price: 251, benefits: ["Early morning blessing aarti", "Peaceful spiritual atmosphere", "Performed by experienced priests", "Includes mantras and rituals"] },
        { name: "Bhog Aarti", time: "11:15 AM", price: 501, benefits: ["Mid-day offering aarti", "Divine mid-day blessings", "Sanctified prasad distribution"] },
        { name: "Sandhya Aarti", time: "7:00 PM", price: 351, benefits: ["Evening prayer aarti", "Divine evening blessings", "Sanctified prasad distribution"] },
        { name: "Shringar Aarti", time: "9:00 PM", price: 751, benefits: ["Divine decoration of the deity", "Uses flowers, jewels and silks", "Visual feast for the devotees", "Celebrates divine beauty"] },
        { name: "Rudrabhishek", time: "On Request", price: 1100, benefits: ["Powerful bathing of Shiva Linga", "Uses milk, honey, and sacred water", "Chanting of ancient Rudram", "Removes negativity and obstacles"] },
    ],
    upcomingEvents: [
        { name: "Maha Shivaratri", date: "March 8, 2025" },
        { name: "Shravan Month", date: "July 2025" },
        { name: "Dev Deepawali", date: "November 2025" },
    ]
  },
  {
    id: 2,
    name: "Tirupati Balaji Temple",
    location: "Tirupati, Andhra Pradesh",
    fullAddress: "Tirumala, Tirupati, Andhra Pradesh 517504",
    description: "Dedicated to Lord Venkateswara, an incarnation of Vishnu. It is one of the richest and most visited religious centers in the world.",
    image: templeTirupati,
    heroImages: [Tirupati1, Tirupati2],
    gallery: [Tirupati1, Tirupati2],
    rating: 4.8,
    reviews: 25000,
    category: "Vishnu",
    liveStatus: true,
    viewers: "28.3K",
    openTime: "3:00 AM - 12:00 AM",
    poojas: [
        { name: "Mangala Aarti", time: "3:00 AM", price: 251, benefits: ["Early morning blessing aarti", "Peaceful spiritual atmosphere", "Performed by experienced priests", "Includes mantras and rituals"] },
        { name: "Bhog Aarti", time: "11:15 AM", price: 501, benefits: ["Mid-day offering aarti", "Divine mid-day blessings", "Sanctified prasad distribution"] },
        { name: "Sandhya Aarti", time: "7:00 PM", price: 351, benefits: ["Evening prayer aarti", "Divine evening blessings", "Sanctified prasad distribution"] },
        { name: "Shringar Aarti", time: "9:00 PM", price: 751, benefits: ["Divine decoration of the deity", "Uses flowers, jewels and silks", "Visual feast for the devotees", "Celebrates divine beauty"] },
        { name: "Rudrabhishek", time: "On Request", price: 1100, benefits: ["Powerful bathing of Shiva Linga", "Uses milk, honey, and sacred water", "Chanting of ancient Rudram", "Removes negativity and obstacles"] },
    ],
    upcomingEvents: [
        { name: "Brahmotsavam", date: "October 2025" },
        { name: "Vaikunta Ekadashi", date: "December 2025" },
    ]
  },
  {
    id: 3,
    name: "Siddhivinayak Temple",
    location: "Mumbai, Maharashtra",
    fullAddress: "Prabhadevi, Mumbai, Maharashtra 400028",
    description: "Mumbai's most revered Ganesha temple, known for granting the wishes of devotees. The temple has a beautiful gold-plated dome and inner roof.",
    image: templeSiddhivinayak,
    heroImages: [Siddhi1, Siddhi2, Siddhi3, Siddhi4],
    gallery: [Siddhi1, Siddhi2, Siddhi3, Siddhi4],
    rating: 4.7,
    reviews: 8900,
    category: "Ganesha",
    liveStatus: false,
    openTime: "5:30 AM - 10:00 PM",
    upcomingEvents: [
        { name: "Ganesh Chaturthi", date: "September 2025" },
        { name: "Maghi Ganesh Jayanti", date: "January 2026" },
    ]
  },
  {
    id: 4,
    name: "Meenakshi Amman Temple",
    location: "Madurai, Tamil Nadu",
    fullAddress: "Madurai Main, Madurai, Tamil Nadu 625001",
    description: "A masterpiece of Dravidian architecture dedicated to Goddess Meenakshi.",
    history: "The temple has been referenced in Hindu scriptures for a very long time as a central part of worship in the Shaiva philosophy. The original Vishwanath temple was destroyed by the army of Qutb-ud-din Aibak in 1194 CE. The temple was rebuilt by a Gujarati merchant, but was demolished again during the reign of Mughal emperor Aurangzeb.",
    image: templeMeenakshi,
    heroImages: [templeMeenakshi],
    gallery: [templeMeenakshi],
    rating: 4.9,
    reviews: 15600,
    category: "Shakti",
    liveStatus: true,
    openTime: "5:00 AM - 12:30 PM",
    poojas: [
        { name: "Kumkum Archana", time: "Every Friday", price: 101, benefits: ["Divine blessings", "Prosperity"] }
    ],
    upcomingEvents: []
  },
  {
    id: 5,
    name: "Jagannath Temple",
    location: "Puri, Odisha",
    fullAddress: "Grand Road, Puri, Odisha 752001",
    description: "One of the Char Dham pilgrimage sites, famous for its annual Ratha Yatra.",
    image: templeJagannath,
    heroImages: [templeJagannath],
    gallery: [templeJagannath],
    rating: 4.8,
    reviews: 11200,
    category: "Vishnu",
    liveStatus: false,
    openTime: "5:00 AM - 11:00 PM",
    poojas: [
        { name: "Ratha Yatra Special", time: "Once a year", price: 5001, benefits: ["Moksha", "Divine Grace"] }
    ],
    upcomingEvents: []
  },
  {
    id: 6,
    name: "Somnath Temple",
    location: "Somnath, Gujarat",
    fullAddress: "Somnath Mandir Rd, Veraval, Gujarat 362268",
    description: "The eternal shrine and first of the twelve Jyotirlingas on the Gujarat coast.",
    image: templeSomnath,
    heroImages: [templeSomnath],
    gallery: [templeSomnath],
    rating: 4.9,
    reviews: 9800,
    category: "Shiva",
    liveStatus: true,
    viewers: "8.7K",
    openTime: "6:00 AM - 9:00 PM",
    poojas: [
        { name: "Somnath Aarti", time: "7:00 PM", price: 251, benefits: ["Peace", "Prosperity"] }
    ],
    upcomingEvents: []
  },
  {
    id: 7,
    name: "Mahabaleshwar Temple",
    location: "Gokarna, Karnataka",
    fullAddress: "Koti Teertha Rd, Gokarna, Karnataka 581326",
    description: "The Mahabaleshwar Temple, Gokarna is a 4th-century CE Hindu temple located in Gokarna, Uttara Kannada district, Karnataka state, India.",
    image: "https://templeinkarnataka.com/wp-content/uploads/2024/08/Mahabaleshwara-Temple1.png",
    heroImages: ["https://templeinkarnataka.com/wp-content/uploads/2024/08/Mahabaleshwara-Temple1.png"],
    gallery: ["https://templeinkarnataka.com/wp-content/uploads/2024/08/Mahabaleshwara-Temple1.png"],
    rating: 4.7,
    reviews: 5400,
    category: "Shiva",
    liveStatus: false,
    openTime: "6:00 AM - 8:00 PM",
    poojas: [
        { name: "Rudra Homa", time: "Morning", price: 1500, benefits: ["Health", "Wealth"] }
    ],
    upcomingEvents: []
  },
  {
    id: 8,
    name: "Trimbakeshwar Temple",
    location: "Nashik, Maharashtra",
    fullAddress: "Trimbak, Nashik, Maharashtra 422212",
    description: "Trimbakeshwar Shiva Temple is an ancient Hindu temple in the town of Trimbak, in the Trimbakeshwar tehsil in the Nashik District of Maharashtra, India.",
    image: "https://www.captureatrip.com/_next/image?url=https%3A%2F%2Fd1zvcmhypeawxj.cloudfront.net%2Flocation%2FOther%20-%20Domestic%2Fblogs%2Fbiggest-temple-in-india-d33a1783c8-aeih7m-webp-dc4ccf1764-1752061684761.webp&w=3840&q=75",
    heroImages: ["https://www.captureatrip.com/_next/image?url=https%3A%2F%2Fd1zvcmhypeawxj.cloudfront.net%2Flocation%2FOther%20-%20Domestic%2Fblogs%2Fbiggest-temple-in-india-d33a1783c8-aeih7m-webp-dc4ccf1764-1752061684761.webp&w=3840&q=75"],
    gallery: ["https://www.captureatrip.com/_next/image?url=https%3A%2F%2Fd1zvcmhypeawxj.cloudfront.net%2Flocation%2FOther%20-%20Domestic%2Fblogs%2Fbiggest-temple-in-india-d33a1783c8-aeih7m-webp-dc4ccf1764-1752061684761.webp&w=3840&q=75"],
    rating: 4.8,
    reviews: 18000,
    category: "Shiva",
    liveStatus: false,
    openTime: "5:30 AM - 9:00 PM",
    poojas: [
        { name: "Kaal Sarp Dosh Puja", time: "flexible", price: 2100, benefits: ["Removal of obstacles"] }
    ],
    upcomingEvents: []
  },
];
