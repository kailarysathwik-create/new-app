-- 1. Profiles (Extension of auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT, -- Stored to allow username-based login resolution
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  public_key TEXT, -- Base64 encoded Curve25519 public key
  cloud_node_folder_id TEXT, -- ID of the 'SAILY' folder on user's personal cloud
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Follow Graph
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(follower_id, following_id)
);

-- 3. Feed / Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT,
  media_url TEXT NOT NULL, 
  thumbnail_url TEXT,
  cloud_file_id TEXT, -- ID of the encrypted file on user's 'SAILY' cloud folder
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Stories
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cloud_file_id TEXT, -- ID of the encrypted story on user's 'SAILY' cloud folder
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Conversations (Chat rooms)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Chat Participants
CREATE TABLE public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- 7. E2E Encrypted Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL, -- Message content encrypted with TweetNaCl
  nonce TEXT NOT NULL,             -- Unique nonce for the encryption
  allow_view BOOLEAN DEFAULT true,
  allow_download BOOLEAN DEFAULT false,
  allow_forward BOOLEAN DEFAULT false,
  auto_delete_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Storage Buckets
-- Note: You'll need to create these manually in the Supabase Dashboard
-- Buckets: 'avatars', 'feed_media', 'stories_media'

-- RLS (Row Level Security) - Basic Setup (You may need to refine these)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by followers or everyone if public." ON public.posts FOR SELECT USING (true); -- Simplify for MVP
CREATE POLICY "Users can insert own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages are viewable by participants." ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Participants can insert messages." ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

-- Realtime Setup
-- Remember to turn on 'Realtime' for the 'messages' table in Supabase Dashboard (Database -> Replication)
