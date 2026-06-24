# CETA Skills 自动集成脚本
# 用法: .\integrate-ceta-skills.ps1 -SourcePath "C:\path\to\ceta-skills"

param(
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Minimal = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Full = $false
)

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CETA Skills 自动集成工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 如果没有提供路径,提示用户输入
if ([string]::IsNullOrWhiteSpace($SourcePath)) {
    Write-Host "请输入 CETA Skills 的源目录路径:" -ForegroundColor Yellow
    Write-Host "示例: C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills" -ForegroundColor Gray
    Write-Host ""
    $SourcePath = Read-Host "路径"
    
    if ([string]::IsNullOrWhiteSpace($SourcePath)) {
        Write-Host "✗ 错误: 未提供路径" -ForegroundColor Red
        exit 1
    }
}

# 验证源路径
Write-Host "[1/5] 验证源路径..." -ForegroundColor Cyan
if (-not (Test-Path $SourcePath)) {
    Write-Host "✗ 错误: 路径不存在: $SourcePath" -ForegroundColor Red
    exit 1
}

$sourceSkillsPath = Join-Path $SourcePath "skills"
if (-not (Test-Path $sourceSkillsPath)) {
    Write-Host "✗ 错误: 在源路径中找不到 skills 目录" -ForegroundColor Red
    Write-Host "  期望路径: $sourceSkillsPath" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ 源路径验证成功" -ForegroundColor Green
Write-Host "  源路径: $SourcePath" -ForegroundColor Gray
Write-Host ""

# 扫描可用的 CETA Skills
Write-Host "[2/5] 扫描可用的 CETA Skills..." -ForegroundColor Cyan

$availableSkills = @()

# 检查 ceta-basic
$cetaBasicPath = Join-Path $sourceSkillsPath "ceta-basic"
if (Test-Path $cetaBasicPath) {
    $availableSkills += @{
        Name = "ceta-basic"
        Path = $cetaBasicPath
        Description = "CETA 平台基础知识 (必需)"
        Required = $true
    }
}

# 检查 ceta 目录下的 Skills
$cetaPath = Join-Path $sourceSkillsPath "ceta"
if (Test-Path $cetaPath) {
    $cetaSubSkills = Get-ChildItem -Path $cetaPath -Directory
    foreach ($skill in $cetaSubSkills) {
        $skillPath = $skill.FullName
        $skillMd = Join-Path $skillPath "SKILL.md"
        if (Test-Path $skillMd) {
            $description = switch ($skill.Name) {
                "ceta-api" { "CETA API 规范 (推荐)" }
                "ceta-pbc" { "PBC 管理" }
                "ceta-form" { "表单设计" }
                "ceta-flow" { "流程配置" }
                "ceta-page" { "页面配置" }
                "ceta-app-config" { "应用配置" }
                "ceta-event" { "事件配置" }
                "ceta-connector" { "连接器管理" }
                "ceta-extension" { "扩展组件" }
                default { $skill.Name }
            }
            
            $availableSkills += @{
                Name = $skill.Name
                Path = $skillPath
                Description = $description
                Required = ($skill.Name -eq "ceta-api")
            }
        }
    }
}

if ($availableSkills.Count -eq 0) {
    Write-Host "✗ 错误: 在源路径中找不到任何 CETA Skills" -ForegroundColor Red
    exit 1
}

Write-Host "✓ 找到 $($availableSkills.Count) 个可用的 CETA Skills" -ForegroundColor Green
Write-Host ""

# 显示可用的 Skills
Write-Host "可用的 CETA Skills:" -ForegroundColor Yellow
for ($i = 0; $i -lt $availableSkills.Count; $i++) {
    $skill = $availableSkills[$i]
    $marker = if ($skill.Required) { "[必需]" } else { "[可选]" }
    Write-Host "  $($i + 1). $marker $($skill.Name) - $($skill.Description)" -ForegroundColor Gray
}
Write-Host ""

# 选择集成模式
$selectedSkills = @()

if ($Minimal) {
    # 最小化集成: 只安装必需和推荐的
    Write-Host "[3/5] 集成模式: 最小化 (只安装必需和推荐的 Skills)" -ForegroundColor Cyan
    $selectedSkills = $availableSkills | Where-Object { $_.Required -eq $true }
} elseif ($Full) {
    # 完整集成: 安装所有
    Write-Host "[3/5] 集成模式: 完整 (安装所有 Skills)" -ForegroundColor Cyan
    $selectedSkills = $availableSkills
} else {
    # 交互式选择
    Write-Host "[3/5] 选择集成模式:" -ForegroundColor Cyan
    Write-Host "  1. 最小化集成 (推荐) - 只安装 ceta-basic + ceta-api" -ForegroundColor Gray
    Write-Host "  2. 自定义集成 - 手动选择要安装的 Skills" -ForegroundColor Gray
    Write-Host "  3. 完整集成 (不推荐) - 安装所有 Skills" -ForegroundColor Gray
    Write-Host ""
    
    $mode = Read-Host "请选择 (1/2/3)"
    
    switch ($mode) {
        "1" {
            Write-Host "✓ 选择: 最小化集成" -ForegroundColor Green
            $selectedSkills = $availableSkills | Where-Object { $_.Required -eq $true }
        }
        "2" {
            Write-Host "✓ 选择: 自定义集成" -ForegroundColor Green
            Write-Host ""
            Write-Host "请输入要安装的 Skills 编号 (用逗号分隔,例如: 1,2,3):" -ForegroundColor Yellow
            $selection = Read-Host "编号"
            
            $indices = $selection -split ',' | ForEach-Object { [int]$_.Trim() - 1 }
            foreach ($index in $indices) {
                if ($index -ge 0 -and $index -lt $availableSkills.Count) {
                    $selectedSkills += $availableSkills[$index]
                }
            }
        }
        "3" {
            Write-Host "⚠ 选择: 完整集成 (会安装所有 Skills,可能导致项目臃肿)" -ForegroundColor Yellow
            $selectedSkills = $availableSkills
        }
        default {
            Write-Host "✗ 错误: 无效的选择" -ForegroundColor Red
            exit 1
        }
    }
}

if ($selectedSkills.Count -eq 0) {
    Write-Host "✗ 错误: 没有选择任何 Skills" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "将要安装的 Skills:" -ForegroundColor Yellow
foreach ($skill in $selectedSkills) {
    Write-Host "  • $($skill.Name) - $($skill.Description)" -ForegroundColor Gray
}
Write-Host ""

# 确认
$confirm = Read-Host "确认安装? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "✗ 取消安装" -ForegroundColor Yellow
    exit 0
}

# 创建目标目录
Write-Host ""
Write-Host "[4/5] 复制 Skills..." -ForegroundColor Cyan

$targetSkillsPath = "skills"
$targetCetaPath = Join-Path $targetSkillsPath "ceta"

# 创建 ceta 目录
if (-not (Test-Path $targetCetaPath)) {
    New-Item -ItemType Directory -Path $targetCetaPath -Force | Out-Null
    Write-Host "✓ 创建目录: $targetCetaPath" -ForegroundColor Green
}

# 复制选中的 Skills
$copiedCount = 0
$failedCount = 0

foreach ($skill in $selectedSkills) {
    try {
        $targetPath = Join-Path $targetCetaPath $skill.Name
        
        # 如果目标已存在,先删除
        if (Test-Path $targetPath) {
            Write-Host "  ⚠ $($skill.Name) 已存在,将覆盖..." -ForegroundColor Yellow
            Remove-Item -Path $targetPath -Recurse -Force
        }
        
        # 复制
        Copy-Item -Path $skill.Path -Destination $targetPath -Recurse -Force
        Write-Host "  ✓ 已复制: $($skill.Name)" -ForegroundColor Green
        $copiedCount++
    } catch {
        Write-Host "  ✗ 复制失败: $($skill.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host ""
Write-Host "复制完成: 成功 $copiedCount 个, 失败 $failedCount 个" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

# 验证集成
Write-Host "[5/5] 验证集成..." -ForegroundColor Cyan

$verifySuccess = $true

# 检查 ui-recorder
if (Test-Path "skills\ui-recorder\SKILL.md") {
    Write-Host "  ✓ ui-recorder Skill 存在" -ForegroundColor Green
} else {
    Write-Host "  ✗ ui-recorder Skill 缺失" -ForegroundColor Red
    $verifySuccess = $false
}

# 检查复制的 CETA Skills
foreach ($skill in $selectedSkills) {
    $targetPath = Join-Path $targetCetaPath $skill.Name
    $skillMd = Join-Path $targetPath "SKILL.md"
    
    if (Test-Path $skillMd) {
        Write-Host "  ✓ $($skill.Name) 集成成功" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($skill.Name) 集成失败" -ForegroundColor Red
        $verifySuccess = $false
    }
}

# 检查集成文档
if (Test-Path "CETA_INTEGRATION_GUIDE.md") {
    Write-Host "  ✓ CETA 集成指南存在" -ForegroundColor Green
} else {
    Write-Host "  ⚠ CETA 集成指南缺失" -ForegroundColor Yellow
}

if (Test-Path ".kiro\steering\ceta-ui-recorder-bridge.md") {
    Write-Host "  ✓ 桥接指南存在" -ForegroundColor Green
} else {
    Write-Host "  ⚠ 桥接指南缺失" -ForegroundColor Yellow
}

Write-Host ""

if ($verifySuccess) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ CETA Skills 集成成功!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "已安装的 Skills:" -ForegroundColor Yellow
    foreach ($skill in $selectedSkills) {
        Write-Host "  • $($skill.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "下一步:" -ForegroundColor Yellow
    Write-Host "  1. 在 Kiro 中说: '我要录制 CETA 平台的操作'" -ForegroundColor Gray
    Write-Host "  2. 开始录制并生成脚本" -ForegroundColor Gray
    Write-Host "  3. 查看生成的语义脚本是否包含 CETA 业务术语" -ForegroundColor Gray
    Write-Host ""
    Write-Host "相关文档:" -ForegroundColor Yellow
    Write-Host "  • CETA_INTEGRATION_GUIDE.md - 集成指南" -ForegroundColor Gray
    Write-Host "  • SKILL_MANAGEMENT.md - Skill 管理规范" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ✗ 集成验证失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查上述错误信息并重试" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# 生成集成报告
$reportPath = "ceta-integration-report.txt"
$report = @"
CETA Skills 集成报告
生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

源路径: $SourcePath
目标路径: $targetCetaPath

已安装的 Skills ($($selectedSkills.Count) 个):
$(foreach ($skill in $selectedSkills) { "  • $($skill.Name) - $($skill.Description)`n" })

集成状态: $(if ($verifySuccess) { "成功" } else { "失败" })

下一步:
1. 在 Kiro 中说: "我要录制 CETA 平台的操作"
2. 开始录制并生成脚本
3. 查看生成的语义脚本是否包含 CETA 业务术语

相关文档:
• CETA_INTEGRATION_GUIDE.md - 集成指南
• SKILL_MANAGEMENT.md - Skill 管理规范
• .kiro/steering/ceta-ui-recorder-bridge.md - 协同指南
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "✓ 集成报告已保存到: $reportPath" -ForegroundColor Green
Write-Host ""
