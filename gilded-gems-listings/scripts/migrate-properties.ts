/**
 * Migration script to load initial properties into Supabase
 * 
 * Usage: npx ts-node scripts/migrate-properties.ts
 */

import { createClient } from '@supabase/supabase-js';
import { properties } from '../src/data/properties';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateProperties() {
  console.log(`Starting migration of ${properties.length} properties...`);

  for (const property of properties) {
    const payload = {
      id: property.id,
      name: property.name,
      neighborhood: property.neighborhood,
      subcluster: property.subcluster,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      maids_room: property.maidsRoom || false,
      price: property.price,
      rent_price_per_year: property.rentPricePerYear,
      price_details: property.priceDetails,
      image_url: property.image,
      images: [],
      floorplan_url: property.floorplanImage,
      floorplan_description: property.floorplanDescription,
      development_images: property.developmentImages || [],
      video_url: property.videoUrl,
      description: property.description,
      location_description: property.locationDescription,
      labels: property.labels,
      amenities: property.amenities,
      features: property.features,
      availability: property.availability || 'available',
      visible: property.visible !== false,
    };

    console.log(`Migrating property: ${property.name}...`);

    const { error } = await supabase
      .from('properties')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`Error migrating ${property.name}:`, error);
    } else {
      console.log(`✓ Migrated: ${property.name}`);
    }
  }

  console.log('Migration completed!');
}

migrateProperties().catch(console.error);

