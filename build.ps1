# dsh-deepseek-pet 构建脚本：把素材 base64 嵌入 client.template.js 生成 client.js
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$assets = Join-Path $root "assets\small"
$template = Join-Path $root "client.template.js"
$out = Join-Path $root "client.js"

$map = @{ "idle" = "IDLE"; "happy" = "HAPPY"; "wave" = "WAVE"; "sleepy" = "SLEEPY"; "curious" = "CURIOUS" }

$text = Get-Content $template -Raw -Encoding UTF8
foreach ($key in $map.Keys) {
    $file = Join-Path $assets "$key.png"
    if (-not (Test-Path $file)) { throw "missing asset: $file" }
    $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($file))
    $text = $text.Replace("__B64_$($map[$key])__", "data:image/png;base64,$b64")
}
if ($text -match "__B64_[A-Z]+__") { throw "unreplaced placeholder left in client.js" }

[IO.File]::WriteAllText($out, $text, (New-Object System.Text.UTF8Encoding($false)))
$kb = [Math]::Round((Get-Item $out).Length / 1KB)
Write-Output "client.js written: $kb KB"
