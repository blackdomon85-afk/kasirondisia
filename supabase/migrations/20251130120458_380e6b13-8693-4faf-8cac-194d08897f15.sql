-- Add new columns for pricing structure
ALTER TABLE products
ADD COLUMN purchase_price numeric DEFAULT 0 NOT NULL,
ADD COLUMN wholesale_price numeric,
ADD COLUMN wholesale_threshold integer;

-- Update existing products to have purchase_price = current price
UPDATE products SET purchase_price = price WHERE purchase_price = 0;

COMMENT ON COLUMN products.purchase_price IS 'Harga beli per pcs';
COMMENT ON COLUMN products.price IS 'Harga satuan per pcs';
COMMENT ON COLUMN products.wholesale_price IS 'Harga grosir per pcs';
COMMENT ON COLUMN products.wholesale_threshold IS 'Minimal pembelian untuk harga grosir (lipatan)';