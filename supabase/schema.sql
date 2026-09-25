-- Not Alone — Supabase Database Schema
-- Run this in the Supabase SQL editor after creating your project

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   TEXT,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Children
CREATE TABLE IF NOT EXISTS children (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  age                   INT,
  condition_description TEXT,
  condition_normalized  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Condition-based Groups
CREATE TABLE IF NOT EXISTS groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_name  TEXT NOT NULL,
  description     TEXT,
  member_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Group Memberships
CREATE TABLE IF NOT EXISTS group_members (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  child_id    UUID REFERENCES children(id) ON DELETE SET NULL,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Library
CREATE TABLE IF NOT EXISTS resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded Documents (medical files)
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID REFERENCES children(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  file_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS) Policies
-- ─────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/edit their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Children: only parent can manage
CREATE POLICY "Parents manage own children"
  ON children FOR ALL USING (auth.uid() = parent_id);

-- Groups: anyone authenticated can read
CREATE POLICY "Authenticated users can read groups"
  ON groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Group members: read own, join any
CREATE POLICY "Users see own memberships"
  ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages: members of the group can read/write
CREATE POLICY "Group members can read messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Group members can send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Resources: group members can read/write
CREATE POLICY "Group members can read resources"
  ON resources FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = resources.group_id
      AND group_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Group members can add resources"
  ON resources FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = resources.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Documents: only the owner
CREATE POLICY "Users manage own documents"
  ON documents FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Function: auto-create profile on user signup
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- Function: increment group member count
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_group_join
  AFTER INSERT ON group_members
  FOR EACH ROW EXECUTE FUNCTION increment_member_count();

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
