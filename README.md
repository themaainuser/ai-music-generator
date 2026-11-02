# AI Music Generator – README

## Overview
The AI Music Generator is a full-stack web application built with Next.js, TypeScript, Prisma, and AWS S3, enabling users to generate, edit, publish, and listen to AI-generated music.
Users can create songs using simple descriptions or customize them with specific lyrics and styles. The system manages song generation requests, stores results on S3, and provides a user-friendly interface for playback, editing, and managing tracks.

This project also includes authentication, credits management, publishing controls, and real-time audio playback features.

---

## Key Features

### 1. AI-Powered Music Generation
- Generate full tracks from simple text descriptions.
- Create custom tracks with:
  - User-written lyrics
  - AI-generated lyrics
  - Custom style tags
  - Optional instrumental mode

### 2. Song Management
- View all previously generated songs.
- Rename, publish, unpublish, and download tracks.
- Automatic thumbnail and audio storage using AWS S3.
- Playback directly inside the app with a built-in music player.

### 3. User Authentication
- Implemented using Better Auth UI.
- Includes session handling, login, signup, password updates, and protected routes.

### 4. Database & Backend
- PostgreSQL database managed through Prisma ORM.
- Tracks, users, categories, likes, and sessions managed through Prisma schema.

### 5. Background Processing
- Uses Inngest for asynchronous music generation tasks.
- Ensures song generation is queued and processed efficiently.

### 6. Modern UI
- Built with:
  - TailwindCSS
  - shadcn/ui components
  - Zustand (music player state)
- Fully responsive layouts for desktop and mobile.

---

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- shadcn/ui
- Zustand

### Backend
- Prisma
- PostgreSQL
- Inngest (background jobs)
- Next.js server actions

### Cloud / Storage
- AWS S3
- AWS SDK v3
- Imagekit
### Authentication
- Better Auth
- Better Auth UI

---

## Project Structure
```
ai-music-generator/
│
├── prisma/                # Prisma schema & migrations
├── src/
│   ├── actions/           # Server actions (song generation, publishing, etc.)
│   ├── app/               # Next.js routes (auth pages, main pages)
│   ├── components/        # UI components & reusable elements
│   ├── inngest/           # Background job functions
│   ├── lib/               # Utilities (auth client, helpers)
│   ├── server/            # Database connection
│   ├── store/             # Zustand audio player store
│   └── styles/            # Global CSS
│
├── start-database.sh      # Local Postgres runner
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.example
```

---

## Environment Variables

The project requires valid credentials for:
- PostgreSQL
- AWS S3 / Imagekit 
- Auth secrets
- AI music generation endpoints
- Inngest keys

All required keys are listed in .env.example.

---

## How Music Generation Works

1. User submits a description, lyrics, or styles.
2. A new song entry is created with status "queued".
3. Inngest triggers the generate-song-event.
4. Backend calls the AI provider to generate audio and optional lyrics.
5. Resulting audio and thumbnails upload to AWS S3/Imagekit.
6. Song status updates to published, failed, or pending.
7. Users can play, download, or manage the track.

---

## Getting Started

### 1. Install Dependencies
npm install

### 2. Setup Environment
cp .env.example .env

Add your actual credentials.

### 3. Start Local Database (optional)
./start-database.sh

### 4. Sync Prisma Schema
npm run db:push

### 5. Start Development Server
npm run dev

---

## Scripts

Command | Description
--------|------------
npm run dev | Start development server
npm run build | Build production bundle
npm run start | Run production server
npm run db:push | Sync DB schema
npm run db:generate | Generate Prisma client
npm run lint | Lint
npm run format:write | Format files

---

## Core Folders Explained

### /src/actions/ 
Handles server-side logic such as:
- Generating songs
- Retrieving S3 presigned URLs
- Updating publish status
- Track renaming
- Likes system

### /src/app/(main)/
Frontend pages for:
- Music discovery
- Creating tracks
- Track list
- Audio player

### /src/app/(auth)/
Handles authentication routes.

### /src/store/
Contains Zustand store for the audio player.

---
## Music Player Features
- Play / Pause
- Seek
- Volume control
- Animated UI elements
- Artwork thumbnails
- Autoplay on track select

---
## Publishing System
Users can:
- Publish songs publicly
- Keep songs private
- Unpublish anytime

Homepage displays trending and categorized music (when fully implemented).

---
## Notes
This project is modular and easy to extend.
Possible expansions include:
- Playlist support
- Premium credit system
- Collaborative music generation
- Custom music models
