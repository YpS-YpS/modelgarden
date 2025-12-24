# Model Garden

A modern, beautiful UI for [LM Studio](https://lmstudio.ai) - your local AI playground.

![Model Garden](https://img.shields.io/badge/Model-Garden-purple?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)

## Features

- **Modern Chat Interface** - Clean, responsive design with real-time streaming
- **Model Management** - Easy model selection with visual cards
- **Multiple Themes** - Dark, Midnight, Cyberpunk, and Forest themes
- **Chat History** - Persistent conversations stored locally (IndexedDB)
- **Vision Support** - Upload images for vision-capable models
- **Streaming Responses** - Real-time token streaming with metrics
- **Stop Generation** - Cancel responses mid-stream
- **Export Chats** - Download conversations as JSON
- **Docker Ready** - Production-ready containerization

## Screenshots

The app features a beautiful splash screen and intuitive chat interface designed for local AI exploration.

## Prerequisites

- [LM Studio](https://lmstudio.ai) installed and running
- Node.js 20+ (for local development) OR Docker

## Quick Start

### Option 1: Local Development

```bash
# Clone the repository
git clone https://github.com/twinkleswain/modelgarden.git
cd modelgarden

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Option 2: Docker

```bash
# Clone the repository
git clone https://github.com/twinkleswain/modelgarden.git
cd modelgarden

# Build and run with Docker Compose
docker-compose up -d --build
```

Open http://localhost:3000 in your browser.

## LM Studio Setup

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download a model (e.g., Llama, Mistral, Qwen, etc.)
3. Go to the **Local Server** tab
4. Load your model and click **Start Server**
5. Default server runs on `http://localhost:1234`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_LM_STUDIO_URL` | `http://127.0.0.1:1234` | LM Studio API endpoint |

For Docker deployments, the URL is automatically set to `http://host.docker.internal:1234` to reach LM Studio running on the host machine.

### Custom LM Studio URL

Create a `.env.local` file:

```env
VITE_LM_STUDIO_URL=http://your-server:1234
```

## Project Structure

```
modelgarden/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components (Button, Input, etc.)
│   │   ├── ChatView.tsx # Main chat interface
│   │   ├── ChatMessage.tsx # Message rendering with markdown
│   │   ├── HistorySidebar.tsx # Chat history & model selection
│   │   ├── SettingsSidebar.tsx # Model parameters & themes
│   │   └── SplashScreen.tsx # Welcome/branding screen
│   ├── services/
│   │   ├── api.ts       # LM Studio API integration
│   │   └── database.ts  # IndexedDB for chat persistence
│   ├── stores/          # Zustand state management
│   │   ├── chatStore.ts # Chat & message state
│   │   ├── modelStore.ts # Model list & selection
│   │   └── settingsStore.ts # Theme & parameters
│   ├── types/           # TypeScript type definitions
│   └── lib/             # Utility functions
├── Dockerfile           # Multi-stage production build
├── docker-compose.yml   # Container orchestration
└── nginx.conf          # Production web server config
```

## Tech Stack

- **Frontend**: React 18, TypeScript 5
- **Styling**: Tailwind CSS 3, Custom themes
- **State**: Zustand (lightweight state management)
- **Storage**: IndexedDB (via idb library)
- **Markdown**: react-markdown with syntax highlighting
- **Icons**: Lucide React
- **Build**: Vite 5
- **Production**: Nginx (Docker)

## Themes

Model Garden includes 4 beautiful themes:

| Theme | Description |
|-------|-------------|
| **Dark** | Default purple-accented dark theme |
| **Midnight** | Deep blue tones |
| **Cyberpunk** | Vibrant pink/magenta accents |
| **Forest** | Calming green palette |

Change themes in the Settings sidebar (right panel).

## Model Parameters

Adjust these parameters in the Settings sidebar:

- **Temperature** (0-2): Controls randomness
- **Max Tokens**: Maximum response length
- **Top P**: Nucleus sampling threshold
- **Top K**: Top-k sampling
- **Repeat Penalty**: Reduces repetition
- **System Prompt**: Custom system instructions

## API Compatibility

Model Garden uses the OpenAI-compatible API provided by LM Studio:

- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completion (streaming supported)

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build --force-recreate
```

## Troubleshooting

### "No models found"
- Ensure LM Studio is running
- Check that a model is loaded in LM Studio
- Verify the server is started (Local Server tab)

### Docker can't connect to LM Studio
- Make sure LM Studio is running on the host machine
- The Docker container uses `host.docker.internal` to reach the host
- On Linux, you may need to use `--network host` or configure the IP manually

### CORS errors
- LM Studio should handle CORS automatically
- If issues persist, check LM Studio's server settings

## License

MIT

## Credits

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by [LM Studio](https://lmstudio.ai)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)

---

**Intel SIV Model Garden** - Your local AI playground
