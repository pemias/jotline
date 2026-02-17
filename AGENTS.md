# AGENTS.md

This file provides guidance to AI agents when working with the Jotline codebase.

## Project Context

Jotline is a voice-first note capture app, forked from [Handy](https://github.com/cjpais/handy) (MIT). The Rust backend (audio, VAD, transcription, model management) is inherited from Handy and largely kept intact. The frontend uses Svelte 5 with TypeScript, replacing Handy's original React UI.

**Key identifiers:**
- Package: `jotline` (package.json), `jotline` (Cargo.toml)
- Lib crate: `jotline_lib`
- Bundle ID: `com.jotline.app`
- Binary: `jotline`

**Upstream tracking:** `git remote upstream` → `https://github.com/cjpais/handy.git`

## Fork Maintenance Strategy

Jotline diverges from Handy in the UX layer but shares its Rust transcription backend. To keep upstream merges feasible:

- **Add Jotline features in new files/modules** (e.g. `context.rs`, `palette.rs`, `embeddings.rs`) rather than modifying existing Handy files. This minimizes merge conflicts.
- **When modifying inherited Handy files**, keep changes in clearly bounded sections.
- **Keep Rust backend structure similar to upstream** — same manager pattern, same module layout. Don't reorganize for aesthetics.
- **Use `transcribe-rs` from crates.io as-is** — no fork needed unless we must patch inference.
- **Pull upstream updates periodically** via `git fetch upstream && git merge upstream/main` (monthly-ish).
- **`handy-keys` crate and `shortcut/handy_keys.rs`** wrap an external crate — don't rename these, they're not our brand.

## Development Commands

**Prerequisites:** [Rust](https://rustup.rs/) (latest stable), [Bun](https://bun.sh/)

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev
# If cmake error on macOS:
CMAKE_POLICY_VERSION_MINIMUM=3.5 bun run tauri dev

# Build for production
bun run tauri build

# Linting and formatting (run before committing)
bun run lint              # ESLint for frontend
bun run lint:fix          # ESLint with auto-fix
bun run format            # Prettier + cargo fmt
bun run format:check      # Check formatting without changes
```

**Model Setup (Required for Development):**

```bash
mkdir -p src-tauri/resources/models
curl -o src-tauri/resources/models/silero_vad_v4.onnx https://blob.handy.computer/silero_vad_v4.onnx
```

## Architecture Overview

Tauri 2.x app: Rust backend + Svelte 5/TypeScript frontend.

### Backend Structure (src-tauri/src/)

- `lib.rs` - Main entry point, Tauri setup, manager initialization
- `managers/` - Core business logic:
  - `audio.rs` - Audio recording and device management
  - `model.rs` - Model downloading and management
  - `transcription.rs` - Speech-to-text processing pipeline
  - `history.rs` - Transcription history storage
- `audio_toolkit/` - Low-level audio processing:
  - `audio/` - Device enumeration, recording, resampling
  - `vad/` - Voice Activity Detection (Silero VAD)
- `commands/` - Tauri command handlers for frontend communication
- `shortcut.rs` - Global keyboard shortcut handling
- `settings.rs` - Application settings management

### Frontend Structure (src/)

- `main.ts` - Entry point, mounts `App.svelte`
- `App.svelte` - Root component with onboarding flow and section routing
- `components/` - Svelte 5 components using runes (`$state`, `$derived`, `$effect`, `$props`)
  - `settings/` - Settings UI (~40 `.svelte` files organized by section)
  - `model-selector/` - Model management interface
  - `onboarding/` - First-run model selection and permissions
  - `ui/` - Shared primitives (Select, Dropdown, ToggleSwitch, Tooltip, etc.)
  - `icons/` - SVG icon components
  - `Sidebar.svelte` - Navigation sidebar
- `stores/settingsStore.ts` - Svelte `writable`/`derived` stores for app settings
- `stores/modelStore.ts` - Svelte stores for model state and download progress
- `i18n/index.ts` - i18next with Svelte store wrappers (`t`, `locale`)
- `bindings.ts` - Auto-generated Tauri type bindings (via tauri-specta)
- `overlay/` - Recording overlay window (separate Svelte entry point)

### Key Patterns

**Manager Pattern:** Core functionality organized into managers (Audio, Model, Transcription) initialized at startup and managed via Tauri state.

**Command-Event Architecture:** Frontend → Backend via Tauri commands; Backend → Frontend via events.

**Pipeline Processing:** Audio → VAD → Whisper/Parakeet → Text output → Clipboard/Paste

**State Flow:** Svelte stores → Tauri Command → Rust State → Persistence (tauri-plugin-store)

## Internationalization (i18n)

All user-facing strings must use i18next translations.

**Adding new text:**

1. Add key to `src/i18n/locales/en/translation.json`
2. Use in component: `import { t } from "@/i18n";` then `{$t('key.path')}` in the template

## Code Style

**Rust:**

- Run `cargo fmt` and `cargo clippy` before committing
- Handle errors explicitly (avoid unwrap in production)
- Use descriptive names, add doc comments for public APIs

**Svelte/TypeScript:**

- Svelte 5 with runes — use `$state`, `$derived`, `$effect`, `$props` (not legacy `let`/`export let`)
- Use `$derived.by(() => { ... })` for multi-statement derivations, `$derived(expr)` for simple expressions
- Avoid naming variables `state` — it conflicts with the `$state` rune prefix
- SVG attributes use kebab-case: `fill-rule`, `stroke-linecap`, `stroke-width` (not React's camelCase)
- Strict TypeScript, avoid `any` types
- Tailwind CSS for styling
- Path aliases: `@/` → `./src/`

## Commit Guidelines

Use conventional commits:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `refactor:` code refactoring
- `chore:` maintenance

## CLI Parameters

Jotline supports command-line parameters on all platforms for integration with scripts, window managers, and autostart configurations.

**Implementation files:**

- `src-tauri/src/cli.rs` - CLI argument definitions (clap derive)
- `src-tauri/src/main.rs` - Argument parsing before Tauri launch
- `src-tauri/src/lib.rs` - Applying CLI overrides (setup closure + single-instance callback)
- `src-tauri/src/signal_handle.rs` - `send_transcription_input()` reusable function

**Available flags:**

| Flag                     | Description                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `--toggle-transcription` | Toggle recording on/off on a running instance (via `tauri_plugin_single_instance`) |
| `--toggle-post-process`  | Toggle recording with post-processing on/off on a running instance                 |
| `--cancel`               | Cancel the current operation on a running instance                                 |
| `--start-hidden`         | Launch without showing the main window (tray icon still visible)                   |
| `--no-tray`              | Launch without the system tray icon (closing window quits the app)                 |
| `--debug`                | Enable debug mode with verbose (Trace) logging                                     |

**Key design decisions:**

- CLI flags are runtime-only overrides — they do NOT modify persisted settings
- Remote control flags (`--toggle-transcription`, `--toggle-post-process`, `--cancel`) work by launching a second instance that sends its args to the running instance via `tauri_plugin_single_instance`, then exits
- `send_transcription_input()` in `signal_handle.rs` is shared between signal handlers and CLI to avoid code duplication
- `CliArgs` is stored in Tauri managed state (`.manage()`) so it's accessible in `on_window_event` and other handlers

## Debug Mode

Access debug features: `Cmd+Shift+D` (macOS) or `Ctrl+Shift+D` (Windows/Linux)

## Platform Notes

- **macOS**: Metal acceleration, accessibility permissions required
- **Windows**: Vulkan acceleration, code signing
- **Linux**: OpenBLAS + Vulkan, limited Wayland support, overlay disabled by default
