import "./i18n";
import { initialize as initHistoryStore } from "./stores/historyStore";
import { initialize as initModelStore } from "./stores/modelStore";
import { initialize as initSettingsStore } from "./stores/settingsStore";
import { mount } from "svelte";
import App from "./App.svelte";

void initHistoryStore();
void initModelStore();
void initSettingsStore();

const app = mount(App, {
  target: document.getElementById("root")!,
});

export default app;
