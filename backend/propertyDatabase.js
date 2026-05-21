'use strict';

// Nigeria States, LGAs, and Property Data Reference
const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const PROPERTY_TYPES = [
  'apartment', 'house', 'duplex', 'bungalow', 'mansion', 'penthouse',
  'land', 'commercial', 'office', 'warehouse', 'shop', 'shortlet',
];

const LISTING_TYPES = ['sale', 'rent', 'lease', 'shortlet'];

const AMENITIES = [
  'swimming_pool', 'gym', 'security', 'parking', 'generator',
  'water_supply', 'wifi', 'air_conditioning', 'elevator', 'cctv',
  'playground', 'garden', 'balcony', 'servants_quarters', 'borehole',
  'solar_power', 'king_size_bed', 'smart_home', 'fire_alarm',
];

// Average property prices by state (in Naira)
const PRICE_BENCHMARKS = {
  Lagos: { rent: { min: 150000, avg: 500000, max: 5000000 }, sale: { min: 5000000, avg: 50000000, max: 5000000000 } },
  FCT: { rent: { min: 100000, avg: 350000, max: 3000000 }, sale: { min: 3000000, avg: 30000000, max: 2000000000 } },
  Rivers: { rent: { min: 80000, avg: 250000, max: 2000000 }, sale: { min: 2000000, avg: 20000000, max: 1000000000 } },
  Ogun: { rent: { min: 50000, avg: 150000, max: 800000 }, sale: { min: 1000000, avg: 10000000, max: 500000000 } },
  Kano: { rent: { min: 30000, avg: 80000, max: 400000 }, sale: { min: 500000, avg: 5000000, max: 200000000 } },
  default: { rent: { min: 20000, avg: 60000, max: 300000 }, sale: { min: 300000, avg: 3000000, max: 100000000 } },
};

const getStatePriceBenchmark = (state, listingType) => {
  const statePrices = PRICE_BENCHMARKS[state] || PRICE_BENCHMARKS.default;
  return statePrices[listingType] || statePrices.sale;
};

const validatePropertyPrice = (price, state, listingType) => {
  const benchmark = getStatePriceBenchmark(state, listingType);
  const ratio = price / benchmark.avg;
  if (ratio < 0.1) return { valid: false, warning: 'Price seems unusually low' };
  if (ratio > 10) return { valid: false, warning: 'Price seems unusually high' };
  return { valid: true };
};

module.exports = {
  NIGERIA_STATES,
  PROPERTY_TYPES,
  LISTING_TYPES,
  AMENITIES,
  PRICE_BENCHMARKS,
  getStatePriceBenchmark,
  validatePropertyPrice,
};
