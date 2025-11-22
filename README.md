# Trivia Party

A real-time trivia game application with display screen support.

## Environment Variables

### GEMINI_API_KEYS

Required for TTS audio generation feature. JSON array of Google Gemini API keys.

```bash
export GEMINI_API_KEYS='["AIzaSyAbc123...", "AIzaSyDef456..."]'
```

Multiple keys enable automatic rotation when rate limits are hit.

To start PocketBase with API keys:

```bash
GEMINI_API_KEYS='["your-key-here"]' pocketbase serve --dev --http 0.0.0.0:8090
```

To get a Gemini API key:
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Enable Text-to-Speech API
