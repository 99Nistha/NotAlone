# Not Alone — Technical Architecture

## Overview
A free web platform connecting parents of disabled/chronically ill children via AI-powered condition matching, group chat, and shared resource libraries.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, SEO, full-stack in one repo |
| Styling | Tailwind CSS | Rapid, responsive UI |
| Auth | Supabase Auth | Free, built-in JWT, social login ready |
| Database | Supabase PostgreSQL | Managed Postgres, realtime built-in |
| File Storage | Supabase Storage | Document upload for medical files |
| Realtime Chat | Supabase Realtime | WebSocket-based live messages |
| AI Matching | Anthropic Claude API (claude-haiku-4-5) | Normalize condition descriptions cheaply |
| Deployment | Vercel | Native Next.js hosting, CI/CD from GitHub |

---

## End-to-End User Flow

```
1. Parent visits notalone.app
        ↓
2. Reads landing page → clicks "Join Free"
        ↓
3. Registers (name, email, password) → Supabase Auth
        ↓
4. Onboarding: describes child's condition in plain English
   + optional medical doc upload
        ↓
5. Claude API normalizes → "Food Protein-Induced Enterocolitis Syndrome (FPIES)"
        ↓
6. Similarity search finds matching group OR creates new one
        ↓
7. User lands on Dashboard → sees their group(s)
        ↓
8. Opens group → real-time chat with other parents
        ↓
9. Browses / adds to "What's worked for us" resource library
```

---

## Database Schema

```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users,
  full_name   TEXT,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE children (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name                  TEXT,
  age                   INT,
  condition_description TEXT,   -- raw free-text from parent
  condition_normalized  TEXT,   -- Claude-normalized standard name
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_name  TEXT NOT NULL UNIQUE,
  description     TEXT,
  member_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  child_id    UUID REFERENCES children(id),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID REFERENCES children(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id),
  file_path   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ai/match-condition` | Claude normalizes condition text → returns group |
| GET | `/api/groups` | List all groups |
| GET | `/api/groups/[id]` | Get group details + members |
| POST | `/api/groups/[id]/join` | Join a group |
| GET | `/api/groups/[id]/messages` | Fetch chat history |
| POST | `/api/groups/[id]/messages` | Post a message |
| GET | `/api/groups/[id]/resources` | Get resource library |
| POST | `/api/groups/[id]/resources` | Add a resource |
| POST | `/api/children` | Create child profile |
| POST | `/api/documents/upload` | Upload medical document |

---

## AI Matching Logic

```
User input: "My daughter has a rare genetic condition where her muscles waste away"

↓ Sent to Claude (claude-haiku-4-5):
  Prompt: "You are a medical terminology expert. Convert this parent's description
  of their child's condition into the standard medical condition name.
  Return ONLY the condition name, nothing else.
  Description: [user input]"

↓ Claude returns: "Spinal Muscular Atrophy (SMA)"

↓ Query DB: SELECT * FROM groups WHERE condition_name ILIKE '%spinal muscular%'

↓ If found: add user to group
  If not found: create new group with that condition name, add user
```

---

## Directory Structure

```
NotAlone/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (protected)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── groups/[id]/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   ├── api/
│   │   │   ├── ai/match-condition/route.ts
│   │   │   ├── groups/route.ts
│   │   │   ├── groups/[id]/route.ts
│   │   │   ├── groups/[id]/messages/route.ts
│   │   │   ├── groups/[id]/resources/route.ts
│   │   │   └── children/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx          ← Landing page
│   ├── components/
│   │   ├── ui/               ← Buttons, inputs, cards
│   │   ├── chat/             ← ChatWindow, MessageBubble
│   │   ├── groups/           ← GroupCard, GroupList
│   │   └── layout/           ← Navbar, Footer
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts     ← Browser client
│   │   │   └── server.ts     ← Server client
│   │   └── anthropic.ts      ← Claude API helper
│   └── types/
│       └── index.ts          ← Shared TypeScript types
├── supabase/
│   └── schema.sql            ← Full DB schema
├── ARCHITECTURE.md
├── .env.local.example
└── README.md
```

---

## Security Considerations
- All health data stored in Supabase with Row Level Security (RLS) enabled
- Users can only read their own children's data
- Group messages readable by group members only
- Document uploads stored in private Supabase bucket
- HTTPS enforced on Vercel
- No PII exposed in API responses beyond what the user owns

---

## Excalidraw Architecture Diagram
Import `architecture.excalidraw` into https://excalidraw.com to view the visual architecture.
