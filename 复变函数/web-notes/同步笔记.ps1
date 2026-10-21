$ErrorActionPreference = 'Stop'
$notes = @(
    @{ Source = '复变函数.md'; Output = 'notes-data.js'; Config = $null },
    @{
        Source = '电路基础.md'; Output = 'circuits-data.js'
        Config = @{
            sectionNumbers = @('4.1', '4.2', '4.3', '4.4', '4.5')
            pathTitles = @('叠加与齐次', '替代定理', '等效电源', '最大功率', '互易定理')
            pathDescriptions = @(
                @('各源独立贡献', '响应的线性关系'),
                @('保留已知工作状态', '与端口等效的区别'),
                @('网络与整体思想', '戴维南 · 诺顿 · 方向'),
                @('负载匹配条件', '功率与效率的边界'),
                @('三种激励响应关系', '等效电源与课件例题')
            )
        }
    }
    ,@{
        Source = '模电.md'; Output = 'analog-data.js'
        Config = @{
            sectionNumbers = @('3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9')
            pathTitles = @('晶体管', '放大指标', '组成与工作', '直流分析', '交流分析', '分析步骤', '共集电极', '共基极', '三组态比较')
            pathDescriptions = @(
                @('结构 · 原理 · 曲线', '直流与小信号模型'),
                @('二端口与等效', '增益 · 输入与输出'),
                @('偏置搭台，信号变化', '直流与交流通路'),
                @('图解与估算 Q 点', '分压 · 反馈 · 新平衡'),
                @('旁路与增益', '负载线与削顶边界'),
                @('先静态，再动态', '贯通例题与校验'),
                @('电压跟随', '输入高 · 输出低'),
                @('电流跟随', '低输入电阻 · 同相'),
                @('同条件比较', '材料 · 修正 · 待确认')
            )
        }
    }
)
$subjectName = Split-Path -Leaf (Split-Path -Parent $PSScriptRoot)
$notes = @($notes | Where-Object { $_.Source -eq ($subjectName + '.md') })
foreach ($note in $notes) {
    $sourcePath = Join-Path (Split-Path -Parent $PSScriptRoot) $note.Source
    $outputPath = Join-Path $PSScriptRoot $note.Output
    $markdown = [System.IO.File]::ReadAllText($sourcePath)
    $json = ConvertTo-Json -InputObject $markdown -Compress
    $config = if ($null -eq $note.Config) { 'null' } else { ConvertTo-Json -InputObject $note.Config -Compress -Depth 6 }
    $data = "window.NOTE_CONFIG = $config;" + [char]10 + "window.NOTE_MARKDOWN = $json;" + [char]10
    if ([System.IO.File]::Exists($outputPath)) {
        $existing = [System.IO.File]::ReadAllText($outputPath).Replace("`r`n", "`n")
        if ($existing -eq $data) {
            Write-Output "$($note.Source) 已与网页版同步。"
            continue
        }
    }
    [System.IO.File]::WriteAllText($outputPath, $data, [System.Text.UTF8Encoding]::new($false))
    Write-Output "已将 $($note.Source) 同步到网页版。"
}
