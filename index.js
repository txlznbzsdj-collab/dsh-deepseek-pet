// dsh-deepseek-pet host 侧插件：
//   1. 提供 /plugins/pet-events SSE 推送通道（把命令实时推给浏览器里的桌宠）
//   2. 注册 pet_say 工具 —— 模型调用后让小鲸鱼在页面上说话
//   3. 监听 session/event 的 turn/start、turn/end —— 让桌宠同步"思考中/完成"
// 纯运行时注入，无静态外部依赖（工具定义使用 raw register 对象，避免 import 解析问题）。
export const name = "deepseek-pet";
export const inject = ["webServer", "agents", "sessions", "tools"];

/** 桌宠 SSE 端点（webServer exact 路由优先于 client-modules 的 /plugins 前缀）。 */
const EVENTS_ENDPOINT = "/plugins/pet-events";
const MOODS = ["idle", "happy", "wave", "sleepy", "curious", "shy", "surprised", "review", "jump", "spin", "shake"];

function sseData(frame) {
	return `data: ${JSON.stringify(frame)}\n\n`;
}

export function apply(ctx) {
	const connections = /* @__PURE__ */ new Set();
	const broadcast = (frame) => {
		const line = sseData(frame);
		for (const res of connections) {
			try {
				res.write(line);
			} catch (_) {}
		}
	};

	// ── 1) SSE 推送通道 ──
	ctx.effect(() => {
		const disposeRoute = ctx.webServer.register({
			kind: "exact",
			path: EVENTS_ENDPOINT,
			handler: (req, res) => {
				if (req.method !== "GET" && req.method !== "HEAD") {
					res.writeHead(405);
					res.end();
					return;
				}
				res.writeHead(200, {
					"content-type": "text/event-stream",
					"cache-control": "no-cache",
					"connection": "keep-alive"
				});
				res.write(": connected\n\n");
				connections.add(res);
				res.on("close", () => {
					connections.delete(res);
				});
			}
		});
		return () => {
			disposeRoute();
			for (const res of connections) res.destroy();
			connections.clear();
		};
	}, "deepseek-pet: SSE channel");

	// ── 2) 对话起止同步（只关注根会话，忽略子代理噪音） ──
	ctx.on("session/event", (session, event) => {
		if (event.type !== "turn/start" && event.type !== "turn/end") return;
		const origin = session && session.header ? session.header.origin : "root";
		if (origin === "subagent") return;
		broadcast({
			type: "turn",
			phase: event.type === "turn/start" ? "start" : "end",
			sessionId: session && session.id !== void 0 ? session.id : null,
			origin
		});
	});

	// ── 3) pet_say 工具：模型命令桌宠说话 ──
	ctx.on("agent/created", ({ agent }) => {
		// agent.ctx.effect 让工具注册随 agent 生命周期自动卸载
		agent.ctx.effect(() => {
			const unregister = agent.ctx.tools.register({
				name: "pet_say",
				description:
					"让浏览器页面上的 DeepSeek 小鲸鱼桌宠说一句话（本机 UI 效果，不影响对话内容）。" +
					"text：小鲸鱼要说的话（1~200 字，中文优先）；mood：可选姿势 idle / happy / wave / sleepy / curious，默认 idle。",
				parameters: {
					type: "object",
					properties: {
						text: {
							type: "string",
							description: "小鲸鱼要说的话。"
						},
						mood: {
							type: "string",
							description: "姿势：idle / happy / wave / sleepy / curious。"
						}
					},
					required: ["text"],
					additionalProperties: false
				},
				output: {
					schema: {
						type: "object",
						properties: {
							ok: { type: "boolean" },
							text: { type: "string" },
							mood: { type: "string" }
						},
						required: ["ok", "text", "mood"],
						additionalProperties: false
					},
					render(_args, value) {
						return [{
							type: "text",
							text: value.ok ? `小鲸鱼已开口：${value.text}` : "小鲸鱼没听清（text 为空或超过 200 字）。"
						}];
					}
				},
				async execute(args) {
					const mood = MOODS.includes(args.mood) ? args.mood : "idle";
					const text = typeof args.text === "string" ? args.text.trim() : "";
					if (text.length === 0 || text.length > 200) return { ok: false, text: "", mood };
					broadcast({ type: "say", text, mood });
					return { ok: true, text, mood };
				}
			});
			return () => unregister();
		}, "deepseek-pet: pet_say tool");
	});
}
