export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - adjust as needed
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const formatBusinessData = (business: any): any => {
  return {
    id: business._id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    category: business.category,
    owner: business.owner,
    email: business.email,
    phone: business.phone,
    website: business.website,
    logo: business.logo,
    images: business.images,
    address: business.address,
    city: business.city,
    country: business.country,
    coordinates: business.coordinates,
    rating: business.rating,
    reviewCount: business.reviewCount,
    tags: business.tags,
    verified: business.verified,
    featured: business.featured,
    active: business.active,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
};
