-- Lets a business specify what "Other" actually means when business_type
-- is OTHER, instead of just showing the generic label everywhere.

alter table public.businesses
  add column business_type_other text not null default '';
