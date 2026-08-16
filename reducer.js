// dsh-deepseek-pet 状态机 reducer。
// 移植自 QCYTSN/dsh-dafeiyu 的 src/companion-reducer.js（MIT License，
// https://github.com/QCYTSN/dsh-dafeiyu/blob/main/LICENSE），按本项目
// 帧格式与文案风格适配：消费 session/event 流，产出 status 帧。
// 状态：idle / thinking / working / waiting / error / success(脉冲)
// 多会话优先级：等待(60) > 错误(50) > 工作(30) > 思考(20) > 空闲(0)

const STATE_PRIORITY = Object.freeze({
	waiting: 60,
	error: 50,
	working: 30,
	thinking: 20,
	idle: 0
});

/** 按工具名归类活动类型。 */
function toolActivity(name) {
	const value = String(name || "").toLowerCase();
	if (/search|grep|find|glob|web|read|fetch|open/.test(value)) return "searching";
	if (/write|edit|patch|replace|create|move|delete/.test(value)) return "editing";
	if (/test|check|lint|build|verify/.test(value)) return "testing";
	if (/shell|bash|exec|command|terminal|powershell/.test(value)) return "commanding";
	return "working";
}

function sessionIdOf(session) {
	return String(session?.header?.id ?? session?.id ?? "unknown-session");
}

function isSubagent(session) {
	return session?.header?.origin === "subagent" || Number(session?.header?.delegationDepth ?? 0) > 0;
}

function progressOf(todos) {
	if (!Array.isArray(todos) || todos.length === 0) return undefined;
	const completed = todos.filter((todo) => ["completed", "complete", "done"].includes(todo?.status)).length;
	const currentIndex = todos.findIndex((todo) => todo?.status === "in_progress");
	return {
		completed,
		total: todos.length,
		current: currentIndex >= 0 ? currentIndex + 1 : undefined
	};
}

/** 进度/任务文案（只使用真实数据，绝不编造）。 */
function detailFor(record) {
	const parts = [];
	if (record.project) parts.push(record.project);
	if (record.progress?.total) parts.push(`已完成 ${record.progress.completed}/${record.progress.total} 步`);
	if (record.task) parts.push(record.task);
	else if (record.payload?.stage) parts.push(record.payload.stage);
	return parts.join(" · ") || "DSH 任务";
}

/** 确定性文案选取（event.seq 做 seed，同状态稳定轮换）。 */
function pickCopy(group, seed = 0) {
	const number = Number(seed);
	const variants = COPY[group] ?? COPY.working;
	const index = Number.isFinite(number) ? Math.abs(Math.trunc(number)) : [...String(seed ?? "")].reduce((t, c) => t + c.codePointAt(0), 0);
	return variants[index % variants.length];
}

/** 小蓝鲸人设风格的状态文案池。 */
const COPY = Object.freeze({
	idle: [
		"鲸鲸待命中～有新任务记得叫我哦",
		"现在没有任务，鲸鲸先摸摸鱼～",
		"主人不在忙，鲸鲸也歇会儿～"
	],
	preparing: [
		"收到主人！鲸鲸开始梳理任务～",
		"来了来了，鲸鲸先看看要做什么！",
		"正在理清主人的任务呢～"
	],
	thinking: [
		"鲸鲸在认真想下一步呢～",
		"正在梳理思路，主人稍等～",
		"让我整理一下刚才的结果～"
	],
	searching: [
		"正在帮主人找相关文件呢～",
		"鲸鲸在项目里仔细翻找中～",
		"正在查看相关代码呢～"
	],
	editing: [
		"正在帮主人改代码呢～",
		"鲸鲸正在认真调整实现～",
		"这部分正在修改中哦～"
	],
	testing: [
		"正在跑测试帮主人确认呢～",
		"鲸鲸在验证改动有没有问题～",
		"正在检查结果，主人放心～"
	],
	commanding: [
		"正在执行主人的命令呢～",
		"鲸鲸在让项目跑起来～",
		"正在看命令执行得怎么样～"
	],
	working: [
		"鲸鲸正在继续处理任务呢～",
		"这一步正在进行中哦～",
		"鲸鲸还在认真干活呢～"
	],
	result: [
		"正在整理刚才的结果呢～",
		"这一步处理好啦，继续看看～",
		"鲸鲸在确认下一步怎么做～"
	],
	waiting: [
		"需要主人确认一下后续呢～",
		"这里要等主人看一眼哦～",
		"轮到主人来决定下一步啦～"
	],
	success: [
		"这一轮搞定啦主人！",
		"任务完成咯～鲸鲸超棒！",
		"这次的任务顺利收工～"
	],
	toolError: [
		"这一步好像没跑通呢…",
		"刚才的操作遇到一点小问题～",
		"这里卡了一下，鲸鲸再看看～"
	],
	error: [
		"任务好像遇到问题了呢…",
		"这里需要主人回来看看啦～",
		"这次没有顺利跑完呢～"
	],
	stopped: [
		"任务先停在这里哦～",
		"这次任务已经停下啦～"
	],
	limit: [
		"内容有点多，到上限啦～",
		"这次输出到上限咯，主人说'继续'就好～"
	]
});

export class PetReducer {
	constructor({ includeSubagents = false } = {}) {
		this.includeSubagents = includeSubagents;
		this.sessions = new Map();
		this.clock = 0;
		this.selectedSessionId = undefined;
		this.outputSignature = undefined;
	}

	setIncludeSubagents(value) {
		const includeSubagents = value === true;
		if (includeSubagents === this.includeSubagents) return [];
		this.includeSubagents = includeSubagents;
		if (!includeSubagents) {
			for (const [sessionId, record] of this.sessions) {
				if (record.subagent) this.sessions.delete(sessionId);
			}
		}
		return this.render();
	}

	/** 处理一条 session/event；返回要广播的 status 帧数组。 */
	handle(session, event) {
		if (!event || typeof event.type !== "string") return [];
		const subagent = isSubagent(session);
		if (!this.includeSubagents && subagent) return [];

		const sessionId = sessionIdOf(session);
		const record = this.record(sessionId);
		record.subagent = subagent;
		record.lastSeq = Number(event.seq ?? record.lastSeq);
		record.project = projectNameOf(session, event) ?? record.project;

		switch (event.type) {
			case "turn/start":
				record.turnActive = true;
				record.openTools.clear();
				record.task = undefined;
				record.progress = undefined;
				this.update(record, "thinking", { phase: "turn-start", stage: "准备阶段", message: pickCopy("preparing", event.seq) });
				return this.render();

			case "step/start":
			case "assistant/chunk":
			case "assistant/message":
				if (!record.turnActive || record.openTools.size > 0) return [];
				this.update(record, "thinking", { phase: event.type, stage: "分析阶段", message: pickCopy("thinking", event.seq) });
				return this.render();

			case "tool/call": {
				const callId = String(event.data?.callId ?? `seq-${String(event.seq ?? "unknown")}`);
				const name = String(event.data?.name ?? "tool");
				const activity = toolActivity(name);
				record.openTools.set(callId, name);
				this.update(record, "working", {
					phase: "tool-call",
					activity,
					stage: STAGE_OF[activity] ?? "处理阶段",
					toolName: name,
					message: pickCopy(activity, event.seq)
				});
				return this.render();
			}

			case "tool/result":
				return this.toolResult(record, event);

			case "todo/write":
				return this.todo(record, event);

			case "turn/end":
				return this.turnEnd(record, event);

			default:
				return [];
		}
	}

	disposeSession(session) {
		const sessionId = sessionIdOf(session);
		const existed = this.sessions.delete(sessionId);
		if (!existed) return [];
		return this.render();
	}

	toolResult(record, event) {
		const callId = String(event.data?.message?.toolCallId ?? event.data?.message?.callId ?? event.data?.callId ?? "");
		if (callId) record.openTools.delete(callId);
		const next = record.openTools.size > 0 ? "working" : "thinking";
		const nextActivity = next === "working" ? toolActivity(record.openTools.values().next().value) : undefined;
		this.update(record, next, {
			phase: "tool-result",
			activity: nextActivity,
			stage: next === "working" ? (STAGE_OF[nextActivity] ?? "处理阶段") : "整理阶段",
			message: next === "working"
				? pickCopy(nextActivity, event.seq)
				: pickCopy("result", event.seq)
		});
		if (!event.data?.error) return this.render();

		// 工具出错：短暂脉冲后恢复
		const selection = this.select();
		if (selection.record.state === "waiting" || selection.record.state === "error") return this.render(selection);
		this.remember(selection);
		return [statusFrame({
			sessionId: record.id,
			state: "error",
			pulse: true,
			ttlMs: 2000,
			resumeState: selection.record.state,
			resumeMessage: selection.record.payload?.message,
			resumeDetail: detailFor(selection.record),
			message: pickCopy("toolError", event.seq),
			detail: detailFor(record)
		})];
	}

	todo(record, event) {
		const todos = Array.isArray(event.data?.todos) ? event.data.todos : [];
		const current = todos.find((todo) => todo?.status === "in_progress") ?? todos.find((todo) => todo?.status === "pending");
		const progress = progressOf(todos);
		if (!current?.content && !progress) return [];
		const nextTask = current?.content ? String(current.content) : record.task;
		const unchanged = nextTask === record.task
			&& progress?.completed === record.progress?.completed
			&& progress?.total === record.progress?.total;
		if (unchanged) return [];
		record.task = nextTask;
		record.progress = progress;
		record.updatedAt = ++this.clock;
		const selection = this.select();
		if (selection.record.id !== record.id) return this.render(selection);
		return [statusFrame({
			sessionId: record.id,
			state: record.state,
			task: record.task,
			progress: record.progress,
			project: record.project,
			stage: "执行阶段",
			message: taskCopy(record.task),
			detail: detailFor(record)
		})];
	}

	turnEnd(record, event) {
		record.turnActive = false;
		record.openTools.clear();
		const kind = String(event.data?.reason?.kind ?? "completed");

		if (kind === "blocked") {
			this.update(record, "waiting", { phase: "turn-end", stage: "等待确认", message: pickCopy("waiting", event.seq) });
			return this.render();
		}

		if (kind === "aborted") {
			this.update(record, "idle", { phase: "turn-end", stage: "已停止", message: pickCopy("stopped", event.seq) });
			return this.render();
		}

		if (kind !== "completed") {
			this.update(record, "error", {
				phase: "turn-end",
				stage: "需要处理",
				reasonKind: kind,
				message: kind === "max-tokens" ? pickCopy("limit", event.seq) : pickCopy("error", event.seq)
			});
			return this.render();
		}

		this.update(record, "idle", { phase: "turn-end", stage: "已完成", message: pickCopy("idle", event.seq) });
		const selection = this.select();
		if (selection.record.state === "waiting" || selection.record.state === "error") return this.render(selection);
		this.remember(selection);
		return [statusFrame({
			sessionId: record.id,
			state: "success",
			pulse: true,
			ttlMs: 2400,
			resumeState: selection.record.state,
			resumeMessage: selection.record.payload?.message,
			resumeDetail: detailFor(selection.record),
			phase: "turn-end",
			message: pickCopy("success", event.seq),
			detail: detailFor(record, "本轮已完成")
		})];
	}

	record(sessionId) {
		let record = this.sessions.get(sessionId);
		if (record) return record;
		record = {
			id: sessionId,
			state: "idle",
			payload: { phase: "session-created", message: "DSH 空闲中" },
			turnActive: false,
			openTools: new Map(),
			task: undefined,
			progress: undefined,
			project: undefined,
			subagent: false,
			lastSeq: -1,
			updatedAt: ++this.clock
		};
		this.sessions.set(sessionId, record);
		return record;
	}

	update(record, state, payload) {
		record.state = state;
		record.payload = payload;
		record.updatedAt = ++this.clock;
	}

	select() {
		const records = [...this.sessions.values()];
		if (records.length === 0) {
			return { record: { id: "dsh-host", state: "idle", payload: { phase: "no-session", message: "DSH 空闲中" }, updatedAt: ++this.clock } };
		}
		records.sort((left, right) => {
			const priority = (STATE_PRIORITY[right.state] ?? 0) - (STATE_PRIORITY[left.state] ?? 0);
			return priority || right.updatedAt - left.updatedAt || left.id.localeCompare(right.id);
		});
		return { record: records[0] };
	}

	render(selection = this.select()) {
		const signature = this.signature(selection.record);
		if (signature === this.outputSignature) return [];
		this.remember(selection);
		return [statusFrame({
			sessionId: selection.record.id,
			state: selection.record.state,
			...selection.record.payload,
			task: selection.record.task,
			progress: selection.record.progress,
			project: selection.record.project,
			detail: detailFor(selection.record)
		})];
	}

	remember(selection) {
		this.selectedSessionId = selection.record.id;
		this.outputSignature = this.signature(selection.record);
	}

	signature(record) {
		// phase/stage 参与签名，确保“准备→分析→整理”等真实阶段能实时更新；
		// message 不参与，避免流式 chunk 因轮换文案造成高频广播。
		return [
			record.id,
			record.state,
			record.payload?.phase ?? "",
			record.payload?.stage ?? "",
			record.payload?.activity ?? "",
			record.payload?.toolName ?? "",
			record.project ?? "",
			record.task ?? "",
			record.progress?.completed ?? "",
			record.progress?.total ?? ""
		].join("|");
	}
}

const STAGE_OF = Object.freeze({
	searching: "查找阶段",
	editing: "实现阶段",
	testing: "验证阶段",
	commanding: "执行阶段",
	working: "处理阶段"
});

function statusFrame(data) {
	return { type: "status", ...data };
}

function projectNameOf(session, event) {
	const candidates = [
		session?.header?.title,
		session?.header?.name,
		session?.title,
		session?.name,
		session?.header?.cwd,
		session?.cwd,
		event?.data?.cwd
	];
	for (const candidate of candidates) {
		const text = String(candidate ?? "").trim();
		if (!text) continue;
		const pathParts = text.split(/[\\/]/u).filter(Boolean);
		return (pathParts.length > 1 ? pathParts.at(-1) : text).replace(/\s+/gu, " ").slice(0, 40);
	}
	return undefined;
}

function taskCopy(task) {
	const value = String(task ?? "").trim().replace(/[。！？.!?]+$/u, "");
	if (!value) return "鲸鲸在处理中呢～";
	if (/^(正在|继续)/u.test(value)) return `${value}呢～`;
	if (/^(准备|检查|验证|修改|修复|测试|构建|整理|分析|梳理|查找|搜索|读取|实现)/u.test(value)) return `正在${value}呢～`;
	return `正在处理「${value}」呢～`;
}
