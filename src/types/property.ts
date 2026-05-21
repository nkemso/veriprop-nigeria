export type PropertyType =
  | 'apartment' | 'house' | 'duplex' | 'bungalow'
  | 'mansion' | 'penthouse' | 'land' | 'commercial'
  | 'office' | 'warehouse' | 'shop' | 'shortlet';

export type ListingType = 'sale' | 'rent' | 'lease' | 'shortlet';

export type PropertyStatus = 'active' | 'pending' | 'sold' | 'rented' | 'deleted' | 'rejected';

export type ModerationStatus = 'approved' | 'review_required' | 'rejected';

export interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface PropertyOwner {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  profile?: { avatar?: string };
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  state: string;
  lga: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  size?: number;
  sizeUnit?: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  isFeatured: boolean;
  isVerified: boolean;
  moderationStatus: ModerationStatus;
  images: PropertyImage[];
  owner: PropertyOwner;
  createdAt: string;
  updatedAt: string;
  _count?: { views: number; favorites: number };
}

export interface PropertyFilter {
  q?: string;
  state?: string;
  lga?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface PaginatedProperties {
  data: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
