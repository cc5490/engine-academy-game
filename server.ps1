$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
# 同时监听本机和局域网，手机可通过电脑IP访问
$listener.Prefixes.Add('http://+:8765/')
try {
  $listener.Start()
} catch {
  Write-Host "需要管理员权限监听局域网，回退到 localhost"
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add('http://localhost:8765/')
  $listener.Start()
}
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Default Switch' -and $_.IPAddress -notmatch '^(169\.|127\.)' } | Select-Object -First 1).IPAddress
Write-Host "Serving $root"
Write-Host "电脑访问: http://localhost:8765/"
Write-Host "手机访问: http://${localIP}:8765/  (需与电脑同一WiFi)"
while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $raw = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrEmpty($raw)) { $raw = 'index.html' }
  $path = Join-Path $root $raw
  if ((Test-Path $path -PathType Container)) { $path = Join-Path $path 'index.html' }
  if (Test-Path $path -PathType Leaf) {
    $ctx.Response.Headers.Add('Cache-Control', 'no-cache, no-store, must-revalidate')
    $ctx.Response.Headers.Add('Access-Control-Allow-Origin', '*')
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    $mime = switch ($ext) {
      '.html' { 'text/html; charset=utf-8' }
      '.css'  { 'text/css; charset=utf-8' }
      '.js'   { 'application/javascript; charset=utf-8' }
      '.json' { 'application/json; charset=utf-8' }
      '.png'  { 'image/png' }
      '.jpg'  { 'image/jpeg' }
      '.svg'  { 'image/svg+xml' }
      '.webmanifest' { 'application/manifest+json' }
      default { 'application/octet-stream' }
    }
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $ctx.Response.ContentType = $mime
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $ctx.Response.OutputStream.Close()
}
