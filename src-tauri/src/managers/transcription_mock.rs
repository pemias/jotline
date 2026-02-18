// Mock TranscriptionManager — compiled when the `transcription` feature is disabled.
// Avoids pulling in whisper/Vulkan/ONNX dependencies (used in CI).

use crate::managers::model::ModelManager;
use anyhow::Result;
use std::sync::Arc;
use tauri::AppHandle;

#[derive(Clone)]
pub struct TranscriptionManager {
    #[allow(dead_code)]
    app_handle: AppHandle,
}

impl TranscriptionManager {
    pub fn new(app_handle: &AppHandle, _model_manager: Arc<ModelManager>) -> Result<Self> {
        Ok(Self {
            app_handle: app_handle.clone(),
        })
    }

    pub fn is_model_loaded(&self) -> bool {
        false
    }

    pub fn unload_model(&self) -> Result<()> {
        Ok(())
    }

    pub fn maybe_unload_immediately(&self, _context: &str) {}

    pub fn load_model(&self, _model_id: &str) -> Result<()> {
        Ok(())
    }

    pub fn initiate_model_load(&self) {}

    pub fn get_current_model(&self) -> Option<String> {
        None
    }

    pub fn transcribe(&self, _audio: Vec<f32>) -> Result<String> {
        Ok(String::new())
    }
}
