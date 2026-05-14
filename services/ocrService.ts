export interface AadhaarOCRResult {
  name: string;
  aadhaarNumber: string;
}

// Accepts base64 string directly from camera (no file reading needed)
export async function extractAadhaarInfo(
  base64: string
): Promise<AadhaarOCRResult> {
  if (!base64) throw new Error("No image data provided.");

  // OCR.space free API — 25,000 requests/month, no billing required
  // Free API key: register at https://ocr.space/ocrapi/freekey
  const apiKey = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY ?? "helloworld";

  const formData = new FormData();
  formData.append("base64Image", `data:image/jpeg;base64,${base64}`);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", "false");
  formData.append("OCREngine", "2");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR request failed (${response.status})`);
  }

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(`OCR error: ${data.ErrorMessage?.[0] ?? "Unknown error"}`);
  }

  const fullText: string =
    data.ParsedResults?.[0]?.ParsedText ?? "";

  if (!fullText.trim()) {
    throw new Error(
      "No text detected. Ensure the Aadhaar card is clearly visible."
    );
  }

  return parseAadhaarText(fullText);
}

function parseAadhaarText(text: string): AadhaarOCRResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract 12-digit Aadhaar number (XXXX XXXX XXXX format)
  const aadhaarRegex = /\b(\d{4}[\s]?\d{4}[\s]?\d{4})\b/g;
  const matches = text.match(aadhaarRegex);
  let aadhaarNumber = "";
  if (matches && matches.length > 0) {
    const raw = matches[0].replace(/\s/g, "");
    aadhaarNumber = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)}`;
  }

  // Parse name — appears after "Name" label or is a capitalized proper name line
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^name[:\s]/i.test(line)) {
      const inline = line.replace(/^name[:\s]*/i, "").trim();
      name = inline || lines[i + 1] || "";
      break;
    }
  }

  // Fallback: find a proper name line (two+ capitalized words, no digits)
  if (!name) {
    for (const line of lines) {
      if (
        /^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/.test(line) &&
        !/\d/.test(line) &&
        line.length > 4
      ) {
        name = line;
        break;
      }
    }
  }

  return { name: name.trim(), aadhaarNumber };
}
