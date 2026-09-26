export interface Group {
  id: string;
  condition_name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Partial<Profile> | null;
}

export interface Resource {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string | null;
  created_at: string;
  profiles?: Partial<Profile> | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  profiles?: Partial<Profile> | null;
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
