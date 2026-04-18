# Harbour Setup

This project now includes real Supabase Edge Function entrypoints for:

- `harbour-provision-user`
- `harbour-upload`
- `harbour-download`
- `harbour-list`

They are designed to use one Google Drive root folder named `SAILY` in your Google Drive account as the app's main storage root. Each user gets a child folder created from their username and the folder id is stored on their profile row.

## What This Setup Gives You

- Your Google Drive acts as the Harbour root storage.
- Every signed-in user gets a dedicated berth folder under `SAILY`.
- Folder ids are stored in `profiles.harbour_folder_id`.
- Uploads, listing, and downloads go through Supabase Edge Functions.
- Vault files and media uploads can use the Harbour instead of only Supabase buckets.

## Important Current Limitation

The Drive backend is now wired, but the current media encryption model in [src/crypto/encryption.js](</S:/new_app/src/crypto/encryption.js>) uses the uploader's local secret for file encryption. That means fully shared encrypted social media still needs a key-sharing design if other users must decrypt Harbour-hosted media directly. Storage is implemented, but shared-media cryptography still needs a follow-up design if you want pure zero-knowledge sharing for feed media.

## Database

Run the updated [supabase_schema.sql](</S:/new_app/supabase_schema.sql>) or at minimum apply:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS harbour_folder_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS harbour_folder_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS harbour_provisioned_at TIMESTAMP WITH TIME ZONE;
```

Make sure `hub_config` has exactly one row.

Example:

```sql
insert into public.hub_config (master_refresh_token, master_folder_id)
values ('YOUR_GOOGLE_REFRESH_TOKEN', '')
on conflict do nothing;
```

If `master_folder_id` is blank or invalid, the functions will create or recover a root `SAILY` folder and persist that id back into `hub_config`.

## Google Cloud Requirements

Create OAuth credentials for a Google account that owns the 5TB Drive root:

- OAuth client id
- OAuth client secret
- A refresh token for that Google account with Drive access

Required Drive scope:

- `https://www.googleapis.com/auth/drive`

## Supabase Edge Function Secrets

Set these in Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Deploy Functions

From your Supabase project workspace, deploy:

```bash
supabase functions deploy harbour-provision-user
supabase functions deploy harbour-upload
supabase functions deploy harbour-download
supabase functions deploy harbour-list
```

## User Folder Provisioning

Folder provisioning is triggered automatically from the app after login/profile fetch if `profiles.harbour_folder_id` is empty.

That means:

- new users get their berth folder on first authenticated app session
- existing users get a berth folder the next time they log in

## Folder Naming

User folders are created from the current username value, sanitized for Drive-safe naming.

Examples:

- `gopi`
- `john-doe`
- `anna_123`

The app stores the Drive folder id after creation, so later username changes will not break existing file access. If you want folder renaming on username change, that can be added as a follow-up.
