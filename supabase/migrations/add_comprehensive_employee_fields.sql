-- Add comprehensive employee fields that are missing from the database schema

-- Personal information fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS private_email text,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS death_date date,
ADD COLUMN IF NOT EXISTS marriage_date date,
ADD COLUMN IF NOT EXISTS divorce_date date;

-- Communication fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS website text;

-- KVM (Identity Verification) fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS id_proof_type text,
ADD COLUMN IF NOT EXISTS id_proof_number text,
ADD COLUMN IF NOT EXISTS id_proof_expiry_date date;

-- Driving License fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS driving_license_a boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_a_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_a_expiry_date date,
ADD COLUMN IF NOT EXISTS driving_license_b boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_b_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_b_expiry_date date,
ADD COLUMN IF NOT EXISTS driving_license_be boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_be_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_be_expiry_date date,
ADD COLUMN IF NOT EXISTS driving_license_c boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_c_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_c_expiry_date date,
ADD COLUMN IF NOT EXISTS driving_license_ce boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_ce_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_ce_expiry_date date,
ADD COLUMN IF NOT EXISTS driving_license_d boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_d_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_d_expiry_date date,
ADD COLUMN IF NOT EXISTS driving_license_code95 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driving_license_code95_start_date date,
ADD COLUMN IF NOT EXISTS driving_license_code95_expiry_date date;

-- Update marital_status to include extended enum values
ALTER TABLE public.employees 
DROP CONSTRAINT IF EXISTS employees_marital_status_check;

ALTER TABLE public.employees 
ADD CONSTRAINT employees_marital_status_check 
CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated', 'domestic_partnership', 'civil_union', 'engaged', 'cohabiting', 'unknown'));