pub mod audio;
pub mod model;
#[cfg(feature = "transcription")]
pub mod transcription;
#[cfg(not(feature = "transcription"))]
#[path = "transcription_mock.rs"]
pub mod transcription;
