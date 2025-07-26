# Environment Variables Setup Guide

## 🔐 Security Notice
**NEVER commit your .env file to version control!** The .env file contains sensitive API keys and should remain local to your development environment.

## 📋 Quick Setup

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Get Your Supabase Credentials
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. Update Your .env File
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Verify Setup
Start the app and check the console for:
```
✅ Environment configuration loaded successfully
```

## 🏗️ Production Deployment

### For EAS Build
```bash
# Set environment variables for EAS
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_url"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_key"
```

### For Different Environments
Create separate environment files:
- `.env.development` - Local development
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

## 🔍 Troubleshooting

### Missing Environment Variables Error
If you see this error:
```
Missing required environment variable: EXPO_PUBLIC_SUPABASE_URL
```

**Solution:**
1. Ensure your .env file exists in the project root
2. Check that the variable names match exactly (including `EXPO_PUBLIC_` prefix)
3. Restart the Expo development server after making changes

### Invalid URL/Token Format Error
If you see validation errors:
- **URL Error**: Ensure your Supabase URL is complete and starts with `https://`
- **Token Error**: Ensure your anon key starts with `eyJ` (valid JWT format)

## 🛡️ Security Best Practices

1. **Never commit .env files** - Always in .gitignore
2. **Use different keys for different environments** - Don't reuse production keys in development
3. **Rotate keys regularly** - Update your Supabase keys periodically
4. **Limit key permissions** - Use Row Level Security (RLS) in Supabase
5. **Monitor usage** - Check Supabase dashboard for unusual activity

## 📁 File Structure
```
├── .env                 # Your local environment variables (DO NOT COMMIT)
├── .env.example        # Template for other developers
├── app.config.js       # Expo configuration with environment support
└── src/config/env.ts   # Secure configuration management
```

## 🔄 Migration from Hardcoded Values
This project has been updated to use secure environment variables instead of hardcoded API keys. The old configuration has been completely removed for security reasons.

## 📞 Need Help?
If you encounter issues with environment setup:
1. Check that your .env file is in the project root directory
2. Verify your Supabase credentials are correct
3. Restart the development server after making changes
4. Check the console for detailed error messages