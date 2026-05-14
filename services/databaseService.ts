import { supabase } from "@/lib/supabase";

export interface PurchaseRecord {
  customer_name: string;
  phone_number: string;
  aadhaar_number: string;
  imei: string;
  image_url: string;
  receipt_url: string;
}

export interface PurchaseRecordRow extends PurchaseRecord {
  id: string;
  created_at: string;
}

export async function savePurchaseRecord(
  record: PurchaseRecord
): Promise<string> {
  const { data, error } = await supabase
    .from("purchase_records")
    .insert(record)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save record: ${error.message}`);
  return data.id as string;
}

export async function getPurchaseRecords(): Promise<PurchaseRecordRow[]> {
  const { data, error } = await supabase
    .from("purchase_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load records: ${error.message}`);
  return (data ?? []) as PurchaseRecordRow[];
}
