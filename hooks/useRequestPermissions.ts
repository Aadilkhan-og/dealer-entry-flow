import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useEffect } from "react";

/**
 * Requests all required app permissions upfront at startup.
 * Called once from RootLayout so users aren't interrupted mid-flow.
 */
export function useRequestPermissions() {
  useEffect(() => {
    async function requestAll() {
      // Camera – needed for Aadhaar scan and IMEI scan
      await Camera.requestCameraPermissionsAsync();
      // Media library – needed for image picker (phone photo)
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    requestAll();
  }, []);
}
