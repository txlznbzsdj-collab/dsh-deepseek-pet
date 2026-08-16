// dsh-deepseek-pet client.js 冒烟测试 v2：Node VM + DOM stub，
// 覆盖长按撒娇、双击撒花、拖拽回弹、打字偷看、悬停问候、右键菜单、失焦打盹等新互动。
import { readFileSync } from "node:fs";
import vm from "node:vm";

const bundle = readFileSync(new URL("./client.js", import.meta.url), "utf8");

// ---- 最小 DOM stub ----
function makeEl(tag) {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    style: { setProperty(k, v) { this[k] = v; } },
    dataset: {},
    classList: {
      _set: new Set(),
      add(...c) { c.forEach((x) => this._set.add(x)); },
      remove(...c) { c.forEach((x) => this._set.delete(x)); },
      contains(c) { return this._set.has(c); },
      toggle(c, force) {
        const has = this._set.has(c);
        const want = force === undefined ? !has : !!force;
        if (want) this._set.add(c); else this._set.delete(c);
        return want;
      },
    },
    attrs: {},
    _listeners: {},
    innerHTML: "",
    textContent: "",
    src: "",
    alt: "",
    draggable: false,
    id: "",
    title: "",
    offsetWidth: 150,
    offsetHeight: 200,
    appendChild(child) { this.children.push(child); return child; },
    append(...kids) { kids.forEach((k) => this.children.push(k)); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); },
    click() { for (const fn of (this._listeners.click || [])) fn(); },
    remove() { const i = this.children.indexOf(this); if (i >= 0) this.children.splice(i, 1); },
    getBoundingClientRect() { return { left: 10, top: 10, width: 150, height: 200 }; },
    setPointerCapture() {},
    releasePointerCapture() {},
    contains(node) { return this === node || this.children.includes(node); },
  };
  Object.defineProperty(el, "className", {
    get() { return [...this.classList._set].join(" "); },
    set(v) { this.classList._set = new Set(String(v).split(/\s+/).filter(Boolean)); },
  });
  return el;
}

const byId = new Map();
function registerAppend(parent) {
  const orig = parent.appendChild.bind(parent);
  parent.appendChild = (c) => { if (c.id) byId.set(c.id, c); return orig(c); };
}
const documentStub = {
  body: null,
  head: makeEl("head"),
  hidden: false,
  createElement(tag) { return makeEl(tag); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById(id) { return byId.get(id) || null; },
  addEventListener(type, fn) { (this._listeners ||= {})[type] ||= []; this._listeners[type].push(fn); },
};
registerAppend(documentStub.head);
documentStub.body = makeEl("body");
registerAppend(documentStub.body);

const store = new Map();
const localStorageStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const windowStub = {
  innerWidth: 1280,
  innerHeight: 800,
  addEventListener() {},
  localStorage: localStorageStub,
  __ModuleLoader__: { load(handoff) { this._lastFactory = handoff.factory; } },
};

// EventSource stub：捕获实例，测试 SSE 帧处理
const esInstances = [];
class FakeEventSource {
  constructor(url) { this.url = url; this.onmessage = null; this.onerror = null; esInstances.push(this); }
  close() {}
}

const sandbox = {
  window: windowStub,
  document: documentStub,
  localStorage: localStorageStub,
  EventSource: FakeEventSource,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  console,
  Symbol,
  Object,
  Math,
  Number,
  JSON,
  Date,
  Error,
  String,
  Array,
  Promise,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// 确定性随机：所有 pick 取第一项，概率判断恒为 true
sandbox.Math.random = () => 0.1;

let failures = 0;
function check(name, cond) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

vm.runInContext(bundle, sandbox, { filename: "client.js" });
const factory = windowStub.__ModuleLoader__._lastFactory;
check("factory registered", typeof factory === "function");

let modExports;
try {
  modExports = factory((spec) => { throw new Error("require called: " + spec); });
  check("factory materialized", true);
} catch (e) {
  check("factory materialized: " + e.message, false);
}

modExports.apply({});
await sleep(60);

const pet = byId.get("dsh-pet-root");
const bubble = pet.children.find((c) => c.className.includes("dsh-pet-bubble"));
const img = pet.children.find((c) => c.tagName === "IMG");
check("pet mounted", !!pet);
check("bubble present", !!bubble);
check("img present with base64 src", !!img && img.src.startsWith("data:image/png;base64,"));
check("style injected with new animations", documentStub.head.children.some((c) =>
  c.tagName === "STYLE" && c.textContent.includes("dsh-pet-burst") && c.textContent.includes("dsh-pet-idle")));
// Existing interaction assertions expect complete text; streaming has a dedicated assertion below.
esInstances[0].onmessage({ data: JSON.stringify({ type: "config", config: { streamText: false } }) });
await sleep(10);

const pd = (x, y) => pet._listeners.pointerdown[0]({ button: 0, clientX: x, clientY: y, pointerId: 1 });
const pm = (x, y) => pet._listeners.pointermove[0]({ clientX: x, clientY: y });
const pu = (x, y) => pet._listeners.pointerup[0]({ button: 0, clientX: x, clientY: y, pointerId: 1 });

// 1) 单击 → 气泡（人设萌词：主人/大肥鱼/摸鱼/鲸）
pd(100, 100); pm(101, 101); pu(101, 101);
await sleep(320);
check("single click → bubble (人设萌词)", bubble.classList.contains("dsh-pet-show") && /主人|大肥鱼|摸鱼|鲸|吃白饭|女仆/.test(bubble.textContent));

// 2) 长按 700ms → 撒娇台词；松手不触发双击
pd(200, 200);
await sleep(850);
check("long press → 撒娇台词", bubble.textContent.includes("蹭蹭") || bubble.textContent.includes("揉我") || bubble.textContent.includes("摸鱼鱼"));
pu(200, 200);
await sleep(50);
check("long press release → 不触发 happy", img.dataset.pose !== "happy");

// 3) 拖拽 → 位置变化 + bounce
const beforeLeft = pet.style.left;
pd(300, 300);
pm(500, 420);
pu(500, 420);
check("drag → position changed", pet.style.left !== beforeLeft);
check("drag → bounce class added", pet.classList.contains("dsh-pet-bounce"));

// 4) 悬停问候
pet._listeners.mouseenter[0]({});
await sleep(30);
check("hover → wave pose", img.dataset.pose === "wave");
check("hover → 问候语", /哈喽|你来啦|找我有事|看看我/.test(bubble.textContent));

// 5) 右键菜单 → 8 项 + 智能关闭
const menuOpen = () => { pet._listeners.contextmenu[0]({ preventDefault() {}, clientX: 500, clientY: 300 }); return sleep(30); };
await menuOpen();
const menu = byId.get("dsh-pet-menu");
check("menu open", menu.classList.contains("dsh-pet-show"));
check("menu has 8 items", menu.children.length === 8);

// 点菜单外（宠物/页面）→ 收起
documentStub._listeners.pointerdown[0]({ target: {} });
await sleep(20);
check("menu closes on outside click", !menu.classList.contains("dsh-pet-show"));

// Esc → 收起
await menuOpen();
documentStub._listeners.keydown[0]({ key: "Escape" });
await sleep(20);
check("menu closes on Escape", !menu.classList.contains("dsh-pet-show"));

// 滚动 → 收起（空闲状态）
await menuOpen();
documentStub._listeners.scroll[0]({});
await sleep(20);
check("menu closes on scroll (idle)", !menu.classList.contains("dsh-pet-show"));

// 模型运行中（thinking）滚动 → 不收起（对话流式输出自动滚动不能关菜单）
esInstances[0].onmessage({ data: JSON.stringify({ type: "status", state: "thinking", message: "思考中" }) });
await sleep(30);
await menuOpen();
documentStub._listeners.scroll[0]({});
await sleep(20);
check("menu stays open on scroll (thinking)", menu.classList.contains("dsh-pet-show"));
// 结束 thinking，避免影响后续用例
esInstances[0].onmessage({ data: JSON.stringify({ type: "status", state: "idle", message: "空闲" }) });
await sleep(30);

// 点菜单项 → 收起 + 执行
await menuOpen();
menu.children[0].click();
await sleep(30);
check("menu item click closes", !menu.classList.contains("dsh-pet-show"));

// 6) 打字偷看（keydown[1] 是打字监听，keydown[0] 是 Esc 监听）
documentStub._listeners.keydown[1]({ target: { tagName: "TEXTAREA" } });
await sleep(50);
check("keydown in textarea → 偷看台词", bubble.classList.contains("dsh-pet-show") && /主人|鲸|偷偷|康康|手速|键盘/.test(bubble.textContent));

// 7) 双击 → happy 姿势 + 撒花粒子
const beforeParticles = pet.children.filter((c) => c.className.includes("dsh-pet-particle")).length;
pd(100, 100); pu(100, 100); pd(100, 100); pu(100, 100);
await sleep(50);
const particles = pet.children.filter((c) => c.className.includes("dsh-pet-particle")).length;
check("double click → happy pose", img.dataset.pose === "happy");
check("double click → burst particles", particles > beforeParticles);

// 8) 失焦 → 打盹；回来 → 唤醒
documentStub.hidden = true;
documentStub._listeners.visibilitychange[0]({});
await sleep(30);
check("hidden → sleepy pose", img.dataset.pose === "sleepy");
documentStub.hidden = false;
documentStub._listeners.visibilitychange[0]({});
await sleep(30);
check("visible → wake idle", img.dataset.pose === "idle");

// 9) SSE 链路：pet_say 命令 + status 状态机（思考/工作/等待/错误/成功）
const es = esInstances[0];
check("EventSource connected to /plugins/pet-events", !!es && es.url === "/plugins/pet-events");
if (es) {
  es.onmessage({ data: JSON.stringify({ type: "say", text: "主人加油！", mood: "happy" }) });
  await sleep(30);
  check("say frame → bubble 显示命令文本", bubble.textContent === "主人加油！" && bubble.classList.contains("dsh-pet-show"));
  check("say frame → mood 姿势", img.dataset.pose === "happy");

  // status: thinking → review 思考姿势 + 文案
  es.onmessage({ data: JSON.stringify({ type: "status", state: "thinking", message: "收到主人！鲸鲸开始梳理任务～", detail: "分析阶段" }) });
  await sleep(30);
  check("status thinking → review 思考姿势", img.dataset.pose === "review");
  check("status thinking → 思考气泡", /思考|梳理|收到/.test(bubble.textContent) || bubble.textContent.includes("分析阶段"));

  // status: working → curious + 活动文案
  es.onmessage({ data: JSON.stringify({ type: "status", state: "working", activity: "searching", message: "正在帮主人找相关文件呢～", detail: "查找阶段" }) });
  await sleep(30);
  check("status working → curious 姿势", img.dataset.pose === "curious");
  check("status working → 活动气泡", bubble.textContent.includes("找相关文件"));

  // status: waiting → curious + 等待文案
  es.onmessage({ data: JSON.stringify({ type: "status", state: "waiting", message: "需要主人确认一下后续呢～" }) });
  await sleep(30);
  check("status waiting → 等待气泡", bubble.textContent.includes("确认"));

  // status: success 脉冲 → happy/jump 庆祝
  es.onmessage({ data: JSON.stringify({ type: "status", state: "success", pulse: true, ttlMs: 2400, message: "这一轮搞定啦主人！", resumeState: "idle" }) });
  await sleep(30);
  check("status success → happy/jump 庆祝", img.dataset.pose === "happy" || img.dataset.pose === "jump");
  check("status success → 完成台词", /完成|搞定|收工/.test(bubble.textContent));

  // status: error 持久 → surprised + 错误文案
  es.onmessage({ data: JSON.stringify({ type: "status", state: "error", message: "任务好像遇到问题了呢…" }) });
  await sleep(30);
  check("status error → surprised 姿势", img.dataset.pose === "surprised");
  check("status error → 错误气泡", bubble.textContent.includes("问题"));

  // status: idle → 回到 idle
  es.onmessage({ data: JSON.stringify({ type: "status", state: "idle", message: "鲸鲸待命中～" }) });
  await sleep(30);
  check("status idle → idle 姿势", img.dataset.pose === "idle");

  // config 帧：scale + reducedMotion + enabled
  es.onmessage({ data: JSON.stringify({ type: "config", config: { enabled: true, scale: 1.2, activityLevel: "lively", reducedMotion: true } }) });
  await sleep(30);
  check("config scale → 宽度变化", pet.style.width === "180px");
  check("config reducedMotion → 类生效", pet.classList.contains("dsh-pet-reduced"));
  es.onmessage({ data: JSON.stringify({ type: "config", config: { enabled: false } }) });
  await sleep(20);
  check("config enabled=false → 隐藏", pet.style.display === "none");
  es.onmessage({ data: JSON.stringify({ type: "config", config: { enabled: true, scale: 1, activityLevel: "normal", reducedMotion: false } }) });
  await sleep(20);
  es.onmessage({ data: JSON.stringify({ type: "config", config: { streamText: true } }) });
  es.onmessage({ data: JSON.stringify({ type: "say", text: "stream-test", mood: "idle" }) });
  await sleep(20);
  check("stream text → partial first", bubble.textContent.length > 0 && bubble.textContent !== "stream-test");
  await sleep(900);
  check("stream text → complete eventually", bubble.textContent === "stream-test");
  check("config enabled=true → 恢复显示", pet.style.display !== "none");

  // 10) 新姿势：shy 精灵姿势 + jump CSS 姿势（pet_say mood）
  es.onmessage({ data: JSON.stringify({ type: "say", text: "测 shy", mood: "shy" }) });
  await sleep(30);
  check("mood shy → shy 姿势", img.dataset.pose === "shy" && img.src.includes("data:image/png;base64"));
  es.onmessage({ data: JSON.stringify({ type: "say", text: "测 jump", mood: "jump" }) });
  await sleep(30);
  check("mood jump → jump CSS 姿势类", pet.classList.contains("dsh-pet-pose-jump"));
  check("mood jump → pose 记录为 jump", img.dataset.pose === "jump");

  // 11) 动作中悬停 → 不打断（转圈进行中悬停，姿势不被重置）
  es.onmessage({ data: JSON.stringify({ type: "say", text: "测 spin", mood: "spin" }) });
  await sleep(30);
  check("mood spin → spin 姿势", img.dataset.pose === "spin");
  pet._listeners.mouseenter[0]({});
  await sleep(20);
  check("hover during spin → 姿势保持 spin（不被重置为 wave）", img.dataset.pose === "spin");
  check("hover during spin → spin 动画类仍在", pet.classList.contains("dsh-pet-pose-spin"));
  // 等 spin 完成自动回 idle
  await sleep(1000);
  check("spin 完成后回 idle", img.dataset.pose === "idle");
}

console.log(failures === 0 ? "\nSMOKE TEST PASSED" : `\nSMOKE TEST FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
