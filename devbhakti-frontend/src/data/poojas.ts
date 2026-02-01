
import aartiImg from "@/assets/poojas/aarti.jpg";
import bhogImg from "@/assets/poojas/bhog aarti.jpg";
import ganeshImg from "@/assets/poojas/ganesh_aarti.jpg";
import lakshmiImg from "@/assets/poojas/lakshmi pooja.jpg";
import manglaImg from "@/assets/poojas/mangla aarti.webp";
import rudraImg from "@/assets/poojas/rudra abhishek.jpg";
import sandhyaImg from "@/assets/poojas/sandhyaaarti.webp";
import satyaImg from "@/assets/poojas/satyanarayan puja.webp";
import ashleshaImg from "@/assets/poojas/ashlesha.jpg";

export const poojas = [
  {
    id: "1",
    name: "Mangala Aarti",
    price: 251,
    duration: "30 mins",
    templeId: 1, // Kashi Vishwanath
    description: [
      "Early morning blessing aarti",
      "Peaceful spiritual atmosphere",
      "Performed by experienced priests",
      "Includes mantras and rituals"
    ],
    category: "Aarti",
    time: "5:00 AM",
    image: manglaImg,
    about: "Mangala Aarti is the first ceremony of the day performed to awaken the deity. It is considered highly auspicious as it marks the beginning of the divine day.",
    benefits: [
      "Brings peace and mental clarity",
      "Corrects the morning routine with spiritual alignment",
      "Attracts positive energy for the entire day"
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "The ritual involves lighting of lamps, chanting of sacred mantras, and offering of flowers to the deity at dawn.",
    processSteps: [
      { title: "Select Puja Package", description: "Choose Basic or Family participation package" },
      { title: "Arrival at Temple", description: "Arrive 15 minutes before 5:00 AM timing" },
      { title: "Participation in Aarti", description: "Join the morning aarti with priests and devotees" },
      { title: "Receive Prasad", description: "Get sacred prasad after the ceremony" }
    ],
    templeDetails: "Available at most major Hindu temples. Usually starts between 4:00 AM and 5:30 AM.",
    packages: [
      { name: "Basic", price: 251, description: "Standard participation" },
      { name: "Family", price: 501, description: "Participation for up to 4 family members" }
    ],
    faqs: [
      { q: "What is the best time to arrive?", a: "It is recommended to arrive at least 15 minutes before the scheduled time." }
    ]
  },
  {
    id: "2",
    name: "Ashlesha Naag Bali Puja",
    price: 5100,
    duration: "3-4 hours",
    description: [
      "Removes Sarpa (Naga) Dosha effects",
      "Cleanses past negative karma",
      "Performed at sacred Gokarna Kshetra",
      "Brings peace and prosperity"
    ],
    category: "Special Puja",
    time: "On Request",
    image: ashleshaImg,
    templeId: 7, // Mahabaleshwar (Gokarna)
    templeIds: [7, 8, 1, 3, 2], // 5 temples connected for testing the UI
    about: "Participate in the First Ashlesha Nakshatra Gokarna Special Ashlesha Naga Bali Puja to remove the malicious effects of Sarpa (Naga) Dosha and clean karmic sins.\n\nLife stuck between obstacles and nightmares?\nAppease the powerful Serpent deities (Nagas) on this auspicious First Ashlesha Nakshatra of 2026 to end all your sufferings for the rest of the year.\n\nSarpa Doshas, also known as Naga Doshas, are seen as the result of divine displeasure and karmic links to serpent deities in past births. In Vedic astrology, Sarpa Doshas in a person’s horoscope are believed to bring various problems and obstacles in life. They are believed to cast a deep shadow over their life, silently disrupting relationships, causing painful delays in marriage, unexplained fertility problems, chronic illnesses, and financial losses. Left unaddressed, they can lead to repeated failures, emotional turmoil, and a life marked by suffering.\n\nSignificance of Ashlesha Nakshatra, and Ashlesha Naag Bali Puja:\nAshlesha Nakshatra is an important star in Vedic astrology, linked to serpent energy and known for transformation, hidden knowledge, and deep emotions. It is symbolised by a coiled serpent and is believed to be the most powerful time to perform remedies for Sarpa Dosha, as serpent energies are most active and receptive. The upcoming one is the first Ashlesha Nakshatra of 2026. So, during this special time, a powerful Ashlesha Naaga Bali puja is being organised to help reduce Sarpa Dosha and enter the new year with peace and prosperity.\n\nAshlesha Naag Bali is a powerful Vedic ritual performed to appease the divine Naga Devatas. When performed during this auspicious Nakshatra, it directly accesses and neutralises the negative effects of Sarpa Dosha in one's horoscope and is said to bring divine blessings into one's life. Offerings like milk, flowers, and rice that are favourite to the Naga Devatas are made on Vigrahas or Bimbas of Naga Devatas to appease them, enhancing prosperity, health, and peace.",
    benefits: [
      "Relief from Sarpa Dosha: Removes malefic effects causing delays in marriage, relationship issues, & chronic health conditions. Cleanses past-life karmas related to serpent energies.",
      "Healing Ancestral Karma: Brings peace to ancestral spirits and removes doshas caused by harm done to serpents in this or previous births.",
      "Blessings for Prosperity and Peace: Seeks blessings for good health, financial stability, inner peace, and overall well-being. Restores balance and brings harmony."
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "1. Select Puja: Choose from puja packages listed below.\n2. Add Offerings: Enhance your puja experience with optional offerings like Gau Seva, Deep Daan, Vastra Daan, and Anna Daan.\n3. Provide Sankalp details: Enter your Name and Gotra for the Sankalp.\n4. Puja Day Updates: All Sri Mandir devotees' pujas will be conducted collectively on the day of the puja. You will receive real-time updates on your registered WhatsApp number.",
    processSteps: [
      { title: "Select Puja Package", description: "Choose Individual or Family participation" },
      { title: "Add Optional Offerings", description: "Enhance with Gau Seva, Deep Daan, Vastra Daan, Anna Daan" },
      { title: "Provide Sankalp Details", description: "Enter your Name and Gotra for personalized sankalp" },
      { title: "Puja Day Updates", description: "Receive real-time WhatsApp updates on puja progress" },
      { title: "Receive Puja Completion", description: "Get photos, videos and digital prasad after completion" }
    ],
    templeDetails: "Gokarna kshetra, also known as South Kashi, is a sacred pilgrimage town in Karnataka, revered as one of the seven Mukti Kshetras. It is most famous for the Mahabaleshwar Temple, which houses the Atma Linga of Lord Shiva. The powerful spiritual energy of Gokarna, combined with its coastal serenity, makes it an ideal place for performing dosha parihara rituals, especially Ashlesha Bali Puja.",
    packages: [
      { name: "Individual", price: 5100, description: "Personalized puja for one individual" },
      { name: "Family", price: 11000, description: "Puja for complete family well-being" }
    ],
    faqs: [
      { q: "Why should I choose SriMandir for performing a Puja?", a: "SriMandir ensures authentic rituals performed by experienced pandits in sacred kshetras." },
      { q: "I don’t know my Gotra, what should I do?", a: "You can provide your name and Rashi (Moon sign) or simply say 'Kashyap Gotra' which is universal." },
      { q: "Who will perform the Puja?", a: "Experienced Vedic Pandits from the specific Kshetra will perform the puja." },
      { q: "What will be done in this Puja?", a: "Sankalp, Ganesh Puja, Naga Devata invocation, Naag Bali ritual, and Homa." },
      { q: "How will I know the Puja has been done in my name?", a: "We will share photos and videos of the puja performed with your name and sankalp." },
      { q: "What will I get after the Puja is done?", a: "You will receive digital blessings and photos/videos. Digital Prasad is also available." },
      { q: "What are the other services offered by Sri Mandir?", a: "We offer various Pujas, Chanda, and Daan services across major temples in India." },
      { q: "Where can I contact for more information?", a: "You can contact our support team via WhatsApp or email." },
      { q: "Will I get the 80G exemption after availing Daan Services through SriMandir?", a: "Yes, for specific Daan services, 80G receipts are available upon request." }
    ],
    reviews: [
      { name: "Achutam Nair", location: "Bangalore", message: "Performed with great devotion. Felt very peaceful.", rating: 5 },
      { name: "Ramesh Chandra Bhatt", location: "Nagpur", message: "Excellent arrangement and timely updates.", rating: 5 },
      { name: "Aperna Mal", location: "Puri", message: "Very authentic experience. Highly recommended.", rating: 5 },
      { name: "Shivraj Dobhi", location: "Agra", message: "Good service and transparent process.", rating: 4 },
      { name: "Mukul Raj", location: "Lucknow", message: "Thank you for conducting this puja for us.", rating: 5 }
    ]
  },
  
  {
    id: "3",
    name: "Sandhya Aarti",
    price: 351,
    duration: "30 mins",
    description: [
      "Performed at sunset twilight",
      "Marks transition of day to night",
      "Deeply meditative experience",
      "Ends the day with gratitude"
    ],
    category: "Aarti",
    time: "7:00 PM",
    image: sandhyaImg,
    about: "Sandhya Aarti is performed at dusk, marking the transition from day to night. It is a time for reflection and evening devotion.",
    benefits: [
      "Removes the stress and fatigue of the day",
      "Spiritual purification before the night",
      "Brings harmony to the household"
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "A beautiful display of lamps and rhythmic chanting during the evening twilight.",
    processSteps: [
      { title: "Book Evening Slot", description: "Reserve your 7:00 PM Sandhya Aarti slot" },
      { title: "Arrival Preparation", description: "Arrive by 6:45 PM for peaceful seating" },
      { title: "Participate in Aarti", description: "Join the sunset lamp ceremony with devotional chants" },
      { title: "Evening Prasad", description: "Receive blessed prasad after the aarti" }
    ],
    templeDetails: "Performed every evening as the sun sets.",
    packages: [
      { name: "General", price: 351, description: "Evening prayer participation" }
    ],
    faqs: []
  },
  {
    id: "4",
    name: "Shringar Aarti",
    price: 751,
    duration: "1 hour",
    description: [
      "Divine decoration of the deity",
      "Uses flowers, jewels and silks",
      "Visual feast for the devotees",
      "Celebrates divine beauty"
    ],
    category: "Aarti",
    time: "9:00 PM",
    image: aartiImg,
    about: "Shringar Aarti focuses on the decoration and beautification of the deity with jewels, flowers, and fine clothing.",
    benefits: [
      "Appreciation of the divine beauty",
      "Enhances aesthetic sense and devotion",
      "Attracts grace and charm into life"
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "The deity is adorned with special garments and ornaments followed by a grand aarti.",
    processSteps: [
      { title: "Select Premium Package", description: "Choose the special flower offering package" },
      { title: "Evening Arrival", description: "Arrive by 8:45 PM for the 9:00 PM ceremony" },
      { title: "Witness Shringar", description: "Watch the divine decoration with jewels and flowers" },
      { title: "Grand Aarti", description: "Participate in the final aarti of the day" },
      { title: "Special Blessings", description: "Receive enhanced prasad and divine blessings" }
    ],
    templeDetails: "Usually the last major aarti of the day before the deity rests.",
    packages: [
      { name: "Premium", price: 751, description: "Includes special flower offering" }
    ],
    faqs: []
  },
  {
    id: "5",
    name: "Rudrabhishek",
    price: 1100,
    duration: "2 hours",
    templeId: 8, // Trimbakeshwar
    description: [
      "Powerful bathing of Shiva Linga",
      "Uses milk, honey, and sacred water",
      "Chanting of ancient Rudram",
      "Removes negativity and obstacles"
    ],
    category: "Abhishekam",
    time: "On Request",
    image: rudraImg,
    about: "Rudrabhishek is a powerful ritual dedicated to Lord Shiva, involving the bathing of the Shiva Linga with various sacred substances.",
    benefits: [
      "Fulfills desires and removes obstacles",
      "Brings health, wealth, and prosperity",
      "Protects from negative influences"
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "The Shiva Linga is bathed with milk, honey, ghee, curd, and water while chanting the Shri Rudram.",
    templeDetails: "Can be booked specifically with the temple's head priest.",
    packages: [
      { name: "Individual", price: 1100, description: "One person participation" },
      { name: "Sankalpa", price: 2100, description: "With specific prayer focus" }
    ],
    faqs: []
  },
  {
    id: "6",
    name: "Satyanarayan Pooja",
    price: 2100,
    duration: "3 hours",
    description: [
      "Dedicated to Lord Vishnu",
      "Ensures family well-being",
      "Includes Katha and Prasad",
      "Brings truth and abundance"
    ],
    category: "Pooja",
    time: "Flexible",
    image: satyaImg,
    about: "Satyanarayan Pooja is a popular householder ritual performed to thank the Lord for success and happiness.",
    benefits: [
      "Brings family together in devotion",
      "Invites truth and prosperity into the home",
      "Commemorates milestones and achievements"
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "Involves reading the Satyanarayan Katha and offering special Prasad.",
    templeDetails: "Performed on Purnima (full moon) days or special occasions.",
    packages: [
      { name: "Standard", price: 2100, description: "Complete ceremony services" }
    ],
    faqs: []
  },
  {
    id: "7",
    name: "Ganesh Pooja",
    price: 551,
    duration: "1 hour",
    templeId: 3, // Siddhivinayak
    description: [
      "Remover of all obstacles",
      "Best for new beginnings",
      "Enhances wisdom and intellect",
      "Traditional Vedic ritual"
    ],
    category: "Pooja",
    time: "Flexible",
    image: ganeshImg,
    about: "Ganesh Pooja is performed to seek the blessings of the remover of obstacles before any new beginning.",
    benefits: [
      "Ensures success in new ventures",
      "Wisdom and intellectual growth",
      "Protection from hurdles"
    ],
    bullets: ["blessing", "Prosperity", "Peace", "Balance", "Harmony"],
    process: "Invocation of Lord Ganesha followed by offerings of Modaks and flowers.",
    templeDetails: "Can be performed at any time, especially on Wednesdays.",
    packages: [
      { name: "Basic", price: 551, description: "Initial prayer offering" }
    ],
    faqs: []
  },
  {
    id: "8",
    name: "Lakshmi Pooja",
    price: 1501,
    duration: "2 hours",
    description: [
      "Invokes Goddess of Wealth",
      "Brings financial prosperity",
      "Removes misfortune",
      "Blesses home with abundance"
    ],
    category: "Pooja",
    time: "Flexible",
    image: lakshmiImg,
    about: "Lakshmi Pooja is dedicated to the Goddess of Wealth and Prosperity, seeking her continuous presence in the home.",
    benefits: [
      "Financial stability and growth",
      "Good fortune and luxury",
      "Peace and well-being"
    ],
    process: "Adoration of Goddess Lakshmi with 108 names, lotus flowers, and coins.",
    templeDetails: "Highly recommended during Diwali and Fridays.",
    packages: [
      { name: "Standard", price: 1501, description: "Properity ritual services" }
    ],
    faqs: []
  },
  {
    id: "9",
    name: "Bhog Aarti",
    price: 501,
    duration: "45 mins",
    description: [
      "Sacred food offering ritual",
      "Gratitude for nourishment",
      "Divine mid-day blessings",
      "Sanctified prasad distribution"
    ],
    category: "Aarti",
    time: "11:00 AM",
    image: bhogImg,
    about: "Bhog Aarti is performed during the mid-day meal offering to the deity. It signifies the provider role of the divine.",
    benefits: [
      "Ensures prosperity and abundance",
      "Gratitude for the food and health provided",
      "Strengthens the bond with the divine"
    ],
    process: "Special food (Bhog) is prepared and offered with chants and traditional music.",
    templeDetails: "Held in the main sanctum of the temple during the noon hours.",
    packages: [
      { name: "Standard", price: 501, description: "General offering participation" }
    ],
    faqs: [
      { q: "Can we bring our own offerings?", a: "Each temple has its own rules; please check with the temple authorities." }
    ]
  },
];
