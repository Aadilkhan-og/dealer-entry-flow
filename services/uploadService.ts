import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

async function getUploadBody(
  uri: string,
  fileName: string,
  contentType: string
): Promise<Blob | { uri: string; name: string; type: string }> {
  if (Platform.OS === "web") {
    // On web: fetch the blob: / data: URI and upload as Blob
    const response = await fetch(uri);
    return await response.blob();
  }
  // On native: pass {uri, name, type} — React Native networking handles it natively
  return { uri, name: fileName, type: contentType };
}

export async function uploadPhoneImage(
  localUri: string,
  recordId: string
): Promise<string> {
  const fileName = `${recordId}_phone.jpg`;
  const body = await getUploadBody(localUri, fileName, "image/jpeg");

  const { error } = await supabase.storage
    .from("phone-images")
    .upload(fileName, body as Blob, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from("phone-images")
    .getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadReceiptPDF(
  localUri: string,
  recordId: string
): Promise<string> {
  const fileName = `${recordId}_receipt.pdf`;
  const body = await getUploadBody(localUri, fileName, "application/pdf");

  const { error } = await supabase.storage
    .from("receipts")
    .upload(fileName, body as Blob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw new Error(`Receipt upload failed: ${error.message}`);

  const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);
  return data.publicUrl;
}
