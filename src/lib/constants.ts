import type { Category } from "@/types/business";

export const CATEGORIES: Category[] = [
  {
    id: "cat-horeca",
    name: "HoReCa",
    slug: "horeca",
    description: "Hotels, restaurants, cafés, and catering services",
    icon: "UtensilsCrossed",
    count: 215,
  },
  {
    id: "cat-building-material",
    name: "Building Material",
    slug: "building-material",
    description: "Construction supplies, materials, tools, and hardware",
    icon: "Hammer",
    count: 124,
  },
  {
    id: "cat-agri",
    name: "Agriculture",
    slug: "agriculture",
    description: "Farming, food production, and agritech companies",
    icon: "Wheat",
    count: 98,
  },
  {
    id: "cat-construction",
    name: "Construction",
    slug: "construction",
    description: "Building, architecture, and real estate companies",
    icon: "Building2",
    count: 87,
  },
  {
    id: "cat-finance",
    name: "Finance",
    slug: "finance",
    description: "Banking, insurance, and financial services",
    icon: "Landmark",
    count: 64,
  },
  {
    id: "cat-health",
    name: "Healthcare",
    slug: "healthcare",
    description: "Clinics, pharmacies, and medical services",
    icon: "Heart",
    count: 73,
  },
  {
    id: "cat-education",
    name: "Education",
    slug: "education",
    description: "Schools, universities, and training centers",
    icon: "GraduationCap",
    count: 51,
  },
];



export const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "200+"];

export const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "name", label: "Alphabetical" },
];

export const SITE_CONFIG = {
  name: "Findy Hub",
  description:
    "Armenia's premier business directory. Discover, connect, and grow with Armenian entrepreneurs.",
  url: "https://armenbiz.am",
  stats: {
    businesses: 906,
    cities: 15,
    industries: 8,
    monthlyVisitors: 25000,
  },
};
