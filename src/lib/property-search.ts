import type { PropertyFilter } from '../types/property';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const searchProperties = async (filters: PropertyFilter) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, String(value));
      }
    }
  });

  const res = await fetch(`${API_URL}/api/search?${params.toString()}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

export const getProperty = async (id: string) => {
  const res = await fetch(`${API_URL}/api/properties/${id}`);
  if (!res.ok) throw new Error('Property not found');
  return res.json();
};

export const getFeaturedProperties = async (limit = 6) => {
  const res = await fetch(`${API_URL}/api/properties?featured=true&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch featured properties');
  return res.json();
};

export const formatPrice = (price: number): string => {
  if (price >= 1_000_000_000) return `₦${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `₦${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `₦${(price / 1_000).toFixed(0)}K`;
  return `₦${price.toLocaleString()}`;
};

export const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'shortlet', label: 'Shortlet' },
];

export const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'lease', label: 'Lease' },
  { value: 'shortlet', label: 'Shortlet' },
];
