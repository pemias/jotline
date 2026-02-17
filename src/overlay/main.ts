import RecordingOverlay from "./RecordingOverlay.svelte";
import { mount } from "svelte";
import "@/i18n";

const app = mount(RecordingOverlay, {
  target: document.getElementById("root")!,
});

export default app;
