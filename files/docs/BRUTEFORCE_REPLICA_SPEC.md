# GTA V BruteForce Web 复刻规范

## 视觉

- 使用1280×720逻辑舞台，外层窗口与HackConnect共用 `left:186px; top:52px; width:900px; height:616px`。
- 蓝框为 `rgb(26,68,176)`，内容区纯黑。
- 标题直接使用 `files/bruteforce/docs/GTA_V_BruteForce_Wordmark.webp` 的运行时副本，不用CSS重画。
- 标题显示为590×74px；计时器位于内容区top 137px。
- 字母区为8列，每列7个可见字符加1个循环缓冲字符；列宽46px、列距12px、行进步长34px。
- 蓝色命中带高40px，其中轴为字母区局部坐标 `y=122px`；当前未完成列显示绿色竖框；目标字母红色，冻结后的目标字母绿色。
- 右上角四根青色/灰色信号柱表示剩余机会。

## 数据与运动

- 密码从 `DEADLOCK/BACKDOOR/BLUEBOOK/CREAMPIE/DECIPHER/DYNAMITE/JUNKYARD/MORPHEUS/SENTINEL/WORMSIGN` 随机选择。
- 每列只有一个目标字母，其他字符从A-Z生成且排除目标字母。
- 字母运动每个 `requestAnimationFrame` 更新，并使用 `translate3d` 避免逐帧修改布局位置；倒计时文字保持50ms显示粒度。
- 八列速度覆盖75–285px/s的整体跨度；相邻列速度差限制在60px/s以内，中间加入随机扰动，避免相邻列突变但保留全局难度差。
- 命中判断比较目标字母中心与蓝带中轴，容差严格限制为上下10px；正确后字母行盒中心精确吸附到同一条中轴并冻结，不再出现锁定字符偏低。

## 输入与状态

- 左右键或A/D在未完成列之间循环；已冻结列永远不可再次选中。
- 鼠标进入某个未完成列时选中该列，单击提交；冻结列禁用鼠标交互。
- 正确后自动选择右侧下一个未完成列。
- 所有小游戏共用 `src/assets/audio/` 中的一套音效；每次正确命中播放 `hit.wav`，每次错误播放 `wrong.wav`，整局成功和失败才分别播放 `success.wav` 与 `failure.wav`。
- 错误后扣除一次机会，保留当前密码和剩余时间，但清空所有已冻结状态、重新生成八列并回到第一列。
- 四次错误或倒计时归零显示 `Failed to acquire the password.`；任意非Esc键开始新一轮。
- 全部八列完成显示 `Successfully acquired the password.`；任意非Esc键返回External Device。
- Esc在任意阶段返回External Device。

## 排除项

参考截图中的教程框、任务字幕、TEAM LIVES及右下角操作说明属于GTA HUD，不纳入小游戏。
