$ErrorActionPreference = 'Stop'
$notes = @(
    @{ Source = '复变函数.md'; Output = 'notes-data.js'; Config = $null },
    @{
        Source = '电路基础.md'; Output = 'circuits-data.js'
        Config = @{
            sectionNumbers = @('4.1', '4.2', '4.3', '4.4')
            pathTitles = @('叠加与齐次', '替代定理', '等效电源', '最大功率')
            pathDescriptions = @(
                @('各源独立贡献', '响应的线性关系'),
                @('保留已知工作状态', '与端口等效的区别'),
                @('网络与整体思想', '戴维南 · 诺顿 · 方向'),
                @('负载匹配条件', '功率与效率的边界')
            )
        }
    }
)
foreach ($note in $notes) {
    $sourcePath = Join-Path (Split-Path -Parent $PSScriptRoot) $note.Source
    $outputPath = Join-Path $PSScriptRoot $note.Output
    $markdown = [System.IO.File]::ReadAllText($sourcePath)
    $json = ConvertTo-Json -InputObject $markdown -Compress
    $config = if ($null -eq $note.Config) { 'null' } else { ConvertTo-Json -InputObject $note.Config -Compress -Depth 6 }
    $data = "window.NOTE_CONFIG = $config;" + [Environment]::NewLine + "window.NOTE_MARKDOWN = $json;" + [Environment]::NewLine
    [System.IO.File]::WriteAllText($outputPath, $data, [System.Text.UTF8Encoding]::new($false))
    Write-Output "已将 $($note.Source) 同步到网页版。"
}
