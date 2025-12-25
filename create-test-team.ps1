# Quick Test Data Generator
# יצירת נתוני בדיקה

Write-Host "Creating test team..." -ForegroundColor Cyan

$token = Read-Host "Enter instructor token (login first)"

$teamData = @{
    teamId = "TEAM-TEST-001"
    projectName = "AI Monitoring System"
    members = @(
        @{ name = "Alice"; email = "alice@test.com"; role = "leader" }
        @{ name = "Bob"; email = "bob@test.com"; role = "member" }
    )
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/teams" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -Body $teamData

Write-Host "✅ Team created: $($response.team.teamId)" -ForegroundColor Green
Write-Host ""
Write-Host "Now login as student and use Team ID: TEAM-TEST-001" -ForegroundColor Yellow
