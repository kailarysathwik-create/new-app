-- 1. Profiles (Extension of auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT, 
  phone TEXT, -- Stored for login resolution and reference
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  public_key TEXT, -- Base64 encoded Curve25519 public key
  cloud_node_folder_id TEXT, -- ID of the 'SAILY' folder on user's personal cloud
  harbour_folder_id TEXT, -- Google Drive folder ID for this user's berth inside the master SAILY folder
  harbour_folder_name TEXT, -- Folder name created from the user's username
  harbour_provisioned_at TIMESTAMP WITH TIME ZONE,
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

-- 3. Feed / Anchors
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption TEXT,
  media_url TEXT NOT NULL, 
  thumbnail_url TEXT,
  cloud_file_id TEXT, -- ID of the encrypted file on user's 'SAILY' cloud folder
  song_title TEXT,
  song_artist TEXT,
  song_preview_url TEXT,
  song_artwork_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Breezes (Stories)
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cloud_file_id TEXT, -- ID of the encrypted story on user's 'SAILY' cloud folder
  song_title TEXT,
  song_artist TEXT,
  song_preview_url TEXT,
  song_artwork_url TEXT,
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

-- 8. Notifications (Radar Signals)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- recipient
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- sender
  type TEXT NOT NULL, -- 'follow_request', 'follow_accept'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Storage Buckets
-- Note: You'll need to create these manually in the Supabase Dashboard
-- Buckets: 'avatars', 'feed_media', 'stories_media'

-- RLS (Row Level Security) - Basic Setup (You may need to refine these)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anchors are viewable by mutual followers." ON public.posts FOR SELECT USING (
  auth.uid() = user_id OR
  (
    EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = posts.user_id AND status = 'accepted') AND
    EXISTS (SELECT 1 FROM public.follows WHERE follower_id = posts.user_id AND following_id = auth.uid() AND status = 'accepted')
  )
);
CREATE POLICY "Users can insert own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Breezes are viewable by followers." ON public.stories FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = stories.user_id AND status = 'accepted')
);
CREATE POLICY "Users can insert own stories." ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- 9. Hub Configuration (Master Drive Store)
CREATE TABLE public.hub_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_refresh_token TEXT NOT NULL,
  master_folder_id TEXT NOT NULL, -- The 'SAILY' root folder ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure only one hub config exists
CREATE UNIQUE INDEX single_row_index ON public.hub_config ((id IS NOT NULL));

-- 10. Profile Trigger
-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'sailor_' || substr(new.id::text, 1, 8)),
    new.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Follow & Notification Triggers
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    INSERT INTO public.notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow_request');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    INSERT INTO public.notifications (user_id, actor_id, type)
    VALUES (NEW.follower_id, NEW.following_id, 'follow_accept');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR UPDATE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();

-- Harbour profile metadata backfill for existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS harbour_folder_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS harbour_folder_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS harbour_provisioned_at TIMESTAMP WITH TIME ZONE;
