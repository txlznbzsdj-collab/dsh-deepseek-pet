// PetReducer 单元测试：事件序列 → 状态迁移 / 优先级选择 / 去重 / 子代理过滤
import { PetReducer } from "./reducer.js";

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

const session = (id, origin = "root") => ({ id, header: { id, origin, cwd: `E:\\proj\\${id}` } });
const ev = (type, seq, data = {}) => ({ type, seq, data });
const frames = (fns) => fns.flat().map((f) => f.type ?? "").filter(Boolean);

// 1) 基本状态流：turn/start → thinking；tool/call → working；tool/result → thinking；turn/end → success 脉冲 + idle
{
  const r = new PetReducer();
  const s = session("s1");
  let out = r.handle(s, ev("turn/start", 1));
  check("turn/start → thinking", out.some((f) => f.state === "thinking"));

  out = r.handle(s, ev("tool/call", 2, { callId: "c1", name: "bash" }));
  check("tool/call → working", out.some((f) => f.state === "working"));
  check("tool/call → commanding 活动类型", out.some((f) => f.state === "working" && f.activity === "commanding"));

  out = r.handle(s, ev("tool/result", 3, { callId: "c1" }));
  check("tool/result → thinking", out.some((f) => f.state === "thinking"));

  out = r.handle(s, ev("turn/end", 4, { reason: { kind: "completed" } }));
  check("turn/end completed → success 脉冲", out.some((f) => f.state === "success" && f.pulse === true));
}

// 2) 错误：turn/end reason error → 持久 error 状态
{
  const r = new PetReducer();
  const s = session("s2");
  r.handle(s, ev("turn/start", 1));
  const out = r.handle(s, ev("turn/end", 2, { reason: { kind: "error", error: {} } }));
  check("turn/end error → error 状态（非脉冲）", out.some((f) => f.state === "error" && !f.pulse));
}

// 3) 等待确认：turn/end reason blocked → waiting
{
  const r = new PetReducer();
  const s = session("s3");
  r.handle(s, ev("turn/start", 1));
  const out = r.handle(s, ev("turn/end", 2, { reason: { kind: "blocked" } }));
  check("turn/end blocked → waiting", out.some((f) => f.state === "waiting"));
}

// 4) todo 进度：todo/write → task + progress
{
  const r = new PetReducer();
  const s = session("s4");
  r.handle(s, ev("turn/start", 1));
  const out = r.handle(s, ev("todo/write", 2, { todos: [
    { status: "completed", content: "调研" },
    { status: "in_progress", content: "实现" },
    { status: "pending", content: "测试" }
  ] }));
  const f = out.find((x) => x.task !== undefined);
  check("todo/write → 任务与真实进度", !!f && f.task === "实现" && f.progress.completed === 1 && f.progress.total === 3);
}

// 5) 多会话优先级：waiting > error > working > thinking > idle
{
  const r = new PetReducer();
  const a = session("a"), b = session("b"), c = session("c");
  r.handle(a, ev("turn/start", 1));                       // a: thinking
  r.handle(b, ev("turn/start", 1)); r.handle(b, ev("tool/call", 2, { callId: "x", name: "bash" })); // b: working
  const out = r.handle(c, ev("turn/end", 2, { reason: { kind: "blocked" } })); // c 直接进入 waiting
  check("多会话优先级 → 选中 waiting 会话", out.some((f) => f.state === "waiting" && f.sessionId === "c"));
}

// 6) 子代理默认忽略
{
  const r = new PetReducer();
  const sub = session("sub", "subagent");
  const out = r.handle(sub, ev("turn/start", 1));
  check("子代理默认忽略", out.length === 0);
  const r2 = new PetReducer({ includeSubagents: true });
  const out2 = r2.handle(sub, ev("turn/start", 1));
  check("includeSubagents=true 时接收子代理", out2.some((f) => f.state === "thinking"));
}

// 7) 阶段更新与去重：准备 → 分析要广播，同一分析阶段不重复广播
{
  const r = new PetReducer();
  const s = session("s7");
  r.handle(s, ev("turn/start", 1));
  const second = r.handle(s, ev("assistant/chunk", 2, {}));
  check("thinking 内部阶段实时更新", second.some((f) => f.stage === "分析阶段"));
  const third = r.handle(s, ev("assistant/chunk", 3, {}));
  check("相同阶段去重（无新帧）", third.length === 0);
}

// 9) Session 销毁：旧的高优先级状态不再抢占
{
  const r = new PetReducer();
  const waiting = session("waiting"), working = session("working");
  r.handle(working, ev("turn/start", 1));
  r.handle(working, ev("tool/call", 2, { callId: "work", name: "edit" }));
  r.handle(waiting, ev("turn/end", 3, { reason: { kind: "blocked" } }));
  const out = r.disposeSession(waiting);
  check("session/disposed → 回退到仍在工作的会话", out.some((f) => f.sessionId === "working" && f.state === "working"));
}

// 8) aborted → idle 已停止
{
  const r = new PetReducer();
  const s = session("s8");
  r.handle(s, ev("turn/start", 1));
  const out = r.handle(s, ev("turn/end", 2, { reason: { kind: "aborted" } }));
  check("turn/end aborted → idle", out.some((f) => f.state === "idle"));
}

console.log(failures === 0 ? "\nREDUCER TEST PASSED" : `\nREDUCER TEST FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
