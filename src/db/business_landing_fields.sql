-- Add cover image, description, location, phone, and website to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN businesses.cover_image_url IS 'Public-facing cover/banner image URL for the business landing page';
COMMENT ON COLUMN businesses.description IS 'Short business description shown on the public landing page';
COMMENT ON COLUMN businesses.location IS 'Business physical location or address';
COMMENT ON COLUMN businesses.phone IS 'Public business contact phone number';
COMMENT ON COLUMN businesses.website IS 'Business website URL';
