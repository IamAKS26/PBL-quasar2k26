# Supabase Setup Guide for PBL Platform

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or email
4. Click "New Project"
5. Fill in:
   - **Name**: `pbl-platform` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is perfect to start
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your API Keys

1. Once your project is ready, go to **Settings** (⚙️ icon in left sidebar)
2. Click **API** in the settings menu
3. Find these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
4. Copy these values

## Step 3: Configure Your App

1. In your project folder, create `.env.local` file:
   ```bash
   copy .env.local.example .env.local
   ```

2. Open `.env.local` and paste your values:
   ```env
   VIT E_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

3. **IMPORTANT**: Add `.env.local` to `.gitignore` (already done!)

## Step 4: Run Database Migrations

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click "+ New query"
4. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** (bottom right)
7. Wait for "Success. No rows returned" message

### Verify Tables Were Created

1. Click **Table Editor** in left sidebar
2. You should see all these tables:
   - `user_profiles`
   - `schools`
   - `groups`
   - `students`
   - `mastery_scores`
   - `projects`
   - `project_phases`
   - `tasks`
   - `submissions`
   - `feedback`
   - `badges`
   - `group_badges`
   - `student_badges`
   - `activity_logs`
   - `project_resources`
   - `rubrics`
   - `rubric_criteria`

## Step 5: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) Configure email templates in **Authentication** → **Email Templates**

## Step 6: Test Your Connection

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12)
3. You should see no Supabase connection errors

## Step 7: Create Your First Teacher Account

### Option A: Through Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter:
   - **Email**: your-email@example.com
   - **Password**: Choose a password
   - **Auto Confirm User**: ✅ (check this!)
4. Click "Create user"

5. Go to **Table Editor** → **user_profiles**
6. Click "Insert" → "Insert row"
7. Fill in:
   - **id**: Copy the UUID from the user you just created
   - **email**: Same email as above
   - **full_name**: Your name
   - **role**: `teacher`
8. Click "Save"

### Option B: Through SQL (Faster)

1. Go to **SQL Editor**
2. Run this query (replace with your details):
   ```sql
   -- Create auth user
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES (
     'teacher@example.com',
     crypt('your-password-here', gen_salt('bf')),
     NOW()
   );

   -- Get the user ID
   SELECT id FROM auth.users WHERE email = 'teacher@example.com';

   -- Update the profile (use the ID from above)
   UPDATE user_profiles 
   SET role = 'teacher', full_name = 'Your Name'
   WHERE email = 'teacher@example.com';
   ```

## Step 8: Optional - Create a School

1. Go to **Table Editor** → **schools**
2. Click "Insert row"
3. Enter:
   - **name**: "My School Name"
4. Click "Save"
5. Copy the generated `id` (UUID)

6. Go to **user_profiles** table
7. Find your teacher profile
8. Edit it and set **school_id** to the UUID you copied

## Common Issues & Solutions

### ❌ "Invalid API key"
- Check your `.env.local` has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Make sure there are no quotes around the values
- Restart dev server after changing .env.local

### ❌ "Failed to fetch"
- Check your internet connection
- Verify Supabase project is not paused (free tier pauses after inactivity)
- Check Supabase status page: https://status.supabase.com

### ❌ "Row level security policy violation"
- RLS is enabled by default
- Policies are already set up in migration
- If you can't read data, you might not be authenticated
- Check `supabase.auth.getUser()` returns a user

### ❌ Tables not showing up
- Make sure you ran the ENTIRE migration script
- Check for SQL errors in the output
- Try running sections one at a time if needed

## Next Steps

Once setup is complete, you're ready to:

1. ✅ Test authentication in your app
2. ✅ Create groups and students from the app
3. ✅ Start using real-time subscriptions
4. ✅ Enable analytics with persistent data

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Discord Community**: https://discord.supabase.com
- **Status Page**: https://status.supabase.com

## Security Best Practices

✅ **DO**:
- Keep `.env.local` private (never commit to git)
- Use Row Level Security (RLS) policies
- Validate data on both client and server
- Use service role key ONLY on backend/secure functions

❌ **DON'T**:
- Share your database password publicly
- Expose service_role key in frontend code
- Disable RLS without understanding implications
- Store sensitive data unencrypted
