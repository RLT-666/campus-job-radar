# Generate Campus Job Radar PWA icons (temporary script, removed after use).
# Uses Windows built-in .NET System.Drawing - no third-party packages.
# Icon: Klein Blue (#002FA7) rounded square + white radar glyph
# (3 scan arcs + needle + center dot).
# NOTE: ASCII-only file to avoid PowerShell 5.1 ANSI/UTF-8 parsing issues.
Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = 2 * $r
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-RadarIcon([int]$size, [string]$outPath, [bool]$rounded) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $bg = [System.Drawing.ColorTranslator]::FromHtml('#002FA7')
    $fg = [System.Drawing.Color]::White
    $bgBrush = New-Object System.Drawing.SolidBrush($bg)
    $fgBrush = New-Object System.Drawing.SolidBrush($fg)

    # Background: maskable/Apple icons use full-bleed square (system crops),
    # regular icons use rounded corners.
    if ($rounded) {
        $radius = $size * 0.22
        $bgPath = New-RoundedRectPath 0 0 $size $size $radius
        $g.FillPath($bgBrush, $bgPath)
    } else {
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    }

    # Radar glyph: occupies ~60% of canvas, centered.
    $c = $size / 2
    $r = $size * 0.26
    $penW = [Math]::Max(2, [int]($size * 0.035))
    $pen = New-Object System.Drawing.Pen($fg, $penW)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Three scan arcs (35deg..115deg, upper-right sector)
    foreach ($f in 0.55, 0.78, 1.0) {
        $rr = $r * $f
        $g.DrawArc($pen, $c - $rr, $c - $rr, 2 * $rr, 2 * $rr, 35, 80)
    }

    # Scan needle (45deg direction, slightly beyond outer arc)
    $tip = $r * 1.22
    $tipX = $c + $tip * [Math]::Cos(45 * [Math]::PI / 180)
    $tipY = $c - $tip * [Math]::Sin(45 * [Math]::PI / 180)
    $g.DrawLine($pen, $c, $c, $tipX, $tipY)

    # Center dot
    $dot = $r * 0.16
    $g.FillEllipse($fgBrush, $c - $dot, $c - $dot, 2 * $dot, 2 * $dot)

    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$iconsDir = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

New-RadarIcon 192 (Join-Path $iconsDir 'icon-192.png') $true
New-RadarIcon 512 (Join-Path $iconsDir 'icon-512.png') $true
New-RadarIcon 512 (Join-Path $iconsDir 'icon-maskable-512.png') $false
New-RadarIcon 180 (Join-Path $iconsDir 'apple-touch-icon.png') $false

Write-Output 'Icons generated successfully.'
