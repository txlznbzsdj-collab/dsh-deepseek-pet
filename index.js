// dsh-deepseek-pet host 侧插件：
//   1. /plugins/pet-events SSE 推送通道（pet_say 命令 + 状态帧 + 配置变更）
//   2. pet_say 工具 —— 模型调用后让小鲸鱼在页面上说话
//   3. PetReducer 状态机 —— 真实 Agent 事件驱动（思考/工作/等待/错误/完成）
//      （状态机移植自 QCYTSN/dsh-dafeiyu，MIT，见 reducer.js）
//   4. 设置：ctx.settings.register（设置→插件→插件配置）+ /config 端点
import { PetReducer } from "./reducer.js";
import Schema from "@deepseek-ai/schemastery";

export const name = "deepseek-pet";
// settings/webServer 等服务可能晚于 bundle loader 就绪；只把 sessions 作为
// 静态依赖，其余通过 ctx.inject 等待，避免插件因启动顺序而完全不挂载。
export const inject = ["sessions"];

/** 桌宠 SSE 端点（webServer exact 路由优先于 client-modules 的 /plugins 前缀）。 */
const EVENTS_ENDPOINT = "/plugins/pet-events";
const CONFIG_ENDPOINT = "/plugins/dsh-deepseek-pet/config";
const MOODS = ["idle", "happy", "wave", "sleepy", "curious", "shy", "surprised", "review", "jump", "spin", "shake"];

export const Config = Schema.object({
	enabled: Schema.boolean().default(true).description("启用小鲸鱼桌宠"),
	scale: Schema.number().min(0.7).max(1.4).step(0.05).default(1).role("slider").description("角色大小"),
	activityLevel: Schema.union([
		Schema.const("quiet").description("安静"),
		Schema.const("normal").description("标准"),
		Schema.const("lively").description("活泼")
	]).default("normal").description("空闲微动作频率"),
	reducedMotion: Schema.boolean().default(false).description("减少动态效果"),
	physicsEnabled: Schema.boolean().default(true).description("自由行走与重力"),
	settingsPanelAnimation: Schema.boolean().default(true).description("设置页打开动画"),
	includeSubagents: Schema.boolean().default(false).description("允许子 Agent 抢占桌宠状态")
}).description("由 DeepSeek Harness 状态驱动的小鲸鱼桌宠");

const DEFAULTS = Object.freeze({
	enabled: true,
	scale: 1,
	activityLevel: "normal",
	reducedMotion: false,
	physicsEnabled: true,
	settingsPanelAnimation: true,
	includeSubagents: false
});

function publicConfig(config = {}) {
	const scale = Number(config.scale);
	const activityLevel = ["quiet", "normal", "lively"].includes(config.activityLevel)
		? config.activityLevel
		: DEFAULTS.activityLevel;
	return {
		enabled: typeof config.enabled === "boolean" ? config.enabled : DEFAULTS.enabled,
		scale: Number.isFinite(scale) ? Math.min(1.4, Math.max(0.7, scale)) : DEFAULTS.scale,
		activityLevel,
		reducedMotion: typeof config.reducedMotion === "boolean" ? config.reducedMotion : DEFAULTS.reducedMotion,
		physicsEnabled: typeof config.physicsEnabled === "boolean" ? config.physicsEnabled : DEFAULTS.physicsEnabled,
		settingsPanelAnimation: typeof config.settingsPanelAnimation === "boolean" ? config.settingsPanelAnimation : DEFAULTS.settingsPanelAnimation,
		includeSubagents: typeof config.includeSubagents === "boolean" ? config.includeSubagents : DEFAULTS.includeSubagents
	};
}

function sseData(frame) {
	return `data: ${JSON.stringify(frame)}\n\n`;
}

function jsonResponse(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"content-length": Buffer.byteLength(payload)
	});
	res.end(payload);
}

function isLoopback(address) {
	return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function localSettingsScope(value) {
	return {
		get: () => value,
		watch: () => () => {},
		update: async (next) => {
			Object.assign(value, next);
		}
	};
}

function mount(ctx) {
	const connections = /* @__PURE__ */ new Set();
	const reducer = new PetReducer();
	let latestStatus = {
		type: "status",
		sessionId: "dsh-host",
		state: "idle",
		phase: "no-session",
		stage: "空闲",
		message: "鲸鲸待命中～有新任务记得叫我哦",
		detail: "DSH 空闲中"
	};

	// ── 设置：优先接入 DSH 设置面板，失败则退回本地内存 ──
	const base = publicConfig();
	const settings = (() => {
		try {
			const registered = ctx.settings?.register?.("dsh-deepseek-pet", Config, { base, applies: "live" });
			if (registered) return registered;
		} catch (error) {
			ctx.logger?.warn?.(`deepseek-pet: settings register failed, using local scope: ${String(error)}`);
		}
		return localSettingsScope(base);
	})();
	reducer.setIncludeSubagents(settings.get().includeSubagents === true);

	const broadcast = (frame) => {
		if (frame?.type === "status" && frame.pulse !== true) latestStatus = frame;
		const line = sseData(frame);
		for (const res of connections) {
			try {
				res.write(line);
			} catch (_) {}
		}
	};

	const applyConfig = (config) => {
		const next = publicConfig(config);
		for (const frame of reducer.setIncludeSubagents(next.includeSubagents === true)) broadcast(frame);
		broadcast({ type: "config", config: next });
	};

	// ── 1) SSE 推送通道 + 配置端点 ──
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
				res.write(sseData({ type: "config", config: publicConfig(settings.get()) }));
				res.write(sseData(latestStatus));
				connections.add(res);
				res.on("close", () => {
					connections.delete(res);
				});
			}
		});
		const keepalive = setInterval(() => {
			for (const res of connections) {
				try {
					res.write(": keepalive\n\n");
				} catch (_) {}
			}
		}, 20000);
		keepalive.unref?.();
		const disposeConfig = ctx.webServer.register({
			kind: "exact",
			path: CONFIG_ENDPOINT,
			handler: async (req, res) => {
				if (!isLoopback(req.socket?.remoteAddress)) {
					jsonResponse(res, 403, { error: "local access only" });
					return;
				}
				const origin = req.headers?.origin;
				if (origin) {
					let originHost;
					try {
						originHost = new URL(origin).host;
					} catch {}
					if (!originHost || originHost !== req.headers.host) {
						jsonResponse(res, 403, { error: "origin mismatch" });
						return;
					}
				}
				if (req.method === "GET") {
					jsonResponse(res, 200, settings.get());
					return;
				}
				if (req.method !== "PATCH") {
					jsonResponse(res, 405, { error: "method not allowed" });
					return;
				}
				try {
					const chunks = [];
					let bytes = 0;
					for await (const chunk of req) {
						bytes += chunk.length;
						if (bytes > 8192) throw new Error("request body is too large");
						chunks.push(chunk);
					}
					const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
					if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("patch must be an object");
					const allowed = new Set(Object.keys(DEFAULTS));
					if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error("patch contains an unknown setting");
					const merged = { ...settings.get(), ...value };
					// 先归一化再交给 DSH Schema：越界 scale 会收敛到 0.7–1.4，
					// 非法枚举/类型回退默认值，不让设置页因校验顺序保存失败。
					const next = publicConfig(merged);
					if (typeof settings.update === "function") await settings.update(next);
					applyConfig(next);
					jsonResponse(res, 200, next);
				} catch (error) {
					jsonResponse(res, 400, { error: error instanceof Error ? error.message : String(error) });
				}
			}
		});
		let stopWatch = () => {};
		try {
			stopWatch = settings.watch?.((value) => {
				applyConfig(value);
			}) ?? (() => {});
		} catch {}
		return () => {
			clearInterval(keepalive);
			disposeRoute();
			disposeConfig();
			stopWatch();
			for (const res of connections) res.destroy();
			connections.clear();
		};
	}, "deepseek-pet: SSE + config channel");

	// ── 2) 会话事件 → 状态机 → 广播 ──
	ctx.on("session/event", (session, event) => {
		let frames;
		try {
			frames = reducer.handle(session, event);
		} catch (error) {
			ctx.logger?.warn?.(`deepseek-pet: reducer error: ${String(error)}`);
			return;
		}
		for (const frame of frames) broadcast(frame);
	}, { global: true });
	ctx.on("session/disposed", (session) => {
		try {
			for (const frame of reducer.disposeSession(session)) broadcast(frame);
		} catch (error) {
			ctx.logger?.warn?.(`deepseek-pet: session cleanup failed: ${String(error)}`);
		}
	}, { global: true });

	// ── 3) pet_say 工具：模型命令桌宠说话 ──
	ctx.on("agent/created", ({ agent }) => {
		agent.ctx.effect(() => {
			const unregister = agent.ctx.tools.register({
				name: "pet_say",
				description:
					"让浏览器页面上的 DeepSeek 小鲸鱼桌宠说一句话（本机 UI 效果，不影响对话内容）。" +
					"text：小鲸鱼要说的话（1~200 字，中文优先）；mood：可选姿势 idle / happy / wave / sleepy / curious / shy / surprised / review / jump / spin / shake，默认 idle。",
				parameters: {
					type: "object",
					properties: {
						text: {
							type: "string",
							description: "小鲸鱼要说的话。"
						},
						mood: {
							type: "string",
							description: "姿势：idle / happy / wave / sleepy / curious / shy / surprised / review / jump / spin / shake。"
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
	}, { global: true });
}

export function apply(ctx) {
	if (typeof ctx.inject === "function") {
		ctx.inject(["settings", "webServer", "agents", "tools"], (serviceCtx) => mount(serviceCtx));
		return;
	}
	mount(ctx);
}
