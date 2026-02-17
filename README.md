# Jotline

**Voice-first note capture that stays out of the way.**

Jotline is a desktop app for capturing thoughts by voice without breaking your flow. Press a hotkey, speak, and your note is transcribed, filed, and linked — entirely offline. No windows to manage, no apps to switch to.

Built on [Handy](https://github.com/cjpais/handy) (MIT) by cjpais.

## Current State

Inherited from Handy and working today:

- Local speech-to-text via Whisper, Parakeet, Moonshine, and SenseVoice (through [transcribe-rs](https://github.com/cjpais/transcribe-rs))
- Voice Activity Detection (Silero VAD)
- Model downloading with progress UI
- Cross-platform: macOS, Windows, Linux (see [platform notes](#platform-notes))
- Tray app with global hotkey
- GPU acceleration (Whisper via Vulkan/Metal) and CPU-optimized models (Parakeet)
- Svelte 5 frontend (replaced Handy's React UI)

## Planned

What makes Jotline different from Handy:

- **Overlay-based UI** — no persistent windows, just transient overlays that appear and disappear
- **Command palette** — tap hotkey for quick actions (Voice, Text, Append, Search, Clipboard, Relevant, Directory)
- **Hold-to-record** — hold the hotkey to capture, release to stop. One gesture, zero decisions
- **Context-aware capture** — automatically attach Git branch, focused window, open file as YAML frontmatter
- **Projects** — group notes by project, auto-detected from workspace
- **Markdown output** — notes are plain `.md` files, readable in any editor
- **Semantic search** — find past notes by meaning, not keywords
- **Auto-linking** — new notes automatically link to related past notes via embedding similarity

## Development

**Prerequisites:** [Rust](https://rustup.rs/) (latest stable), [Bun](https://bun.sh/)

```bash
bun install
bun run tauri dev
```

See [BUILD.md](BUILD.md) for platform-specific requirements.

## Platform Notes

**macOS and Windows** are the primary targets. Linux builds are inherited from Handy and basic transcription works, but there are no plans to fully support Linux — especially Wayland, where overlays, global hotkeys, and context capture have fundamental platform limitations.

## License

MIT — see [LICENSE](LICENSE).
