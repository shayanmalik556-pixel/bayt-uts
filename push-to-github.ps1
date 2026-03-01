# Push this project to your GitHub repo
# You need: the HTTPS URL of your repo (e.g. https://github.com/yourusername/bayt-demo.git)

Write-Host ""
Write-Host "PUSH TO GITHUB" -ForegroundColor Cyan
Write-Host "--------------"
Write-Host ""
Write-Host "1. Open your repo on GitHub in the browser."
Write-Host "2. Click the green 'Code' button."
Write-Host "3. Copy the HTTPS URL (looks like https://github.com/username/repo-name.git)"
Write-Host ""

$url = Read-Host "Paste your repo URL here and press Enter"

if ([string]::IsNullOrWhiteSpace($url)) {
    Write-Host "No URL entered. Exiting." -ForegroundColor Red
    exit 1
}

$url = $url.Trim()
if (-not $url.EndsWith(".git")) { $url = $url + ".git" }

Write-Host ""
Write-Host "Adding remote and pushing..." -ForegroundColor Yellow

Set-Location $PSScriptRoot
git remote remove origin 2>$null
git remote add origin $url
git push -u origin main

Write-Host ""
Write-Host "Done. If it asked for a password, use a Personal Access Token from GitHub (Settings -> Developer settings -> Personal access tokens)." -ForegroundColor Green
