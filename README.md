# opBNB AI Assistant

A premium React + TypeScript application built on **opBNB** with AI-powered features, Supabase authentication, and seamless wallet integration.

![opBNB AI Assistant](https://via.placeholder.com/800x400/667eea/ffffff?text=opBNB+AI+Assistant)

## 🚀 Features

- **🤖 AI-Powered Assistant** - Get instant help with blockchain queries and smart contract analysis
- **⚡ Lightning Fast** - Built on opBNB for ultra-low gas fees and 4,000+ TPS
- **🔐 Secure Authentication** - Email/password auth with Supabase
- **💼 Auto Wallet Generation** - Automatic opBNB wallet creation and secure storage
- **🎨 Premium UI** - Modern glassmorphic design with smooth animations
- **📱 Fully Responsive** - Works perfectly on all devices

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Custom CSS (No frameworks)
- **Animation**: Framer Motion
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Blockchain**: ethers.js v6 + opBNB
- **State Management**: Zustand
- **Encryption**: crypto-js

## 🏗 Architecture

```
src/
├── components/          # React components
│   ├── Navbar.tsx      # Navigation with wallet status
│   ├── Hero.tsx        # Landing hero section
│   ├── Features.tsx    # Feature cards grid
│   ├── Stats.tsx       # opBNB performance stats
│   ├── Footer.tsx      # Footer with links
│   └── AuthModal.tsx   # Login/Signup modals
├── hooks/
│   └── useAuth.ts      # Authentication hook
├── lib/
│   ├── supabase.ts     # Supabase client config
│   └── wallet.ts       # Wallet utilities
├── services/
│   └── auth.ts         # Authentication service
├── store/
│   └── index.ts        # Zustand state management
├── styles/
│   ├── globals.css     # Global styles & variables
│   └── components.css  # Component-specific styles
└── sql/                # Database schema & queries
```

## 🗄️ Database Setup

### 1. Execute the SQL Schema

Run the following in your Supabase SQL editor:

```sql
-- Execute: sql/01_create_user_wallets_table.sql
```

This creates:
- `user_wallets` table with encrypted private key storage
- Row Level Security (RLS) policies
- Automatic timestamp handling
- Performance indexes

### 2. Table Structure

```sql
user_wallets:
- id (UUID, Primary Key)
- user_id (UUID, References auth.users)
- wallet_address (TEXT)
- encrypted_private_key (TEXT)  
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Security Features

- **Row Level Security**: Users can only access their own wallet data
- **Private Key Encryption**: AES encryption before database storage
- **Environment Variables**: Sensitive data stored in `.env`
- **Secure Session Handling**: Automatic session management with Supabase

## ⚙️ Environment Setup

Your `.env` file is already configured with:

```env
VITE_SUPABASE_URL=https://xszzbatmvdcbnksdrywf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENCRYPTION_KEY=opbnb-ai-assistant-encryption-key-2025
```

## 📦 Installation & Usage

1. **Install dependencies** (Already done!)
```bash
npm install
```

2. **Set up database**
- Go to your Supabase dashboard
- Run the SQL scripts from `sql/` folder
- Verify RLS is enabled

3. **Start development server**
```bash
npm run dev
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 🌟 User Flow

### New Users (Signup)
1. User visits homepage → clicks "Sign Up"
2. Enters email/password → submits form
3. **Automatic wallet generation** using ethers.js
4. Private key encrypted with crypto-js AES
5. User account + encrypted wallet stored in Supabase
6. User logged in with wallet connected

### Returning Users (Login)
1. User clicks "Login" → enters credentials
2. Supabase authenticates user
3. **Existing wallet fetched** from database
4. Private key decrypted securely
5. Wallet restored → user logged in

### Wallet Features
- View wallet address (formatted: 0x1234...abcd)
- Real-time balance updates
- opBNB testnet integration
- Secure transaction signing

## 🎨 UI/UX Features

### Design System
- **Glassmorphic UI** with backdrop blur effects
- **Dark Theme** optimized for crypto applications
- **Gradient Accents** for premium feel
- **Smooth Animations** using Framer Motion
- **Responsive Design** for all screen sizes

### Components
- **Premium Navbar** with wallet status
- **Hero Section** with animated CTAs
- **Feature Cards** with hover effects
- **Performance Stats** for opBNB
- **Modal System** for authentication

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🌐 opBNB Integration

- **Network**: opBNB Testnet
- **RPC URL**: https://opbnb-testnet-rpc.bnbchain.org
- **Chain ID**: 5611
- **Gas Fees**: <$0.001 per transaction
- **Block Time**: ~2 seconds
- **TPS**: 4,000+

## 📝 API Reference

### Authentication Service
```typescript
AuthService.signUp(email, password)     // Create account + wallet
AuthService.signIn(email, password)     // Login + fetch wallet  
AuthService.getUserWallet(userId)       // Get user's wallet
AuthService.signOut()                   // Sign out user
```

### Wallet Service  
```typescript
WalletService.generateWallet()          // Create new wallet
WalletService.encryptPrivateKey(key)    // Encrypt private key
WalletService.decryptPrivateKey(key)    // Decrypt private key
WalletService.getBalance(address)       // Get BNB balance
WalletService.formatAddress(address)    // Format for display
```

## 🗄️ SQL Commands for Supabase

Execute these in your Supabase SQL editor:

**1. Main table creation:**
```bash
# Copy and paste sql/01_create_user_wallets_table.sql
```

**2. Verify setup:**
- Check Tables → user_wallets exists
- Check Authentication → RLS enabled
- Check SQL Editor → Run test queries from sql/02_useful_queries.sql

---

**Built with ❤️ for the opBNB ecosystem**
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
