# Orpheus Build Environment Verification Script (Windows PowerShell)
# Run this to check if your environment matches the working configuration

Write-Host "🔍 Orpheus Build Environment Checker" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0

function Check-Version {
  param($name, $current, $expected)
  if ($current -eq $expected) {
    Write-Host "✓ $name`: $current" -ForegroundColor Green
    return $true
  }
  else {
    Write-Host "✗ $name`: $current (expected: $expected)" -ForegroundColor Red
    return $false
  }
}

function Check-Range {
  param($name, $current, $min)
  if ($current -ge $min) {
    Write-Host "✓ $name`: $current GB" -ForegroundColor Green
    return $true
  }
  else {
    Write-Host "✗ $name`: $current GB (minimum: $min GB)" -ForegroundColor Red
    return $false
  }
}

# Check Node.js
Write-Host "📦 Checking Node.js..."
try {
  $nodeVersion = (node -v) -replace 'v', ''
  $nodeMajor = $nodeVersion.Split('.')[0]
  if ($nodeMajor -eq "18") {
    Write-Host "✓ Node.js: v$nodeVersion" -ForegroundColor Green
  }
  else {
    Write-Host "⚠ Node.js: v$nodeVersion (recommended: 18.x)" -ForegroundColor Yellow
  }
}
catch {
  Write-Host "✗ Node.js: NOT FOUND" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check Java
Write-Host "☕ Checking Java..."
try {
  $javaOutput = java -version 2>&1
  $javaVersion = ($javaOutput | Select-String -Pattern 'version "?(\d+)' | ForEach-Object { $_.Matches.Groups[1].Value }) | Select-Object -First 1
  if (!(Check-Version "Java" $javaVersion "17")) { $errors++ }
}
catch {
  Write-Host "✗ Java: NOT FOUND" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check Android SDK
Write-Host "🤖 Checking Android SDK..."
if ($env:ANDROID_HOME) {
  Write-Host "✓ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
    
  # Check for SDK 35
  if (Test-Path "$env:ANDROID_HOME\platforms\android-35") {
    Write-Host "✓ Android SDK 35: Installed" -ForegroundColor Green
  }
  else {
    Write-Host "✗ Android SDK 35: NOT FOUND" -ForegroundColor Red
    $errors++
  }
    
  # Check for NDK
  if (Test-Path "$env:ANDROID_HOME\ndk\25.1.8937393") {
    Write-Host "✓ NDK 25.1.8937393: Installed" -ForegroundColor Green
  }
  else {
    Write-Host "✗ NDK 25.1.8937393: NOT FOUND" -ForegroundColor Red
    Write-Host "   Found NDKs:" -ForegroundColor Yellow
    Get-ChildItem "$env:ANDROID_HOME\ndk" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "   - $($_.Name)" }
    $errors++
  }
}
else {
  Write-Host "✗ ANDROID_HOME: NOT SET" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check Gradle
Write-Host "🐘 Checking Gradle..."
if (Test-Path ".\android\gradlew.bat") {
  $gradleProps = Get-Content ".\android\gradle\wrapper\gradle-wrapper.properties"
  $gradleUrl = $gradleProps | Select-String -Pattern "distributionUrl"
  if ($gradleUrl -match 'gradle-([0-9.]+)') {
    $gradleVersion = $matches[1]
    if (!(Check-Version "Gradle" $gradleVersion "8.8")) { $errors++ }
  }
}
else {
  Write-Host "✗ Gradle wrapper: NOT FOUND" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check package.json versions
Write-Host "📦 Checking package.json..."
if (Test-Path ".\package.json") {
  $packageJson = Get-Content ".\package.json" -Raw | ConvertFrom-Json
    
  $rnVersion = $packageJson.dependencies.'react-native' -replace '[\^~]', ''
  $reactVersion = $packageJson.dependencies.react -replace '[\^~]', ''
  $ghVersion = $packageJson.dependencies.'react-native-gesture-handler' -replace '[\^~]', ''
    
  if (!(Check-Version "React Native" $rnVersion "0.74.5")) { $errors++ }
  if (!(Check-Version "React" $reactVersion "18.2.0")) { $errors++ }
  if (!(Check-Version "gesture-handler" $ghVersion "2.14.1")) { $errors++ }
}
else {
  Write-Host "✗ package.json: NOT FOUND" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check android/build.gradle
Write-Host "🔧 Checking android/build.gradle..."
if (Test-Path ".\android\build.gradle") {
  $buildGradle = Get-Content ".\android\build.gradle" -Raw
    
  if ($buildGradle -match 'compileSdkVersion\s*=\s*(\d+)') {
    $compileSdk = $matches[1]
    if (!(Check-Version "compileSdk" $compileSdk "35")) { $errors++ }
  }
    
  if ($buildGradle -match 'ndkVersion\s*=\s*"([^"]+)"') {
    $ndkVersion = $matches[1]
    if (!(Check-Version "NDK version" $ndkVersion "25.1.8937393")) { $errors++ }
  }
    
  if ($buildGradle -match 'com\.android\.tools\.build:gradle:([0-9.]+)') {
    $agpVersion = $matches[1]
    if (!(Check-Version "Android Gradle Plugin" $agpVersion "8.5.2")) { $errors++ }
  }
}
else {
  Write-Host "✗ android/build.gradle: NOT FOUND" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check android/app/build.gradle for force resolution
Write-Host "🔒 Checking androidx.core force resolution..."
if (Test-Path ".\android\app\build.gradle") {
  $appBuildGradle = Get-Content ".\android\app\build.gradle" -Raw
  if ($appBuildGradle -match "force 'androidx\.core:core:1\.13\.1'") {
    Write-Host "✓ androidx.core force resolution: CONFIGURED" -ForegroundColor Green
  }
  else {
    Write-Host "✗ androidx.core force resolution: MISSING" -ForegroundColor Red
    Write-Host "   Add this to android/app/build.gradle:" -ForegroundColor Yellow
    Write-Host "   configurations.all {"
    Write-Host "       resolutionStrategy {"
    Write-Host "           force 'androidx.core:core:1.13.1'"
    Write-Host "           force 'androidx.core:core-ktx:1.13.1'"
    Write-Host "       }"
    Write-Host "   }"
    $errors++
  }
}
else {
  Write-Host "✗ android/app/build.gradle: NOT FOUND" -ForegroundColor Red
  $errors++
}
Write-Host ""

# Check RAM
Write-Host "💾 Checking system resources..."
try {
  $computerSystem = Get-CimInstance -ClassName Win32_ComputerSystem
  $totalRAM = [Math]::Round($computerSystem.TotalPhysicalMemory / 1GB)
  if (!(Check-Range "Total RAM" $totalRAM 7)) { $errors++ }
}
catch {
  Write-Host "⚠ Cannot determine RAM" -ForegroundColor Yellow
}
Write-Host ""

# Check disk space
Write-Host "💿 Checking disk space..."
try {
  $drive = (Get-Location).Drive.Name
  $disk = Get-PSDrive -Name $drive
  $freeSpace = [Math]::Round($disk.Free / 1GB)
  if (!(Check-Range "Free disk space" $freeSpace 25)) { $errors++ }
}
catch {
  Write-Host "⚠ Cannot determine disk space" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "====================================" -ForegroundColor Cyan
if ($errors -eq 0) {
  Write-Host "✅ All checks passed!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Your environment matches the working configuration."
  Write-Host "You should be able to build successfully with:"
  Write-Host "  npm run android" -ForegroundColor Cyan
}
else {
  Write-Host "❌ Found $errors issue(s)" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please fix the issues above before building."
  Write-Host ""
  Write-Host "Quick fixes:"
  Write-Host "  - Missing tools: See BUILD_REFERENCE.md"
  Write-Host "  - Wrong versions: Use Docker (see DOCKER_BUILD.md)"
  Write-Host "  - Low resources: Close other applications"
}
Write-Host ""
