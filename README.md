# GTA V 2D Minigames Web Recreation

一个以 1280×720 GTA V 原生逻辑画布为基础的本地 Web 项目，目标是逐个复刻 GTA V 与 GTA Online 中出现的 2D 小游戏。目前 `HackConnect.exe`、`BruteForce.exe`、`DataCrack.exe` 与 `CasinoFingerprint.exe` 均可游玩。

## 本地运行

```powershell
npm install
npm run dev
```

生产构建：

```powershell
npm run build
```

完整校验（单元测试 + 生产构建）：

```powershell
npm run check
```

## 项目结构

```text
src/
├─ assets/                 # 桌面壁纸、全局光标与所有游戏共用音效
├─ audio/                  # 应用级共享音频引擎与游戏音效事件映射
├─ games/
│  ├─ registry.ts         # 所有小游戏的统一注册表
│  ├─ types.ts            # ProgramDefinition 与统一游戏入口类型
│  ├─ hackconnect/        # HackConnect 的组件、逻辑、样式与专属资源
│  ├─ bruteforce/         # BruteForce 的组件、逻辑、样式与专属资源
│  ├─ datacrack/          # Data Crack 的组件、逻辑、样式与专属资源
│  └─ casinofingerprint/  # 赌场指纹匹配、动态终端背景与专属资源
├─ runtime/                # 单局 GameRuntime、公共动画循环与输入生命周期
├─ shell/                  # 桌面工作区、导航状态与游戏宿主
├─ test/                   # 跨游戏测试辅助设施
└─ styles/                 # 全局基础样式
```

每个新游戏应拥有自己的 `src/games/<game-id>/` 目录，并通过 `src/games/registry.ts` 注册。游戏专属图片、状态机、组件和样式不得重新堆入全局资源目录；`move/hit/wrong/success/failure` 五种通用音效统一从 `src/assets/audio/` 引用。

游戏组件只通过 `GameRuntime` 使用退出、音频、输入与动画能力。`GameHost` 为每次启动创建独立会话；退出、卸载或渲染异常时会统一终止动画帧和输入监听，并停止本局音效。新增游戏应复用 `useGameLoop`、`useGameKeyDown` 和 `useGameAudio`，避免直接创建无法由宿主管理的全局监听或计时器。

`files/` 下是参考截图、研究素材与用户提供的原始音频，不被运行时代码直接引用。需要临时克隆第三方研究仓库时放入 `.reference-repos/`，该目录已被 Git 忽略。

## 复刻规范

各游戏的复刻规范见 `files/docs/` 下对应的 `*_REPLICA_SPEC.md`。赌场指纹的来源、录屏分析、参数依据及实现细节见 [CASINO_FINGERPRINT_REPLICA_SPEC.md](files/docs/CASINO_FINGERPRINT_REPLICA_SPEC.md)。修改实现时，应同步更新文档。

赌场指纹：从原有设备目录打开 `CasinoFingerprint.exe`。每题从 8 个候选中选 4 个匹配目标的碎片；方向键/WASD 移动，Enter/Space 切换选择，Tab 校验，Esc 退出；也支持鼠标/触屏。MVP 为两轮、4 分钟、6 次尝试，90 秒重排周期为暂定值。

## 当前限制

- 未打包 Rockstar 专有字体；普通界面文字暂用 Arial 字体栈，标题使用用户提供的原始 Wordmark 图片。
- 赌场指纹使用用户提供的目标/碎片图，启动图从提供的参考截图局部提取；所有运行资源位于游戏自己的 `assets/`，游戏素材权属保持原样。当前为本地复刻，未部署。
