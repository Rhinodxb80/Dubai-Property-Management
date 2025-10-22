import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/data/properties";

const PROPERTIES_TABLE = "properties";

/**
 * Fetches all properties from Supabase
 */
export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }

  return (data || []).map(mapSupabaseToProperty);
}

/**
 * Fetches a single property by ID
 */
export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching property:", error);
    return null;
  }

  return data ? mapSupabaseToProperty(data) : null;
}

/**
 * Creates or updates a property
 */
export async function upsertProperty(property: Partial<Property>): Promise<Property> {
  const payload = mapPropertyToSupabase(property);

  const { data, error } = await supabase
    .from(PROPERTIES_TABLE)
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error upserting property:", error);
    throw error;
  }

  return mapSupabaseToProperty(data);
}

/**
 * Deletes a property
 */
export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from(PROPERTIES_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
}

/**
 * Maps Supabase row to Property type
 */
function mapSupabaseToProperty(row: any): Property {
  return {
    id: row.id,
    image: row.image_url || "",
    name: row.name || "",
    neighborhood: row.neighborhood || "",
    subcluster: row.subcluster,
    bedrooms: row.bedrooms || 0,
    bathrooms: row.bathrooms || 0,
    sqft: row.sqft || 0,
    price: row.price || "",
    rentPricePerYear: row.rent_price_per_year,
    priceDetails: row.price_details,
    labels: Array.isArray(row.labels) ? row.labels : [],
    description: row.description || "",
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    features: Array.isArray(row.features) ? row.features : [],
    locationDescription: row.location_description,
    videoUrl: row.video_url,
    floorplanImage: row.floorplan_url,
    floorplanDescription: row.floorplan_description,
    visible: row.visible !== false,
    developmentImages: Array.isArray(row.development_images) 
      ? row.development_images 
      : [],
    availability: row.availability,
    maidsRoom: row.maids_room,
  };
}

/**
 * Maps Property type to Supabase row
 */
function mapPropertyToSupabase(property: Partial<Property>): any {
  return {
    id: property.id,
    name: property.name,
    neighborhood: property.neighborhood,
    subcluster: property.subcluster,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    price: property.price,
    rent_price_per_year: property.rentPricePerYear,
    price_details: property.priceDetails,
    image_url: property.image,
    images: property.developmentImages || [],
    labels: property.labels || [],
    description: property.description,
    amenities: property.amenities || [],
    features: property.features || [],
    location_description: property.locationDescription,
    video_url: property.videoUrl,
    floorplan_url: property.floorplanImage,
    floorplan_description: property.floorplanDescription,
    development_images: property.developmentImages || [],
    visible: property.visible !== false,
    availability: property.availability,
    maids_room: property.maidsRoom,
  };
}

