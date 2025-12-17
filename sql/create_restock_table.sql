-- Create table for restock purchases (kulakan)
create table if not exists public.restock_purchases (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  note text,
  user_id uuid references auth.users(id)
);

-- Enable RLS
alter table public.restock_purchases enable row level security;

-- Create policies
create policy "Enable read access for authenticated users"
  on public.restock_purchases for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.restock_purchases for insert
  to authenticated
  with check (true);

create policy "Enable delete for authenticated users"
  on public.restock_purchases for delete
  to authenticated
  using (true);
