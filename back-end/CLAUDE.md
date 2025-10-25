# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a medical imaging analysis back-end system that processes X-ray images to identify and diagnose cancer-related lesions. The system uses OpenAI's vision models for image analysis and embeddings for similarity search, and stores data in Supabase.

## Development Commands

### Running the Application

```bash
# Start the main Fastify server (development with hot reload)
npm run dev

# Start the server (production-like)
npm run start:server

# Start the file watcher service separately
npm run watcher
```

### Building

```bash
# Compile TypeScript to JavaScript
npm run build
```

### Project Structure Note

The project uses ES modules (`"type": "module"` in package.json) with `.js` extensions in imports even though files are `.ts`. This is required for Node.js ES module resolution.

## Architecture

### Core Services

1. **Main Server** (`src/server.ts`)
   - Fastify-based HTTP server
   - Runs on port 3000 (configurable via `PORT` env var)
   - CORS enabled for `http://localhost:4200`
   - Multipart file upload support (10MB limit)

2. **File Watcher Service** (`src/watcher.ts`, `src/services/watcherService.ts`)
   - Monitors `imagens-inbox/` directory using chokidar
   - Automatically processes new images when added
   - Moves processed images to `imagens-processadas/`
   - Can run independently from main server

### Image Processing Pipeline

When an image is added (via upload or file watcher):

1. **Image Description** (`src/services/imagesService.ts:describeImage`)
   - Uses OpenAI Vision API (gpt-4o-mini by default)
   - Generates medical description of the lesion

2. **Embedding Generation** (`src/services/embeddingsService.ts:embedImageDescription`)
   - Creates vector embedding using `text-embedding-3-small`
   - Used for similarity search

3. **Database Storage** (`src/services/imagesService.ts:processImage`)
   - Stores in Supabase `imagens` table
   - Fields: `file_name`, `description`, `sha256`, `embedding`

### Search & Similarity

- **Vector Search** (`src/services/embeddingsService.ts:buscarSimilares`)
  - Uses Supabase RPC function `match_images`
  - Accepts string query or object (converted to string)
  - Returns top-k similar images (default k=5)
  - Converts query to embedding then searches via cosine similarity

### Real-time Communication

- **SSE (Server-Sent Events)** (`src/services/sseManager.ts`)
  - Endpoint: `GET /resposta/:sessionId`
  - Maintains session-based connections
  - Used for streaming responses to frontend

### Routes Structure

- **Upload Routes** (`src/routes/uploadRoutes.ts`) - Image upload endpoints
- **Search Routes** (`src/routes/searchRoutes.ts`) - Similarity search endpoints
- **Resposta Routes** (`src/routes/respostaRoutes.ts`) - SSE endpoints for real-time updates

## Environment Variables Required

Create a `.env` file with:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_VISION_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini

# Server
PORT=3000  # optional, defaults to 3000

# File Watcher
WATCH_DIR=./imagens-inbox  # optional, defaults to ./imagens-inbox
```

## Database Schema

### Supabase Requirements

1. **Table: `imagens`**
   - `file_name` (text)
   - `description` (text)
   - `sha256` (text) - file hash for deduplication
   - `embedding` (vector) - pgvector type

2. **RPC Function: `match_images`**
   - Parameters: `query_embedding` (vector), `match_count` (integer)
   - Returns similar images based on cosine similarity
   - Must be implemented in Supabase

## Key Technical Details

- **TypeScript Configuration**: Strict mode enabled with `nodenext` module resolution
- **Image Hashing**: Uses SHA-256 for file deduplication (see `src/utils/fileUtils.ts`)
- **File Processing**: Waits 500ms + verification before processing new files to ensure write completion
- **Data URL Conversion**: Images converted to base64 data URLs for OpenAI API
- **Import Extensions**: Always use `.js` extension in imports (TypeScript + ES modules requirement)

## Common Development Patterns

### Adding a New Route

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Register route in `src/index.ts` via `appRoutes()` function

### Working with OpenAI

- Vision client: `openaiClient` from `src/config/openai.ts`
- Vision prompts should be concise and medical-focused
- Always handle `completion.choices` safely with optional chaining

### Working with Supabase

- Client: `supabase` from `src/config/supabase.ts`
- Use `.from()` for table operations
- Use `.rpc()` for custom functions like similarity search
- Always check for `error` in response destructuring

## Debugging Notes

- Fastify logger is enabled by default (verbose console output)
- File watcher logs use emoji prefixes (📸, ✅, ❌, 👀)
- SSE sessions are stored in-memory (lost on server restart)
