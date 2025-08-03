<div align="center">
  <img src="https://raw.githubusercontent.com/incubated-geek-cc/whisper-onnx/main/public/logo.png" width="96" alt="logo">

  # Whisper-ONNX - Offline Local Audio Transcription API

  ### 🛠️ A Vite + React-based setup that allows users to upload audio recordings and retrieve its text content. **Note: For simplicity, this setup only accounts for 'English' transcription.**.

**Based on <a href='https://github.com/xenova/whisper-web/tree/experimental-webgpu'>whisper-webgpu</a>.**

<div align="left">

### 👀 Preview

<img src='https://raw.githubusercontent.com/incubated-geek-cc/whisper-onnx/main/upload_audio.gif' width="600px" />

#### Demo (1) Select model choice (non-default)
<img src='https://raw.githubusercontent.com/incubated-geek-cc/whisper-onnx/main/select_whisper_model.gif' width="600px" />

#### Demo (2) Audio Transcription
<img src='https://raw.githubusercontent.com/incubated-geek-cc/whisper-onnx/main/transcription_process.gif' width="600px" />

### 🌟 Try it yourself
[**Live Demo :: Link**](https://whisper-onnx.onrender.com/)

### ✍ Read related post here

[**Article :: Link :: Implementing Whisper OpenAI In-Browser for Offline Audio Transcription**](https://geek-cc.medium.com/adab61be7af7)


## Features

- 📄 Upload audio clips (.mp3 .webm .wav files)
- 💬 Audio conversion to WAV via FFMPEG
- 🤖 AI-powered Speech Recognition using Whisper OpenAI local models
- 📱 Mobile-responsive design
- 🔒 Complete offline functionality
- 💾 Export transcription results

## Required Model Files

For complete offline functionality, download the following model files to the `public/models/` directory:

### Whisper Tiny (en) Model (<a href='https://huggingface.co/Xenova/whisper-tiny.en'>`whisper-tiny.en`</a>)
Download these files to `public/models/Xenova/whisper-tiny.en/`:
- `added_tokens.json`
- `config.json`
- `generation_config.json`
- `merges.txt`
- `normalizer.json`
- `preprocessor_config.json`
- `quant_config.json`
- `quantize_config.json`
- `special_tokens_map.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `vocab.json`
- `onnx/decoded_model_merged_fp16.onnx`
- `onnx/encoder_model_fp16.onnx`

### Whisper Base (en) Model (<a href='https://huggingface.co/Xenova/whisper-base.en'>`whisper-base.en`</a>)
Download these files to `public/models/Xenova/whisper-base.en/`:
- `added_tokens.json`
- `config.json`
- `generation_config.json`
- `merges.txt`
- `normalizer.json`
- `preprocessor_config.json`
- `quant_config.json`
- `quantize_config.json`
- `special_tokens_map.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `vocab.json`
- `onnx/decoded_model_merged_fp16.onnx`
- `onnx/encoder_model_fp16.onnx`

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Download the required model files (refer to above)
4. Build and start the server: `npm run build && npm run preview`

## Technology Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- @huggingface/transformers for AI model inference
- WebGPU acceleration (with WASM fallback)

<p>— <b>Join me on 📝 <b>Medium</b> at <a href='https://medium.com/@geek-cc' target='_blank'>~ ξ(🎀˶❛◡❛) @geek-cc</a></b></p>

---

#### 🌮 Please buy me a <a href='https://www.buymeacoffee.com/geekcc' target='_blank'>Taco</a>! 😋