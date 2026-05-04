# SAILY LOCAL BUILD ENGINE v8.1
# -------------------------------------------
Write-Host "--- STARTING LOCAL BUILD ---"

# 1. Stop Gradle daemons
Write-Host "[1/5] Stopping Gradle daemons..."
taskkill /F /IM java.exe /T 2>$null
taskkill /F /IM node.exe /T 2>$null
Start-Sleep -Seconds 3

# 2. Preparation
Write-Host "[2/5] Patching Manual Native Project..."
powershell -ExecutionPolicy Bypass -File .\patch-expo-cli.ps1

# 3. Skip Prebuild (Project Hand-Crafted)
Write-Host "[3/5] Skipping Prebuild (Using manually restored project)..."

# 4. Configure SDK
Write-Host "[4/5] Configuring Local Properties..."
$sdkPath = "C:/Users/GOPI GUNDLAPLLI/AppData/Local/Android/Sdk"
"sdk.dir=$sdkPath" | Out-File -FilePath "android/local.properties" -Encoding ascii

# 5. Compiling Signed APK (Direct)
Write-Host "[5/5] Compiling Signed APK (Direct Native Flow)..."

# Nuclear Pre-Patch
& ".\pre-patch.ps1"

Set-Location -Path "C:\saily_release\android"
.\gradlew.bat assembleRelease --no-build-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== BUILD SUCCESSFUL ==="
    Write-Host "APK: S:\new_app\android\app\build\outputs\apk\release\app-release.apk"
} else {
    Write-Host "--- BUILD FAILED ---"
}
Set-Location ".."
