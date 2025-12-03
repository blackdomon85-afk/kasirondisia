-- Drop existing update policy
DROP POLICY IF EXISTS "Admins can update products" ON public.products;

-- Create new policy allowing both admin and kasir to update products (for stock updates)
CREATE POLICY "Admin and kasir can update products" 
ON public.products 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'kasir'::app_role));