export interface Business {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  category: Category;
  categoryId: string;

  // Location
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;

  // Contact
  phone: string;
  email: string;
  website?: string;

  // Social
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  telegramUrl?: string;

  // Business details
  foundedYear: number;
  employeeCount: EmployeeRange;
  services: Service[];

  // Media
  logoUrl: string;
  coverImageUrl: string;
  images: string[];

  // Status
  status: BusinessStatus;
  isFeatured: boolean;
  isVerified: boolean;

  // Metrics
  viewCount: number;
  inquiryCount: number;
  ratingAvg: number;
  reviewCount: number;

  // Dates
  createdAt: string;
  updatedAt: string;

  // Operating hours
  operatingHours: OperatingHours[];

  // Tags
  tags: string[];
  plan?: 'starter' | 'standard' | 'premium';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  count: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  priceRange?: string;
}

export interface OperatingHours {
  day: number; // 0=Sunday, 6=Saturday
  dayName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Review {
  id: string;
  businessId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  businessId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
}

export type BusinessStatus = "pending" | "active" | "suspended" | "rejected";
export type EmployeeRange = "1-10" | "11-50" | "51-200" | "200+";

export interface BusinessFilters {
  query: string;
  category: string;
  city: string;
  region: string;
  employeeCount: string;
  ratingMin: number;
  verifiedOnly: boolean;
  sortBy: "rating" | "newest" | "name" | "popular";
  page: number;
  limit: number;
}
