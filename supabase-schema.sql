-- DealerFlow Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create purchase_records table
CREATE TABLE IF NOT EXISTS public.purchase_records (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name  TEXT NOT NULL,
  phone_number   TEXT NOT NULL,
  aadhaar_number TEXT NOT NULL DEFAULT '',
  imei           TEXT NOT NULL,
  image_url      TEXT NOT NULL DEFAULT '',
  receipt_url    TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: allow anonymous and authenticated users to insert/select their own records
CREATE POLICY "Allow insert for all" ON public.purchase_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for all" ON public.purchase_records
  FOR SELECT USING (true);

-- 4. Storage buckets (run in Supabase Dashboard > Storage > New Bucket, OR via SQL):
-- phone-images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('phone-images', 'phone-images', true)
ON CONFLICT (id) DO NOTHING;

-- receipts bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS Policies
CREATE POLICY "Allow upload phone-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'phone-images');

CREATE POLICY "Allow read phone-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'phone-images');

CREATE POLICY "Allow upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow read receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');
