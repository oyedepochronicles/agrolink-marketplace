import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { toast } from "sonner";

export const getLocation = async () => {
  if (!Capacitor.isNativePlatform()) {
    toast.warning("Geolocation only works on native (Android/iOS)");
    return null;
  }

  const perm = await Geolocation.requestPermissions();

  if (perm.location !== "granted") {
    throw new Error("Permission denied");
  }
};

export const takePhoto = async () => {
  if (!Capacitor.isNativePlatform()) {
    toast.warning("Geolocation only works on native (Android/iOS)");
    return null;
  }
  const permission = await Camera.requestPermissions();

  if (permission.camera !== "granted")
    throw new Error("Camera permission denied");
};
