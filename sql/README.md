# SQL Setup Instructions

## 1. Execute the main table creation script
Run the following SQL script in your Supabase SQL editor:

```sql
-- Execute: 01_create_user_wallets_table.sql
-- Execute: 03_create_user_profiles_table.sql (optional)
```

This script will:
- Create the `user_wallets` table with proper structure
- Create the `user_profiles` table (optional, for extended user data)
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Add automatic timestamp handling
- Set up triggers for automatic profile creation

## 2. Verify the setup
After running the script, you can verify the setup by:

1. Go to Supabase Dashboard → Table Editor
2. Check that the `user_wallets` table exists
3. Verify that RLS is enabled
4. Check the policies are in place

## 3. Optional queries
Use the queries in `02_useful_queries.sql` for:
- Getting user wallet data
- Checking wallet existence
- Admin monitoring (if needed)

## Table Structure
```
user_wallets:
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- wallet_address (TEXT)
- encrypted_private_key (TEXT)  
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

user_profiles (optional):
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- full_name (TEXT)
- avatar_url (TEXT)
- bio (TEXT)
- preferences (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Security Features
- Row Level Security ensures users only access their own data
- Private keys are encrypted before storage
- Automatic cascade deletion when user is deleted
- Proper indexing for performance
