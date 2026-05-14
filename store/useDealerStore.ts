import { create } from "zustand";

interface DealerState {
  customerName: string;
  phoneNumber: string;
  aadhaarNumber: string;
  imei: string;
  phoneImageUri: string | null;
  receiptPdfUri: string | null;
  savedRecordId: string | null;
  isSubmitting: boolean;
  error: string | null;
  showReceipt: boolean;
}

interface DealerActions {
  setCustomerName: (v: string) => void;
  setPhoneNumber: (v: string) => void;
  setAadhaarNumber: (v: string) => void;
  setImei: (v: string) => void;
  setPhoneImageUri: (v: string | null) => void;
  setReceiptPdfUri: (v: string | null) => void;
  setSavedRecordId: (v: string | null) => void;
  setIsSubmitting: (v: boolean) => void;
  setError: (v: string | null) => void;
  setShowReceipt: (v: boolean) => void;
  reset: () => void;
}

const initial: DealerState = {
  customerName: "",
  phoneNumber: "",
  aadhaarNumber: "",
  imei: "",
  phoneImageUri: null,
  receiptPdfUri: null,
  savedRecordId: null,
  isSubmitting: false,
  error: null,
  showReceipt: false,
};

export const useDealerStore = create<DealerState & DealerActions>((set) => ({
  ...initial,
  setCustomerName: (v) => set({ customerName: v }),
  setPhoneNumber: (v) => set({ phoneNumber: v }),
  setAadhaarNumber: (v) => set({ aadhaarNumber: v }),
  setImei: (v) => set({ imei: v }),
  setPhoneImageUri: (v) => set({ phoneImageUri: v }),
  setReceiptPdfUri: (v) => set({ receiptPdfUri: v }),
  setSavedRecordId: (v) => set({ savedRecordId: v }),
  setIsSubmitting: (v) => set({ isSubmitting: v }),
  setError: (v) => set({ error: v }),
  setShowReceipt: (v) => set({ showReceipt: v }),
  reset: () => set(initial),
}));
