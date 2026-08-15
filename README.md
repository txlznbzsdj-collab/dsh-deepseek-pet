# dsh-deepseek-pet

DeepSeek 蓝色小鲸鱼桌宠 🐋 —— 浮动在 DSH Web 页面上的拟人化宠物插件。

- 可**拖拽 / 撒娇 / 庆祝 / 摸鱼**的萌系鲸鱼女仆，人设台词（主人 / 大肥鱼 / 吃白饭 / 摸鱼）
- **模型联动**：Agent 可调用 `pet_say` 工具让桌宠说话；桌宠会同步**对话开始（思考）与结束（庆祝）**
- 素材风格：蓝色渐变长发、鲸鱼尾巴、深蓝白女仆装（来自
  [YunYueSama/codex-deepseek-pet](https://github.com/YunYueSama/codex-deepseek-pet) 的 DeepSeek 拟人化桌宠素材，MIT 许可）

## 功能（v3）

### 模型联动（新增）
- **`pet_say` 工具**：模型（Agent）可以调用 `pet_say {text, mood?}` 命令小鲸鱼在页面上说话——
  工具在 host 侧注册，经 `/plugins/pet-events` SSE 通道实时推给浏览器里的桌宠。
- **对话起止同步**：监听会话 `turn/start` / `turn/end`——
  对话开始 → 小鲸鱼切换 **curious 思考姿势** + "收到主人！深度思考中…"；
  对话结束 → **happy 庆祝** + "搞定啦主人！鲸鱼完美收工～"（自动忽略子代理噪音）。

### 桌面互动
- 右下角浮动，呼吸 + 摇摆动画，可**拖拽**（位置记忆，松手回弹，甩远吐槽）
- **单击**说人设台词（主人 / 大肥鱼 / 吃白饭 / 摸鱼 / 撒娇）
- **双击**开心庆祝 + 撒花粒子；**长按**撒娇
- **悬停**挥手问候；**打字偷看**（输入框敲键盘时偶尔冒一句）
- **随机冒泡**（45~90s）；**贴边挤压**吐槽；**失焦打盹**（Zzz）
- **右键菜单**（8 项）：回到右下角 / 换姿势 / 讲个冷笑话 / 今日运势 / 摸摸头 / 自我介绍 / 说点什么 / 躲起来
- 隐藏后右下角 🐋 按钮唤回

## 架构

```
┌─ host 侧 (index.js) ─────────────────────────────┐
│ pet_say 工具 (agent.ctx.tools.register)          │
│   └→ broadcast({type:'say', text, mood})         │
│ ctx.on('session/event') turn/start|end（根会话）  │
│   └→ broadcast({type:'turn', phase})             │
│ webServer exact 路由 /plugins/pet-events (SSE)    │
└────────────────────────┬─────────────────────────┘
                         │ SSE
┌─ 浏览器侧 (client.js) ──▼────────────────────────┐
│ EventSource('/plugins/pet-events')               │
│  say 帧 → 气泡 + mood 姿势                        │
│  turn start → curious 思考 / end → happy 庆祝     │
└──────────────────────────────────────────────────┘
```

## 安装

要求：已安装 [DSH](https://www.npmjs.com/package/@deepseek-ai/dsh)（`dsh web`）与 pnpm。

```powershell
# 1. 克隆并构建（生成 client.js）
git clone https://github.com/<you>/dsh-deepseek-pet.git
cd dsh-deepseek-pet
powershell -ExecutionPolicy Bypass -File ./build.ps1

# 2. 安装到 web profile（dsh 会自动加入 bundles 并应用补丁层）
dsh plugin --profile web add <本目录绝对路径>

# 3. 重启 DSH Web 并刷新页面
dsh web --port 3173
```

重启后右下角出现小鲸鱼即可。模型联动无需额外配置：
对模型说「让小鲸鱼说句话」即可触发 `pet_say` 工具。

## 开发

```powershell
powershell -ExecutionPolicy Bypass -File ./build.ps1   # 改素材/模板后重新生成 client.js
node ./smoke.test.mjs                                   # 冒烟测试（Node VM + DOM stub）
```

## 文件

- `client.template.js` — 浏览器端源码模板（`__B64_*__` 占位符，含 SSE 接收）
- `build.ps1` — 把 `assets/small/*.png` base64 嵌入生成 `client.js`
- `client.js` — 构建产物（浏览器端 bundle，`__ModuleLoader__.load` 格式，已 gitignore）
- `index.js` — host 侧插件（SSE 通道 + pet_say 工具 + 会话事件同步）
- `cordis.patch.yml` — bundle 补丁层（插入 host 行）
- `smoke.test.mjs` — Node VM + DOM stub 冒烟测试（含 SSE 帧处理）
