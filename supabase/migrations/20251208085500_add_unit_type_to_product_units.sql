-- Add unit_type column to product_units table
ALTER TABLE public.product_units 
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT '1';

-- Update existing records to have a default unit_type
UPDATE public.product_units 
SET unit_type = '1' 
WHERE unit_type IS NULL;

-- Add NOT NULL constraint after setting default values
ALTER TABLE public.product_units 
ALTER COLUMN unit_type SET NOT NULL;
