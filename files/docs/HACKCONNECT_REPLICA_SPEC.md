# GTA V HackConnect Web 复刻规范

本文是当前实现的设计真值与交接说明。目标是让后来维护者不依赖聊天记录，也能理解桌面 Shell、两级文件窗口和 `HackConnect.exe` 的视觉来源、坐标、状态机与输入规则。

文档描述的是当前仓库实现。任何改变颜色、尺寸、输入逻辑或素材路径的提交，都应同步修改本文。

## 1. 复刻范围和参考资料

本阶段路径为：

```text
Windows 桌面
  → My Computer
    → External Device (J:)
      → HackConnect.exe
```

保留但暂不启动的程序为 `BruteForce.exe`。

主要视觉参考：

- `files/hackconnect/docs/windows.jpg`：运行时桌面背景的来源。
- `files/hackconnect/docs/level2.jpg`：My Computer 一级窗口的布局参考。
- `files/Hacking-GTAVe_MyComputer.webp`：My Computer 原始界面参考。
- `files/Hacking-GTAVe_ExternalDevice_connected.webp`：一级菜单图标 hover 的真值。
- `files/hackconnect/docs/Hacking-GTAVe_HackConnect_exe_in_action.webp`：游戏运行界面真值。
- `files/hackconnect/docs/Hacking-GTAVe_HackConnect_exe_complete.webp`：成功界面参考。

参考截图中的左上角教程、任务字幕、TEAM LIVES 和右下角 GTA 操作提示属于游戏世界 HUD，不属于电脑小游戏，必须排除。

运行时代码不得直接引用上述 `docs` 文件。正式资源必须复制到 `src` 内，并按所属游戏或 Shell 分类。

## 2. 技术和坐标系统

- 技术栈：Vite、React、TypeScript、CSS Modules。
- 原生逻辑画布：`1280 × 720`。
- 所有窗口和游戏元素都以 1280×720 坐标书写，不进行响应式重新排版。
- 浏览器视口使用 `min(viewportWidth / 1280, viewportHeight / 720)` 等比缩放整个舞台。
- 非 16:9 视口使用深黑色 letterbox，舞台保持居中。
- 桌面背景使用 `background-position: center` 和 `background-size: cover`。
- 页面禁止滚动、文本选择和浏览器默认溢出。

权威实现：`src/shell/DesktopShell.tsx` 和 `src/shell/DesktopShell.module.css`。

## 3. 字体和文字

### 3.1 普通界面字体

当前字体栈为：

```css
font-family: Arial, Helvetica, sans-serif;
```

同时启用：

```css
font-synthesis: none;
text-rendering: geometricPrecision;
```

原因是仓库没有获得 Rockstar/GTA 原始 UI 字体的可分发授权。Arial 是当前近似方案，不应在文档中宣称为 GTA 原版字体。将来若获得合法字体，应在全局字体栈统一替换并重新对照所有换行和字宽。

### 3.2 HackConnect 标题

标题不得使用 CSS 模拟字体。运行时直接使用用户提供的 `GTA_V_HackConnect_Wordmark.webp` 副本：

```text
src/games/hackconnect/assets/wordmark.webp
```

显示尺寸为 `357 × 34 px`，使用 `object-fit: fill` 非等比横向压缩，以匹配当前参考图所需宽度。

### 3.3 文本尺寸

| 元素 | 当前字号/行高 |
| --- | --- |
| 桌面 My Computer | 20px / 1.22 |
| 一级窗口标签 | 17px / 1.04 |
| 二级程序标签 | 17px / 1.03 |
| 目标地址 | 47px / 1 |
| 倒计时 | 25px / 1 |
| 数字网格 | 39px / 40px |
| 成功/失败消息 | 25px / 1.22 |

桌面标签使用暗色双向文字阴影，以保证在蓝色背景上可读。

## 4. 核心颜色

窗口外框的统一蓝色由用户明确指定：

| 用途 | RGB | Hex |
| --- | --- | --- |
| 所有电脑窗口蓝框 | `rgb(26, 68, 176)` | `#1a44b0` |
| HackConnect 内容区 | `rgb(0, 0, 0)` | `#000000` |
| 普通数字 | `rgb(237, 237, 237)` | `#ededed` |
| 被选数字 | `rgb(237, 5, 11)` | `#ed050b` |
| 目标地址/错误 | `rgb(243, 20, 11)` | `#f3140b` |
| 成功目标 | `rgb(33, 172, 33)` | `#21ac21` |
| 倒计时/结果文字 | `rgb(32, 169, 33)` | `#20a921` |
| 有效信号柱 | `rgb(37, 204, 208)` | `#25ccd0` |
| 已失去信号柱 | `rgb(62, 62, 62)` | `#3e3e3e` |
| 一级/二级 hover 底色 | `rgba(213, 235, 247, 0.48)` | — |
| 一级/二级 hover 边框 | `rgba(148, 194, 220, 0.70)` | — |

不要重新引入曾经使用过的 `#214ab2` 或 `#214aa7`。

## 5. 桌面 Shell

### 5.1 桌面

- 背景正式资源：`src/assets/desktop/windows.jpg`。
- My Computer 左上角坐标：`left: 101px; top: 222px`。
- 按钮逻辑尺寸：`80 × 122px`。
- 磁盘图标：`71 × 64px`。
- 单击直接打开 My Computer，不使用双击。
- Esc 从一级窗口回到桌面。

桌面图标 hover/选中框只包围图标：顶部为 0，左右各缩进 2px，高度 70px。图标下方保留 10px 间距后再开始文字，因此矩形不得进入 `My Computer` 文字区域。

桌面选中底色为 `rgba(255, 255, 255, 0.16)`，边框为 `rgba(255, 255, 255, 0.72)`，并使用 3px backdrop blur。

### 5.2 My Computer 一级窗口

- 外框：`left: 346px; top: 103px; width: 612px; height: 511px`。
- 顶部蓝框厚度由 `padding-top: 38px` 形成。
- 其余内边距：7px。
- 圆角：8px。
- 内容区：纯白。
- 分隔线：左 18px、宽 558px、高 2px，主色 `#b7b7b4`，下方一条 `#ececea` 高光。
- 第一条分隔线 y=156px；第二条 y=310px。

三个固定入口：

| 入口 | top | 按钮高度 | 图标尺寸 |
| --- | ---: | ---: | ---: |
| Local (C:) | 31px | 105px | 70×63px |
| Global Network | 179px | 119px | 70×70px |
| External Device (J:) | 326px | 128px | 52×68px |

入口按钮统一位于内容区 `left: 53px`，宽 94px。

hover 真值来自 `Hacking-GTAVe_ExternalDevice_connected.webp`：浅蓝矩形只包围图标，不能覆盖文字。当前图标框为 `82 × 72px`，文字在图标框结束 10px 后开始。打开 My Computer 时不得默认选中 Local；鼠标 hover 才显示鼠标高亮。键盘选择允许保留选中态。

Local 和 Global Network 目前只展示，不打开内容。External Device 单击打开二级窗口。

### 5.3 External Device 二级窗口

- `left: 557px; top: 198px`。
- 内容尺寸：`326 × 217px`。
- 白色内容背景。
- 蓝色实线边框：5px。
- 程序网格起点：`left: 36px; top: 35px`。
- 每个程序槽宽 104px，列间距 38px。
- 图标资源显示为 `70 × 70px`。
- hover 图标框：`80 × 76px`。
- 图标框结束后保留 10px，再显示程序名。

`HackConnect.exe` 单击启动。`BruteForce.exe` 目前不可聚焦、不可启动，但允许显示被动 hover 视觉反馈。二级窗口打开时不默认给 HackConnect 添加高亮。

## 6. 系统图标来源

以下图标是项目内手写 SVG，不是 Rockstar 解包资源：

- My Computer 与 Local (C:) 磁盘图标。
- Global Network 地球图标。
- External Device 手机图标。
- HackConnect 标题左侧蓝色地球与白锁组合图标。

前三者位于 `src/shell/SystemIcons.tsx`。它们是当前近似占位方案；如找到合法且更接近原版的素材，可以替换，但必须保持本文中的布局尺寸。

以下资源由用户提供并直接使用：

- Windows 桌面背景。
- HackConnect 红底锁程序图标。
- BruteForce 拳头程序图标。
- HackConnect Wordmark。
- Middle Finger 自定义鼠标光标。

## 7. 自定义鼠标光标

运行时资源：

```text
src/assets/cursors/middle-finger.cur
```

原始文件包含 32×32、48×48、64×64 三个图层。为避免高 DPI 浏览器自动选择过大的版本，运行时副本仅保留原文件的 32×32 图层：

- 尺寸：32×32。
- hotspot：`(15, 6)`。
- CSS fallback：`default`。
- 应用范围：整个 1280×720 舞台及其所有子元素。

原始文件仍保存在用户的下载目录，仓库只保存精简后的运行时副本。

## 8. HackConnect 窗口视觉

### 8.1 外框与内容区

- 外框：`left: 186px; top: 52px; width: 900px; height: 616px`。
- 上内边距：45px；左右 10px；底部 8px。
- 外框圆角：9px。
- 内容区背景：纯黑。
- 内容区必须裁切溢出。

### 8.2 顶部品牌区

- Header：距黑色内容区顶部 15px，高 39px。
- 品牌组合整体宽 405px，水平居中。
- 蓝色地球白锁 SVG：39×39px。
- 地球与 Wordmark 间距：9px。
- Wordmark：357×34px。

右上角四根信号柱距右侧 20px、距 Header 顶部 17px，柱宽 8px，间距 3px，高度依次为 9、15、21、27px。剩余机会使用青色；失去的机会变为深灰。

### 8.3 目标、计时器和网格

- 目标地址：top 64px，整行居中。
- 倒计时：top 134px，整行居中，启用 tabular numerals。
- 数字网格：top 172px，left 110px。
- 网格：10列×8行。
- 单格：64×40px。
- 网格总尺寸：640×320px。

网格没有可见单元格边框。普通数字为灰白色，被选中的连续四项变红。

## 9. HackConnect 数据规则

- 网格大小：80项，10列×8行。
- 每项是两位十进制字符串，范围 `00–98`。
- 目标地址由四项组成。
- 新一轮随机选择目标起点，并把四段目标连续写入循环数组。
- 目标允许跨行，也允许从索引79回绕到索引0。
- 初始选区起点为扁平索引33。
- 左右移动分别为 `-1/+1`。
- 上下移动分别为 `-10/+10`。
- 所有移动都在80项扁平数组上循环回绕。
- 每1.6秒，数字数组整体左移一项；首项追加到末尾。
- 数字移动时，目标真实索引同步减1；屏幕选区位置保持不动。

## 10. 输入规则

### 10.1 键盘

- 方向键或 WASD 移动选区。
- Enter 或空格提交当前四项。
- Esc 在 playing、success、failure 三种阶段都立即退出到 External Device。
- 成功页按任意非 Esc 键退出到 External Device。
- 失败页按任意非 Esc 键生成全新一轮，不关闭 HackConnect 窗口。

### 10.2 鼠标在数字网格外

鼠标移动采用相对位移控制选区：

1. 累积水平和垂直位移。
2. 最大绝对分量不足14 CSS px时不移动。
3. 达到阈值后比较 `abs(deltaX)` 与 `abs(deltaY)`。
4. 水平较大时只移动左或右一格。
5. 垂直较大或相等时只移动上或下一行。
6. 移动后清空两个累计量。

因此右上或左下手势只会产生一个主方向动作，不允许同时发生对角移动。

### 10.3 鼠标在数字网格内

鼠标一旦进入网格，停止使用相对方向移动，改为根据绝对位置选择连续四项。

选区不是从鼠标所在数字开始，而是尽量让鼠标位于四项选区的几何中间。当前计算为：

```text
columnPosition = ((mouseX - gridLeft) / gridWidth) × 10
row = floor(((mouseY - gridTop) / gridHeight) × 8)
selectionStart = round(row × 10 + columnPosition - 4 / 2)
```

结果仍通过80项循环数组回绕。由于选区长度为偶数，严格中心位于第二、第三项之间；使用连续鼠标坐标和四舍五入选择距离指针最近的中心位置。

点击已变红的四项之一会提交；点击未选数字仍可直接改变选区。

## 11. 游戏状态机

状态为：

```text
playing → success
playing → failure
failure → playing（全新一轮）
success → External Device
```

规则：

- 每轮60秒，显示格式严格为 `MM:SS:mmm`。
- 初始四次机会。
- 提交位置与目标起点相同，或仅相邻一格时进入 success；这是离散网格上的最小辅助容差。
- 提交错误时整屏短暂红色闪烁，并扣除一根信号柱。
- 四次机会耗尽进入 failure。
- 倒计时归零进入 failure。
- success 隐藏网格，显示：
  - `Successfully connected to the host.`
  - `Press any key to continue.`
- failure 隐藏网格，显示：
  - `Failed to connect to the host.`
  - `Press any key to continue.`
- failure 页任意非 Esc 键重置所有数字、目标、机会、计时器和1.6秒滚动累计量。

页面或窗口失焦时游戏不得暂停。动画帧恢复后使用 `performance.now()` 的真实时间差补算倒计时和数字滚动周期。因此切换窗口或浏览器后台降帧不会延长游戏时间。

## 12. 声音

当前版本使用用户在 `files/audio` 中提供的正式 WAV 副本。所有小游戏共用的运行时音频位于：

```text
src/assets/audio/
```

- `move.wav`：键盘/鼠标改变选区，以及每1.6秒数字整体滚动时播放；音量0.24。
- `hit.wav`：正确提交时播放；音量0.42。
- `wrong.wav`：每次错误提交时播放；音量0.42。
- `success.wav`：首次从 playing 进入 success 时播放一次，音量0.48。
- `failure.wav`：首次从 playing 进入 failure 时播放一次，音量0.46。

声音绑定不得改变游戏状态机。倒计时以20Hz刷新显示，但使用真实经过时间扣减。

## 13. 项目边界与新增游戏规则

每个游戏的界面与逻辑必须自包含；五种标准状态音效例外，由应用级 `AudioProvider` 共享加载，并通过 `src/audio/useGameAudio.ts` 与 `src/assets/audio/` 提供：

```text
src/games/<game-id>/
├─ assets/                 # 仅游戏专属图片等资源
├─ <Game>.tsx
├─ <Game>.module.css
├─ logic.ts
└─ index.ts
```

`index.ts` 导出一个满足 `ProgramDefinition` 的清单。`src/games/registry.ts` 只负责注册，不保存游戏内部逻辑。Shell 不得通过 `if (game === ...)` 硬编码具体小游戏行为。

每次启动由 `GameHost` 创建独立 `GameRuntime`。游戏使用公共的 `useGameLoop` 与 `useGameKeyDown` 注册动画和输入；退出、卸载或渲染异常时，宿主统一中止本局动画帧、输入监听与正在播放的音效。

暂存第三方反编译或社区研究仓库时使用 `.reference-repos/` 或 `reference-repos/`。这两个目录已加入 `.gitignore`，其中代码不得未经许可证审查复制进正式实现。

## 14. 人工验收清单

- 1280×720 下窗口位置与参考图重合。
- 1600×900 和 1920×1080 下只整体缩放，不重新排版。
- 非16:9视口出现 letterbox。
- 打开 My Computer 时 Local 没有默认 hover。
- hover 矩形只覆盖图标，与标签之间存在可见空隙。
- My Computer、External Device 和 HackConnect 均单击打开。
- BruteForce 可单击启动，锁定列不可再次选择。
- 鼠标网格内选择块以指针为中心，而不是从指针位置向右延伸。
- 鼠标网格外的斜向手势只产生一个主轴动作。
- 四次错误进入 failure；failure 任意键开始新一轮。
- 成功任意键返回 External Device。
- Esc 按层级退出。
- 切换窗口后倒计时继续消耗。
- 页面中没有 GTA 教程框、任务字幕、TEAM LIVES 或右下角操作提示。
