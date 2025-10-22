import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import floorplan1 from "@/assets/property-1-floorplan.jpg";
import buildingGym from "@/assets/building-gym.jpg";
import buildingLobby from "@/assets/building-lobby.jpg";
import buildingPool from "@/assets/building-pool.jpg";

export type PropertyAvailabilityStatus = "available-now" | "not-available" | "date";

export interface PropertyAvailability {
  type: PropertyAvailabilityStatus;
  date?: string;
}

const AVAILABILITY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const formatAvailabilityDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, AVAILABILITY_DATE_OPTIONS);
};

export const getPropertyAvailabilityInfo = (availability?: PropertyAvailability) => {
  const type: PropertyAvailabilityStatus = availability?.type ?? "available-now";

  if (type === "available-now") {
    return {
      type,
      label: "Available now",
      description: "Move-in ready immediately.",
    };
  }

  if (type === "not-available") {
    return {
      type,
      label: "Currently not available",
      description: "Please reach out for future availability.",
    };
  }

  const formattedDate = formatAvailabilityDate(availability?.date);
  return {
    type,
    label: formattedDate ? `Available from ${formattedDate}` : "Available from date to be confirmed",
    description: formattedDate
      ? `This property will be ready from ${formattedDate}.`
      : "Select date pending confirmation.",
    formattedDate,
  };
};

export const getPropertyAvailabilityBadgeClasses = (type: PropertyAvailabilityStatus) => {
  switch (type) {
    case "available-now":
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    case "not-available":
      return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    case "date":
    default:
      return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
  }
};

export const DEFAULT_PROPERTY_IMAGE = "https://placehold.co/800x600?text=Property";

export interface PropertyMedia {
  url: string;
  title?: string;
  description?: string;
}

export interface Property {
  id: string;
  image: string;
  name: string;
  neighborhood: string;
  subcluster?: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price: string;
  rentPricePerYear?: string;
  priceDetails?: string;
  labels: string[];
  description: string;
  amenities: string[];
  features: string[];
  locationDescription?: string;
  googleMapUrl?: string;
  videoUrl?: string;
  visible?: boolean;
  developmentImages?: PropertyMedia[];
  galleryImages?: PropertyMedia[];
  floorplans?: PropertyMedia[];
  availability?: PropertyAvailability;
  maidsRoom?: boolean;
  source?: "initial" | "custom";
  createdAt?: string;
  updatedAt?: string;
}

export const formatBedroomLabel = (bedrooms: number, maidsRoom?: boolean) =>
  maidsRoom ? `${bedrooms} Bedrooms + Maids` : `${bedrooms} Bedrooms`;

export const properties: Property[] = [
  {
    id: "sky-tower-penthouse",
    image: property1,
    name: "Sky Tower Penthouse",
    neighborhood: "Downtown Dubai",
    subcluster: "Business Bay",
    bedrooms: 4,
    bathrooms: 5,
    sqft: 4500,
    price: "AED 15,000,000",
    rentPricePerYear: "AED 450,000",
    priceDetails: "Long term rent, usual tenancy contract",
    visible: true,
    source: "initial",
    maidsRoom: true,
    labels: ["Luxury Amenities", "City View"],
    description: "Experience unparalleled luxury in this stunning penthouse located in the heart of Downtown Dubai. Floor-to-ceiling windows offer breathtaking views of the Burj Khalifa and the Dubai Fountain. This residence features premium Italian marble flooring, a state-of-the-art smart home system, and designer fixtures throughout.",
    locationDescription: "Downtown Dubai is the epitome of modern luxury living. Home to the world's tallest building, the Burj Khalifa, and the spectacular Dubai Mall, this neighborhood offers unmatched access to world-class dining, entertainment, and shopping. The Dubai Fountain shows and vibrant nightlife are just steps away, while major business districts are within easy reach.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    floorplans: [
      {
        url: floorplan1,
        title: "Spacious 4-bedroom penthouse layout",
        description: "Open-plan living areas with private elevator access.",
      },
    ],
    developmentImages: [
      { url: buildingGym, title: "Fitness Center", description: "State-of-the-art gym with panoramic city views" },
      { url: buildingLobby, title: "Grand Lobby", description: "Elegant entrance with 24/7 concierge service" },
      { url: buildingPool, title: "Infinity Pool", description: "Rooftop infinity pool overlooking Dubai skyline" }
    ],
    amenities: [
      "24/7 Concierge Service",
      "Infinity Pool",
      "Private Gym",
      "Spa & Wellness Center",
      "Valet Parking",
      "Business Center"
    ],
    features: [
      "Smart Home Technology",
      "Italian Marble Flooring",
      "Miele Kitchen Appliances",
      "Private Elevator Access",
      "Walk-in Closets",
      "Wine Cellar"
    ]
  },
  {
    id: "palm-residence",
    image: property2,
    name: "Palm Residence",
    neighborhood: "Palm Jumeirah",
    subcluster: "Golden Mile",
    bedrooms: 5,
    bathrooms: 6,
    sqft: 6200,
    price: "AED 22,500,000",
    rentPricePerYear: "AED 680,000",
    priceDetails: "Long term rent, usual tenancy contract",
    visible: true,
    source: "initial",
    maidsRoom: true,
    labels: ["Beach Access", "Private Pool"],
    description: "Discover paradise in this exceptional beachfront residence on Palm Jumeirah. This property offers direct beach access, a private infinity pool, and panoramic views of the Arabian Gulf. The open-plan design seamlessly blends indoor and outdoor living spaces, perfect for entertaining.",
    locationDescription: "Palm Jumeirah is Dubai's iconic man-made island, shaped like a palm tree and visible from space. This prestigious address offers an exclusive island lifestyle with pristine beaches, luxury hotels, and world-class restaurants. Residents enjoy a perfect balance of tranquil beachfront living while being just minutes away from Dubai Marina and the bustling city center.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    developmentImages: [
      { url: buildingPool, title: "Beach Club", description: "Exclusive beach club with private cabanas" },
      { url: buildingGym, title: "Wellness Center", description: "Premium spa and wellness facilities" },
      { url: buildingLobby, title: "Residents Lounge", description: "Elegant communal spaces for socializing" }
    ],
    amenities: [
      "Private Beach Access",
      "Infinity Pool",
      "24/7 Security",
      "Kids Play Area",
      "BBQ Area",
      "Landscaped Gardens"
    ],
    features: [
      "Floor-to-Ceiling Windows",
      "High-End Kitchen",
      "Master Suite with Sea View",
      "Home Theater",
      "Smart Home System",
      "Covered Parking for 3 Cars"
    ]
  },
  {
    id: "emirates-hills-villa",
    image: property3,
    name: "Emirates Hills Villa",
    neighborhood: "Emirates Hills",
    subcluster: "Xora",
    bedrooms: 6,
    bathrooms: 7,
    sqft: 8000,
    price: "AED 28,000,000",
    rentPricePerYear: "AED 850,000",
    priceDetails: "Long term rent, usual tenancy contract",
    visible: true,
    source: "initial",
    maidsRoom: false,
    labels: ["Golf Course View", "Premium Location"],
    description: "Nestled in the prestigious Emirates Hills community, this contemporary villa offers spectacular golf course views and ultimate privacy. The residence features a modern architectural design with clean lines, expansive glass walls, and luxurious outdoor living spaces including a temperature-controlled pool.",
    locationDescription: "Emirates Hills is Dubai's most exclusive gated community, often referred to as the 'Beverly Hills of Dubai'. This ultra-luxury neighborhood surrounds the Montgomerie Golf Course and offers unparalleled privacy and security. Residents enjoy access to premium international schools, high-end shopping at Mall of the Emirates, and easy connectivity to both business districts and leisure destinations.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    floorplans: [
      {
        url: floorplan1,
        title: "Luxury villa floor plan",
        description: "Six bedrooms with cinema room and panoramic golf course views.",
      },
    ],
    amenities: [
      "Golf Course Access",
      "Private Pool",
      "Tennis Court",
      "Maid's Room",
      "Driver's Room",
      "Landscaped Garden"
    ],
    features: [
      "Contemporary Architecture",
      "Premium Finishes Throughout",
      "Gourmet Kitchen",
      "Home Office",
      "Cinema Room",
      "4-Car Garage"
    ]
  }
];

