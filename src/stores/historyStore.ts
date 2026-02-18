import { writable } from "svelte/store";
import { listen } from "@tauri-apps/api/event";
import { commands, type HistoryEntry } from "@/bindings";

export const historyEntries = writable<HistoryEntry[]>([]);

export async function loadHistoryEntries(): Promise<void> {
  try {
    const result = await commands.getHistoryEntries();
    if (result.status === "ok") {
      historyEntries.set(result.data);
    }
  } catch (error) {
    console.error("Failed to load history entries:", error);
  }
}

export async function initialize(): Promise<void> {
  await loadHistoryEntries();

  listen("history-updated", () => {
    loadHistoryEntries();
  });
}
