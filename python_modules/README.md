# Python Whisper Module for Sub 4.0

## Overview
This module provides local Whisper STT (Speech-to-Text) transcription for Sub 4.0, replacing the OpenAI Whisper API.

## Architecture
```
Sub 4.0 (Electron/Node.js)
    ↓ spawn Python process
whisper_transcribe.py
    ↓ faster-whisper
Local Whisper Model
    ↓ JSON output
Sub 4.0 receives result
```

## Development Setup

### 1. Install Python 3.10+
Download from: https://www.python.org/downloads/

### 2. Install dependencies
```bash
cd python_modules
pip install -r requirements.txt
```

### 3. Test standalone
```bash
python whisper_transcribe.py test_audio.mp3 --language vi
```

## Production Build

The Python environment will be embedded in the app installer using:
- **Python Embeddable Package** (portable, no system install needed)
- **NSIS Installer** (via electron-builder)

### Build process:
```bash
cd ..
npm run build:win
```

This creates: `Sub4.0-1.3.0-setup.exe` (~600MB)

## Model Management

Models are auto-downloaded on first run to:
```
Windows: %USERPROFILE%\.cache\huggingface\hub\
```

Available models:
- `tiny`: ~75MB (fast, less accurate)
- `base`: ~145MB  
- `small`: ~466MB
- `medium`: ~1.5GB ⭐ (recommended)
- `large-v3`: ~3GB (best quality)

## Integration with Sub 4.0

See `src/main/whisper-integration.ts` for Node.js integration code.
