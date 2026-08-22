#!/usr/bin/env python3
"""
Whisper STT CLI for Sub 4.0
Adapted from auto_script/src/whisper_client.py

Usage:
    python whisper_transcribe.py <audio_path> [--language zh] [--model medium]

Output: JSON to stdout
{
  "text": "full transcript",
  "segments": [{"start": 0.0, "end": 2.5, "text": "..."}],
  "words": [{"word": "hello", "start": 0.0, "end": 0.5}]
}
"""

import sys
import json
import argparse
from pathlib import Path

# Import from auto_script logic
try:
    from faster_whisper import WhisperModel
except ImportError:
    print(json.dumps({
        "error": "faster-whisper not installed. Run: pip install faster-whisper",
        "text": "",
        "segments": [],
        "words": []
    }))
    sys.exit(1)


def get_or_load_model(model_name="medium", device="auto"):
    """Load Whisper model with auto device detection"""
    if device == "auto":
        # Force CPU mode - GPU requires CUDA toolkit installed
        # Most users don't have CUDA, so default to CPU
        device = "cpu"
        compute_type = "int8"
        print(f"[Whisper Debug] Using CPU mode (int8) - GPU disabled to avoid CUDA DLL errors", file=sys.stderr)
    else:
        compute_type = "int8" if device == "cpu" else "float16"
    
    print(f"[Whisper Debug] Device: {device}, Compute type: {compute_type}", file=sys.stderr)
    
    model = WhisperModel(
        model_name,
        device=device,
        compute_type=compute_type,
        cpu_threads=4
    )
    return model


def transcribe_audio(audio_path, language="auto", model_name="medium"):
    """Transcribe audio file using Whisper"""
    audio_path = Path(audio_path)
    
    # Debug logging
    print(f"[Whisper Debug] Audio path: {audio_path}", file=sys.stderr)
    print(f"[Whisper Debug] Path exists: {audio_path.exists()}", file=sys.stderr)
    if audio_path.exists():
        print(f"[Whisper Debug] Path absolute: {audio_path.absolute()}", file=sys.stderr)
        print(f"[Whisper Debug] File size: {audio_path.stat().st_size} bytes", file=sys.stderr)
    
    if not audio_path.exists():
        return {
            "error": f"Audio file not found: {audio_path}",
            "text": "",
            "segments": [],
            "words": []
        }
    
    try:
        print(f"[Whisper Debug] Loading model: {model_name}", file=sys.stderr)
        model = get_or_load_model(model_name)
        print(f"[Whisper Debug] Model loaded successfully", file=sys.stderr)
        
        # Transcribe with word timestamps
        print(f"[Whisper Debug] Starting transcription...", file=sys.stderr)
        segments_iter, info = model.transcribe(
            str(audio_path),
            language=None if language == "auto" else language,
            word_timestamps=True,
            vad_filter=True,
            beam_size=5,
            vad_parameters={
                "threshold": 0.3,
                "min_silence_duration_ms": 500
            }
        )
        print(f"[Whisper Debug] Transcription started, detected language: {info.language}", file=sys.stderr)
        
        # Convert to JSON-serializable format
        result = {
            "text": "",
            "segments": [],
            "words": [],
            "language": info.language,
            "duration": info.duration
        }
        
        for seg in segments_iter:
            segment_data = {
                "start": float(seg.start),
                "end": float(seg.end),
                "text": seg.text.strip()
            }
            result["segments"].append(segment_data)
            result["text"] += seg.text.strip() + " "
            
            # Extract word-level timestamps
            if seg.words:
                for word in seg.words:
                    result["words"].append({
                        "word": word.word,
                        "start": float(word.start),
                        "end": float(word.end)
                    })
        
        result["text"] = result["text"].strip()
        return result
        
    except Exception as e:
        # Detailed error logging
        print(f"[Whisper Debug] Exception occurred: {type(e).__name__}", file=sys.stderr)
        print(f"[Whisper Debug] Exception message: {str(e)}", file=sys.stderr)
        import traceback
        print(f"[Whisper Debug] Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        
        return {
            "error": str(e),
            "text": "",
            "segments": [],
            "words": []
        }


def main():
    parser = argparse.ArgumentParser(description="Whisper STT for Sub 4.0")
    parser.add_argument("audio_path", help="Path to audio/video file")
    parser.add_argument("--language", default="auto", help="Language code (auto, en, vi, zh, etc)")
    parser.add_argument("--model", default="medium", help="Model size (tiny, base, small, medium, large-v3)")
    parser.add_argument("--output", help="Output JSON file (default: stdout)")
    
    args = parser.parse_args()
    
    # Progress to stderr (so stdout stays clean for JSON)
    print(f"[Whisper] Processing: {args.audio_path}", file=sys.stderr)
    print(f"[Whisper] Model: {args.model}, Language: {args.language}", file=sys.stderr)
    
    result = transcribe_audio(args.audio_path, args.language, args.model)
    
    # Output JSON with UTF-8 encoding
    output_json = json.dumps(result, ensure_ascii=False, indent=2)
    
    if args.output:
        Path(args.output).write_text(output_json, encoding="utf-8")
        print(f"[Whisper] Saved to: {args.output}", file=sys.stderr)
    else:
        # Force UTF-8 output for Windows console (support Chinese, Vietnamese, etc.)
        sys.stdout.reconfigure(encoding='utf-8')
        print(output_json)
    
    # Exit code
    sys.exit(0 if not result.get("error") else 1)


if __name__ == "__main__":
    main()
