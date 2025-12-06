-- Create categories table for master data
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view categories"
ON public.categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add delete policy for transaction_items (admin only)
CREATE POLICY "Admins can delete transaction items"
ON public.transaction_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add delete policy for transactions (admin only)
CREATE POLICY "Admins can delete transactions"
ON public.transactions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.categories (name) VALUES 
  ('Makanan'),
  ('Minuman'),
  ('Elektronik'),
  ('Pakaian'),
  ('Alat Tulis'),
  ('Kesehatan'),
  ('Lainnya');