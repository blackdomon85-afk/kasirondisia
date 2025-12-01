-- Create table for product unit master data (renteng configuration)
CREATE TABLE public.product_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  pieces_per_bundle INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view product units"
ON public.product_units
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product units"
ON public.product_units
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product units"
ON public.product_units
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product units"
ON public.product_units
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_product_units_updated_at
BEFORE UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();