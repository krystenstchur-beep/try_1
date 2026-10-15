# 个人学习笔记 · 网页版

双击对应 HTML 即可在浏览器中打开。公式排版脚本、样式、字体和电路图均随项目提供，阅读无需联网；文中的外部参考链接需联网访问。

| 课程 | Markdown 原文 | 网页入口 |
| --- | --- | --- |
| 电路基础 · 第四章 4.1—4.4 | [电路基础.md](../电路基础.md) | [circuits.html](circuits.html) |
| 复变函数 · 5.1 孤立奇点与零点 | [复变函数.md](../复变函数.md) | [index.html](index.html) |

两门课程共用已确认的浅绿阅读样式和阅读功能，侧栏提供互相切换的入口。

## 阅读功能

- 按各自手写框架组织：电路笔记采用 4.1 叠加与齐次、4.2 替代、4.3 等效电源、4.4 最大功率传输；复变函数保留原五部分结构。
- 侧边目录显示当前部分的定义、性质和判断方法，并提供阅读进度。
- 章节知识框架；手机上可左右滑动，点击可跳转到对应正文。
- 完整公式、推导、表格及原稿修正。
- 全篇性质先列结论与适用条件，再给理解、推理或例子；结论统一使用浅色框突出显示。
- 原稿疑问及理解校正随阅读位置显示在对应右侧栏；手机与专注模式下可从独立的“我的疑问”区域查看。
- 可展开的个人疑问，链接到正文对应解释。
- 字号切换、桌面专注模式、打印或另存为 PDF。

## 更新内容

正文来源为项目根目录的 `复变函数.md` 与 `电路基础.md`。修改 Markdown 后，在本目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\同步笔记.ps1"
```

该命令只为当前 PowerShell 进程设置执行策略，将两份 Markdown 分别同步到 `notes-data.js` 和 `circuits-data.js`，不修改系统执行策略。正文与侧边目录根据 Markdown 的标题生成；电路页面的章号、框架简称与摘要由同步脚本中的配置提供。原稿疑问统一保存在 Markdown 的 `manuscript-questions` 侧注块中，用 `data-section` 对应章节；网页自动将它们移到对应侧栏，并汇总至“我的疑问”区域。正文中的显式锚点用于疑问链接定位。性质段落以“**结论。**”开头时，会与紧邻的公式一起显示在结论框中。

电路图由 SVG 保存于 `assets/circuits/`，Markdown 使用相对根目录的链接，网页排版时自动转换为当前页面的相对路径。

## 预览与检查

- [桌面首屏](preview/circuits-desktop.png) · [推导与疑问侧栏](preview/circuits-derivation.png)
- [手机首屏](preview/circuits-mobile.png) · [手机正文](preview/circuits-mobile-content.png)
- 完整页面截图和检查报告保存在 `preview/`；实际阅读请打开 HTML。
- `preview/check.cjs` 使用已有的 Playwright 与浏览器检查两份页面的 Markdown 同步、公式、锚点、目录、侧栏、字号、专注模式和 320—1440 像素布局；通过环境变量 `PLAYWRIGHT_MODULE` 和 `BROWSER_EXECUTABLE` 指定本机安装路径。

电路材料仅使用本次修订的 10 张图；图 9、10 边缘被截断的原题运算未冒充完整例题，相关说明在 4.3 正文及侧栏中保留。

## 本地资源

使用 KaTeX 0.16.11 和 Marked 15.0.12；许可证保存在 `assets/` 下。打开网页时请保留整个 `web-notes` 文件夹；如需下载 Markdown 原文，也应保留上一级的源文件。
