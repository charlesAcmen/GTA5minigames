# GTA V 2D Minigames Web Recreation

一个以 1280×720 GTA V 原生逻辑画布为基础的本地 Web 项目，目标是逐个复刻 GTA V 与 GTA Online 中出现的 2D 小游戏。目前 `HackConnect.exe` 与 `BruteForce.exe` 均可游玩。

## 本地运行

```powershell
npm install
npm run dev
```

生产构建：

```powershell
npm run build
```

## 项目结构

```text
src/
├─ assets/                 # 桌面壁纸、全局光标与所有游戏共用音效
├─ audio/                  # 通用游戏音效播放器与事件映射
├─ games/
│  ├─ registry.ts         # 所有小游戏的统一注册表
│  ├─ types.ts            # ProgramDefinition 与游戏入口类型
│  ├─ hackconnect/        # HackConnect 的组件、逻辑、样式与专属资源
│  └─ bruteforce/         # BruteForce 的入口信息与专属资源
├─ shell/                  # 桌面、My Computer、External Device 与系统图标
└─ styles/                 # 全局基础样式
```

每个新游戏应拥有自己的 `src/games/<game-id>/` 目录，并通过 `src/games/registry.ts` 注册。游戏专属图片、状态机、组件和样式不得重新堆入全局资源目录；`move/hit/wrong/success/failure` 五种通用音效统一从 `src/assets/audio/` 引用。

`files/` 下是参考截图、研究素材与用户提供的原始音频，不被运行时代码直接引用。需要临时克隆第三方研究仓库时放入 `.reference-repos/`，该目录已被 Git 忽略。

## 复刻规范

HackConnect 的规范见 [files/docs/HACKCONNECT_REPLICA_SPEC.md](files/docs/HACKCONNECT_REPLICA_SPEC.md)，BruteForce 的规范见 [files/docs/BRUTEFORCE_REPLICA_SPEC.md](files/docs/BRUTEFORCE_REPLICA_SPEC.md)。修改实现时，应同步更新文档。

## 当前限制

- 未打包 Rockstar 专有字体；普通界面文字暂用 Arial 字体栈，标题使用用户提供的原始 Wordmark 图片。
- `files/` 中的参考截图仅用于人工对照，不作为可发布素材来源。
