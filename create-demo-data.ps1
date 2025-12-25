Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Creating 20 Students + 5 Teams Demo Data           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:5000/api"

# Step 1: Login as instructor
Write-Host "[1/3] Logging in as instructor..." -ForegroundColor Yellow

$loginBody = @{
    email = "instructor@test.com"
    password = "test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "  OK: Logged in successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to login. Make sure server is running!" -ForegroundColor Red
    exit
}

# Step 2: Create 20 students
Write-Host ""
Write-Host "[2/3] Creating 20 students..." -ForegroundColor Yellow

$students = @(
    @{ name = "אריאל כהן"; email = "ariel.cohen@student.com" }
    @{ name = "תמר לוי"; email = "tamar.levi@student.com" }
    @{ name = "יונתן מזרחי"; email = "yonatan.mizrahi@student.com" }
    @{ name = "נועה אברהם"; email = "noa.avraham@student.com" }
    @{ name = "דניאל ביטון"; email = "daniel.biton@student.com" }
    @{ name = "שירה גולן"; email = "shira.golan@student.com" }
    @{ name = "עומר דהן"; email = "omer.dahan@student.com" }
    @{ name = "מיכל פרץ"; email = "michal.peretz@student.com" }
    @{ name = "רון שמיר"; email = "ron.shamir@student.com" }
    @{ name = "ליאור חיים"; email = "lior.haim@student.com" }
    @{ name = "עדי בן דוד"; email = "adi.bendavid@student.com" }
    @{ name = "יעל ברק"; email = "yael.barak@student.com" }
    @{ name = "איתי רוזן"; email = "itai.rosen@student.com" }
    @{ name = "מור אלון"; email = "mor.alon@student.com" }
    @{ name = "גיא סלע"; email = "guy.sela@student.com" }
    @{ name = "הילה זהבי"; email = "hila.zahavi@student.com" }
    @{ name = "אורי שחר"; email = "uri.shahar@student.com" }
    @{ name = "רותם כץ"; email = "rotem.katz@student.com" }
    @{ name = "טל ויזל"; email = "tal.wiesel@student.com" }
    @{ name = "שני גבאי"; email = "shani.gabay@student.com" }
)

foreach ($student in $students) {
    $registerBody = @{
        email = $student.email
        password = "student123"
        name = $student.name
        role = "student"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$API_URL/auth/register" `
            -Method POST `
            -Body $registerBody `
            -ContentType "application/json" | Out-Null
        
        Write-Host "  ✓ Created: $($student.name)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Skipped: $($student.name) (exists)" -ForegroundColor Yellow
    }
}

# Step 3: Create 5 teams
Write-Host ""
Write-Host "[3/3] Creating 5 teams..." -ForegroundColor Yellow

$teams = @(
    @{
        teamId = "TEAM-001"
        projectName = "מערכת IoT לחקלאות חכמה"
        members = @(
            @{ name = $students[0].name; email = $students[0].email; role = "leader" }
            @{ name = $students[1].name; email = $students[1].email; role = "member" }
            @{ name = $students[2].name; email = $students[2].email; role = "member" }
            @{ name = $students[3].name; email = $students[3].email; role = "member" }
        )
    }
    @{
        teamId = "TEAM-002"
        projectName = "אפליקציית ניהול זמן באמצעות AI"
        members = @(
            @{ name = $students[4].name; email = $students[4].email; role = "leader" }
            @{ name = $students[5].name; email = $students[5].email; role = "member" }
            @{ name = $students[6].name; email = $students[6].email; role = "member" }
            @{ name = $students[7].name; email = $students[7].email; role = "member" }
        )
    }
    @{
        teamId = "TEAM-003"
        projectName = "פלטפורמת למידה אינטראקטיבית"
        members = @(
            @{ name = $students[8].name; email = $students[8].email; role = "leader" }
            @{ name = $students[9].name; email = $students[9].email; role = "member" }
            @{ name = $students[10].name; email = $students[10].email; role = "member" }
            @{ name = $students[11].name; email = $students[11].email; role = "member" }
        )
    }
    @{
        teamId = "TEAM-004"
        projectName = "מערכת ניטור בריאות חכמה"
        members = @(
            @{ name = $students[12].name; email = $students[12].email; role = "leader" }
            @{ name = $students[13].name; email = $students[13].email; role = "member" }
            @{ name = $students[14].name; email = $students[14].email; role = "member" }
            @{ name = $students[15].name; email = $students[15].email; role = "member" }
        )
    }
    @{
        teamId = "TEAM-005"
        projectName = "בוט צ'אט לשירות לקוחות"
        members = @(
            @{ name = $students[16].name; email = $students[16].email; role = "leader" }
            @{ name = $students[17].name; email = $students[17].email; role = "member" }
            @{ name = $students[18].name; email = $students[18].email; role = "member" }
            @{ name = $students[19].name; email = $students[19].email; role = "member" }
        )
    }
)

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

foreach ($team in $teams) {
    $teamBody = $team | ConvertTo-Json -Depth 10

    try {
        Invoke-RestMethod -Uri "$API_URL/teams" `
            -Method POST `
            -Body $teamBody `
            -Headers $headers | Out-Null
        
        Write-Host "  ✓ Created: $($team.teamId) - $($team.projectName)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed: $($team.teamId)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          Demo Data Created Successfully!              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✓ 20 Students created" -ForegroundColor Green
Write-Host "✓ 5 Teams created (4 students each)" -ForegroundColor Green
Write-Host ""
Write-Host "Login as student: ariel.cohen@student.com / student123" -ForegroundColor Cyan
Write-Host "Login as instructor: instructor@test.com / test123456" -ForegroundColor Cyan
Write-Host ""
