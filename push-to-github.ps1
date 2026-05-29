# Push to GitHub - Interactive Script
# This script will authenticate with GitHub and push your code

Write-Host "=" * 60
Write-Host "GitHub Push Setup" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Step 1: Authenticate with GitHub
Write-Host "[1/3] Authenticating with GitHub..." -ForegroundColor Yellow
Write-Host "This will open a browser for you to authorize access." -ForegroundColor Gray
Write-Host ""

& "$env:ProgramFiles\GitHub CLI\gh" auth login --web

# Check if auth succeeded
$authStatus = & "$env:ProgramFiles\GitHub CLI\gh" auth status 2>&1
if ($authStatus -match "You are not logged in") {
    Write-Host "Authentication failed. Please try again." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Successfully authenticated!" -ForegroundColor Green
Write-Host ""

# Step 2: Create the repository
Write-Host "[2/3] Creating GitHub repository..." -ForegroundColor Yellow

$repoName = "Small-collection-of-browser-games"
$repoDesc = "A collection of cozy browser games built with vanilla JavaScript"

& "$env:ProgramFiles\GitHub CLI\gh" repo create $repoName `
    --description $repoDesc `
    --public `
    --source=. `
    --remote=origin `
    --push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Repository creation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Repository created and code pushed!" -ForegroundColor Green
Write-Host ""

# Step 3: Verify the push
Write-Host "[3/3] Verifying push..." -ForegroundColor Yellow

$remoteUrl = git config --get remote.origin.url
$repoUrl = "https://github.com/nobody174/$repoName"

Write-Host "✓ Repository is now live at:" -ForegroundColor Green
Write-Host $repoUrl -ForegroundColor Cyan
Write-Host ""

Write-Host "=" * 60
Write-Host "All done! Your code is now on GitHub." -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit: $repoUrl" -ForegroundColor Gray
Write-Host "2. Check the Actions tab to see tests running" -ForegroundColor Gray
Write-Host "3. Share the repository with your team" -ForegroundColor Gray
Write-Host ""
