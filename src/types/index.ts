export interface Profile {
  id: string;
  full_name: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  age: number | null;
  condition_description: string | null;
  condition_normalized: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  condition_name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  user_id: string;
  group_id: string;
  child_id: string | null;
  joined_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Resource {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface Document {
  id: string;
  child_id: string;
  user_id: string;
  file_path: string;
  file_name: string | null;
  created_at: string;
}
