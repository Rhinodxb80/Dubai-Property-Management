-- Update properties table structure for better data management
ALTER TABLE properties
-- Basic info
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS subcluster TEXT,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sqft INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS maids_room BOOLEAN DEFAULT false,

-- Pricing
ADD COLUMN IF NOT EXISTS price TEXT,
ADD COLUMN IF NOT EXISTS rent_price_per_year TEXT,
ADD COLUMN IF NOT EXISTS price_details TEXT,

-- Images and media
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS floorplan_url TEXT,
ADD COLUMN IF NOT EXISTS floorplan_description TEXT,
ADD COLUMN IF NOT EXISTS development_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT,

-- Description and details
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS location_description TEXT,
ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,

-- Availability and visibility
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,

-- Timestamps
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_visible ON properties(visible);
CREATE INDEX IF NOT EXISTS idx_properties_availability ON properties(availability);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

