-- Additional useful queries for the opBNB AI Assistant

-- Query to get user wallet information
-- SELECT * FROM public.user_wallets WHERE user_id = auth.uid();

-- Query to check if user has a wallet
-- SELECT EXISTS(SELECT 1 FROM public.user_wallets WHERE user_id = auth.uid());

-- Query to update wallet information (if needed)
-- UPDATE public.user_wallets 
-- SET wallet_address = 'new_address', encrypted_private_key = 'new_encrypted_key'
-- WHERE user_id = auth.uid();

-- Query to get total number of wallets created
-- SELECT COUNT(*) as total_wallets FROM public.user_wallets;

-- Query to get recent wallet creations (admin use)
-- SELECT 
--     w.wallet_address,
--     w.created_at,
--     u.email
-- FROM public.user_wallets w
-- JOIN auth.users u ON w.user_id = u.id
-- ORDER BY w.created_at DESC
-- LIMIT 10;
