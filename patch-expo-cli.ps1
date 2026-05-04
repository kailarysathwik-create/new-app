$expoCliPath = (Get-Item "node_modules/expo/node_modules/@expo/cli").FullName
$expoCliPath = $expoCliPath.Replace("\", "/")
$entryFile = "node_modules/expo/bin/cli"
$content = "#!/usr/bin/env node`nrequire('$expoCliPath');"
Set-Content -Path $entryFile -Value $content -NoNewline
Write-Host "Surgically patched Expo CLI at $entryFile with absolute path: $expoCliPath"
