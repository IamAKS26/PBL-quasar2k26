# Supabase Integration - Quick Start

## 🚀 Get Started in 5 Steps

### 1. **Create Your Supabase Project** (5 minutes)

1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose a name: `pbl-platform`
4. Save your database password somewhere safe!
5. Wait ~2 minutes for setup to complete

### 2. **Run the Database Migration** (2 minutes)

1. In Supabase Dashboard → **SQL Editor**
2. Click "+ New query"
3. Copy **entire contents** of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. Verify success message appears

### 3. **Get Your API Keys** (1 minute)

1. Supabase Dashboard → **Settings** → **API**
2. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

### 4. **Configure Your App** (1 minute)

1. Create `.env.local` file in your project root:
   ```bash
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

2. Replace with YOUR actual values (no quotes needed)

### 5. **Create Your Teacher Account** (2 minutes)

Run this in **SQL Editor** (replace with your details):

```sql
-- Step 1: Create auth user
INSERT INTO auth.users (
  id,
  email, 
  encrypted_password, 
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'teacher@school.com',
  crypt('your-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Step 2: Update profile to teacher role
UPDATE user_profiles 
SET 
  role = 'teacher',
  full_name = 'Your Full Name'
WHERE email = 'teacher@school.com';
```

---

## ✅ Verify It Works

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Login with your teacher credentials

4. Check browser console - no errors = success! 🎉

---

## 📊 What You Get

✅ **15+ Database Tables** ready to use
✅ **Row-Level Security** protecting your data
✅ **Real-time Subscriptions** for live updates
✅ **Authentication** built-in
✅ **Analytics Storage** for student tracking

---

## 🔥 Next Steps

### Integrate Authentication

Replace `App.tsx` useState with Supabase auth:

```tsx
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading, signIn, signOut } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <LoginView onLogin={signIn} />;
  }
  
  // ... rest of your app
}
```

### Use Real Data

Replace mock groups with Supabase:

```tsx
import { useGroups } from './hooks/useGroups';

function TeacherDashboard() {
  const { groups, loading, createGroup } = useGroups(user.id);
  
  // groups is now from database!
}
```

---

## 🆘 Troubleshooting

### "Missing environment variables"
- Check `.env.local` exists
- Verify no typos in variable names
- Restart dev server after creating .env.local

### "Failed to fetch"
- Verify Supabase project is not paused
- Check URL ends with `.supabase.co`
- Test connection at https://status.supabase.com

### Can't login
- Run the SQL query again to create user
- Check email/password are correct
- Verify user_profiles role is 'teacher'

---

## 📚 Full Documentation

For detailed setup: See `SUPABASE_SETUP.md`

For API usage: Check `hooks/useAuth.ts` and `hooks/useGroups.ts`

---

**Ready to migrate your entire app to persistent data?** Let me know and I'll help integrate all components! 🚀
