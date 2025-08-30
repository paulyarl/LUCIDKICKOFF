# Setup script for LucidCraft
Write-Host "Setting up LucidCraft project..." -ForegroundColor Cyan

# Navigate to web directory
Set-Location "$PSScriptRoot\apps\web"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Create .env.local file if it doesn't exist
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
NODE_ENV=development
"@ | Out-File -FilePath $envFile -Encoding utf8
    
    Write-Host "Created .env.local file. Please update it with your credentials." -ForegroundColor Green
}

# Install shadcn/ui components
Write-Host "Installing shadcn/ui components..." -ForegroundColor Yellow
npx shadcn-ui@latest init

Write-Host "Setup complete! Run 'npm run dev' to start the development server." -ForegroundColor Green
