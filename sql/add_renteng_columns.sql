-- Add columns for Renteng feature
ALTER TABLE products
ADD COLUMN is_renteng BOOLEAN DEFAULT false,
ADD COLUMN renteng_quantity INTEGER DEFAULT 0,
ADD COLUMN renteng_price NUMERIC(10, 2) DEFAULT 0;
