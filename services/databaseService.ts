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

export async function getPurchaseRecord(id: string): Promise<PurchaseRecordRow> {
  const { data, error } = await supabase
    .from("purchase_records")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Failed to load record: ${error.message}`);
  return data as PurchaseRecordRow;
}

export async function updatePurchaseRecord(
  id: string,
  record: Partial<PurchaseRecord>
): Promise<void> {
  const { error } = await supabase
    .from("purchase_records")
    .update(record)
    .eq("id", id);

  if (error) throw new Error(`Failed to update record: ${error.message}`);
}

export async function deletePurchaseRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from("purchase_records")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete record: ${error.message}`);
}
