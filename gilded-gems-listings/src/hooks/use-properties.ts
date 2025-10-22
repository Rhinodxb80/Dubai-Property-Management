import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Property } from '@/data/properties';

const isSupabaseConfigured = 
  Boolean(import.meta.env.VITE_SUPABASE_URL) && 
  Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

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
 * Hook to fetch and listen to properties from Supabase
 */
export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function fetchProperties() {
      try {
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const mapped = (data || []).map(mapSupabaseToProperty);
        setProperties(mapped);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('properties-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties'
        },
        () => {
          fetchProperties();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { properties, loading, error };
}

/**
 * Hook to fetch a single property by ID
 */
export function useProperty(id: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function fetchProperty() {
      try {
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        setProperty(data ? mapSupabaseToProperty(data) : null);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  return { property, loading, error };
}

