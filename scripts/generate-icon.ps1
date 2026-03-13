param(
  [string]$OutputDir = (Join-Path $PSScriptRoot "..\\build")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class NativeMethods {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern bool DestroyIcon(IntPtr handle);
}
"@

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-IconBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $teal = [System.Drawing.ColorTranslator]::FromHtml("#0f766e")
  $tealDark = [System.Drawing.ColorTranslator]::FromHtml("#0b4f4a")
  $amber = [System.Drawing.ColorTranslator]::FromHtml("#b45309")
  $cream = [System.Drawing.ColorTranslator]::FromHtml("#fffdfa")
  $muted = [System.Drawing.ColorTranslator]::FromHtml("#d7ebe8")

  $backgroundPath = New-RoundedRectPath 8 8 ($Size - 16) ($Size - 16) 56
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point $Size, $Size),
    $teal,
    $amber
  )
  $graphics.FillPath($backgroundBrush, $backgroundPath)

  $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(46, 255, 255, 255))
  $graphics.FillEllipse($glowBrush, 34, 18, 134, 104)

  $panelPath = New-RoundedRectPath 44 50 168 156 26
  $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(244, $cream))
  $graphics.FillPath($panelBrush, $panelPath)

  $panelHeader = New-RoundedRectPath 44 50 168 34 26
  $headerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 233, 243, 241))
  $graphics.FillPath($headerBrush, $panelHeader)

  $dotBrush1 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(214, 15, 118, 110))
  $dotBrush2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(180, 84, 9))
  $dotBrush3 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(145, 26, 36, 48))
  $graphics.FillEllipse($dotBrush1, 58, 61, 10, 10)
  $graphics.FillEllipse($dotBrush2, 74, 61, 10, 10)
  $graphics.FillEllipse($dotBrush3, 90, 61, 10, 10)

  $linePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(185, $muted), 10)
  $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($linePen, 66, 110, 160, 110)
  $graphics.DrawLine($linePen, 66, 136, 178, 136)
  $graphics.DrawLine($linePen, 66, 162, 146, 162)

  $bladePen = New-Object System.Drawing.Pen ($amber, 22)
  $bladePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $bladePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($bladePen, 78, 184, 176, 86)

  $highlightPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 255, 223, 198), 6)
  $highlightPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $highlightPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($highlightPen, 86, 176, 168, 94)

  $handlePen = New-Object System.Drawing.Pen ($tealDark, 18)
  $handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($handlePen, 182, 80, 208, 54)

  $sparklePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(205, 255, 255, 255), 4)
  $graphics.DrawLine($sparklePen, 184, 158, 184, 174)
  $graphics.DrawLine($sparklePen, 176, 166, 192, 166)
  $graphics.DrawLine($sparklePen, 58, 194, 58, 204)
  $graphics.DrawLine($sparklePen, 53, 199, 63, 199)

  $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(58, 255, 255, 255), 2)
  $graphics.DrawPath($borderPen, $backgroundPath)

  $borderPen.Dispose()
  $sparklePen.Dispose()
  $handlePen.Dispose()
  $highlightPen.Dispose()
  $bladePen.Dispose()
  $linePen.Dispose()
  $dotBrush1.Dispose()
  $dotBrush2.Dispose()
  $dotBrush3.Dispose()
  $headerBrush.Dispose()
  $panelBrush.Dispose()
  $glowBrush.Dispose()
  $backgroundBrush.Dispose()
  $backgroundPath.Dispose()
  $panelPath.Dispose()
  $panelHeader.Dispose()
  $graphics.Dispose()

  return $bitmap
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$master = New-IconBitmap -Size 256
$pngPath = Join-Path $OutputDir "icon.png"
$master.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$icoPath = Join-Path $OutputDir "icon.ico"
$iconHandle = $master.GetHicon()
try {
  $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
  $iconFile = [System.IO.File]::Create($icoPath)
  try {
    $icon.Save($iconFile)
  }
  finally {
    $iconFile.Dispose()
    $icon.Dispose()
  }
}
finally {
  [NativeMethods]::DestroyIcon($iconHandle) | Out-Null
}

$master.Dispose()

Write-Host "Generated $pngPath"
Write-Host "Generated $icoPath"
