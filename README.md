# Not Alone

> A free community connecting parents of disabled and chronically ill children with families facing the same condition.

## What is this?

Not Alone uses AI-powered matching to connect parents by their child's specific diagnosis — enabling real peer support through group chat and shared knowledge libraries.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database + Auth + Realtime**: Supabase
- **AI Condition Matching**: Anthropic Claude API
- **Deployment**: Vercel

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/99Nistha/NotAlone.git
cd NotAlone
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Realtime for the `messages` table

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

### 4. Run locally

```bash
npm run dev
```

Visit https://not-alone-jade.vercel.app/

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical documentation.

Import `architecture.excalidraw` into [excalidraw.com](https://excalidraw.com) for the visual diagram.

## User Flow

1. Parent registers
2. Describes child's condition in plain English
3. Claude API normalizes it to a standard medical term
4. Parent is matched to a condition-specific group
5. Real-time group chat + shared resource library

## License

MIT — free forever for families.
