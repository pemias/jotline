import { type } from "@tauri-apps/plugin-os";
import { type OSType } from "./keyboard";

export function getOsType(): OSType {
  const osType = type();
  if (osType === "macos" || osType === "windows" || osType === "linux") {
    return osType;
  }
  return "unknown";
}
