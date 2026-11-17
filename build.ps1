# =============================================================================
# Compilador de Plantillas Handlebars (.hbs) a HTML Estático (index.html)
# Soporta partials ({{> nombre}}), iteradores ({{#each lista}}...{{/each}}),
# condicionales ({{#if cond}}...{{/if}}), @index, {{{html}}} y {{propiedades}}.
# =============================================================================

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$jsonPath = Join-Path $rootDir "data\srb.json"
$layoutPath = Join-Path $rootDir "views\layouts\main.hbs"
$homePath = Join-Path $rootDir "views\home.hbs"
$partialsDir = Join-Path $rootDir "views\partials"
$outPath = Join-Path $rootDir "index.html"

$data = Get-Content -Path $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

# Cargar todos los partials (.hbs) en un diccionario
$partials = @{}
Get-ChildItem -Path $partialsDir -Filter "*.hbs" | ForEach-Object {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $partials[$name] = [System.IO.File]::ReadAllText($_.FullName, $utf8NoBom).TrimEnd()
}

function Get-PropValue {
    param($Context, [string]$Path, $RootContext, [int]$Index = 0)
    if ($Path -eq "@index") { return $Index }
    if ($Path -eq "this" -or $Path -eq ".") { return $Context }

    $parts = $Path.Split('.')
    $curr = $Context
    foreach ($p in $parts) {
        if ($null -eq $curr) { break }
        if ($curr -is [System.Collections.IDictionary] -and $curr.Contains($p)) {
            $curr = $curr[$p]
        } elseif ($null -ne $curr.PSObject.Properties[$p]) {
            $curr = $curr.PSObject.Properties[$p].Value
        } else {
            $curr = $null
            break
        }
    }

    if ($null -eq $curr -and $null -ne $RootContext -and $Context -ne $RootContext) {
        $curr = $RootContext
        foreach ($p in $parts) {
            if ($null -eq $curr) { break }
            if ($null -ne $curr.PSObject.Properties[$p]) {
                $curr = $curr.PSObject.Properties[$p].Value
            } else {
                $curr = $null
                break
            }
        }
    }
    return $curr
}

function Render-Hbs {
    param([string]$Template, $Context, $RootContext, [int]$Index = 0)

    $output = $Template

    # 1. Expandir partials recursivamente: {{> nombrePartial}}
    $maxDepth = 10
    while ($output -match '\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}' -and $maxDepth -gt 0) {
        $output = [regex]::Replace($output, '\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}', {
            param($m)
            $pName = $m.Groups[1].Value
            if ($partials.ContainsKey($pName)) {
                return $partials[$pName]
            }
            return ""
        })
        $maxDepth--
    }

    # 2. Procesar bloques {{#each ruta}} ... {{/each}}
    $eachPattern = '(?s)\{\{#each\s+([a-zA-Z0-9_.]+)\s*\}\}\r?\n?(.*?)\{\{/each\}\}\r?\n?'
    while ([regex]::IsMatch($output, $eachPattern)) {
        $output = [regex]::Replace($output, $eachPattern, {
            param($m)
            $listPath = $m.Groups[1].Value
            $innerTpl = $m.Groups[2].Value
            $items = Get-PropValue -Context $Context -Path $listPath -RootContext $RootContext -Index $Index
            if ($null -eq $items) { return "" }
            $sb = New-Object System.Text.StringBuilder
            $idx = 0
            foreach ($item in $items) {
                $renderedItem = Render-Hbs -Template $innerTpl -Context $item -RootContext $RootContext -Index $idx
                [void]$sb.Append($renderedItem.TrimEnd("`r", "`n") + "`n")
                $idx++
            }
            return $sb.ToString().TrimEnd("`r", "`n")
        })
    }

    # 3. Procesar bloques condicionales {{#if cond}} ... {{/if}}
    $ifPattern = '(?s)\{\{#if\s+([a-zA-Z0-9_.]+)\s*\}\}(.*?)\{\{/if\}\}'
    while ([regex]::IsMatch($output, $ifPattern)) {
        $output = [regex]::Replace($output, $ifPattern, {
            param($m)
            $condPath = $m.Groups[1].Value
            $innerTpl = $m.Groups[2].Value
            $val = Get-PropValue -Context $Context -Path $condPath -RootContext $RootContext -Index $Index
            if ($val) {
                return Render-Hbs -Template $innerTpl -Context $Context -RootContext $RootContext -Index $Index
            }
            return ""
        })
    }

    # 4. Reemplazar expresiones sin escape {{{variable}}}
    $output = [regex]::Replace($output, '\{\{\{\s*([a-zA-Z0-9_.@]+)\s*\}\}\}', {
        param($m)
        $val = Get-PropValue -Context $Context -Path $m.Groups[1].Value -RootContext $RootContext -Index $Index
        if ($null -ne $val) { return [string]$val }
        return ""
    })

    # 5. Reemplazar expresiones estándar {{variable}}
    $output = [regex]::Replace($output, '\{\{\s*([a-zA-Z0-9_.@]+)\s*\}\}', {
        param($m)
        $val = Get-PropValue -Context $Context -Path $m.Groups[1].Value -RootContext $RootContext -Index $Index
        if ($null -ne $val) { return [string]$val }
        return ""
    })

    return $output
}

$homeTemplate = [System.IO.File]::ReadAllText($homePath, $utf8NoBom)
$layoutTemplate = [System.IO.File]::ReadAllText($layoutPath, $utf8NoBom)

$renderedBody = Render-Hbs -Template $homeTemplate -Context $data -RootContext $data
$data | Add-Member -NotePropertyName "body" -NotePropertyValue $renderedBody -Force
$finalHtml = Render-Hbs -Template $layoutTemplate -Context $data -RootContext $data

[System.IO.File]::WriteAllText($outPath, $finalHtml, $utf8NoBom)
Write-Host "Compilacion exitosa: views/*.hbs + data/srb.json -> index.html" -ForegroundColor Green

