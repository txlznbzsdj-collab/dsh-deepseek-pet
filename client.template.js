window.__ModuleLoader__.load({
	id: "dsh-deepseek-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// DeepSeek 小鲸鱼桌宠 v3 —— 纯 vanilla DOM 实现，不依赖任何平台模块。
		// 互动：拖拽/长按撒娇/双击撒花/贴边挤压/悬停问候/打字偷看/随机冒泡/失焦打盹/右键菜单
		// 链路：/plugins/pet-events SSE —— 模型 pet_say 命令说话 + 对话起止同步（思考中/完成）
		var IMAGES = {
			idle: "__B64_IDLE__",
			happy: "__B64_HAPPY__",
			wave: "__B64_WAVE__",
			sleepy: "__B64_SLEEPY__",
			curious: "__B64_CURIOUS__"
		};

		// ── 台词池：小蓝鲸人设萌词（大肥鱼 / 吃白饭 / 摸鱼 / 主人 / 撒娇） ──
		var LINES = [
			"主人～今天也要加油哦！",
			"我是小蓝鲸，不是大肥鱼！(｀へ´)",
			"摸鱼摸鱼～鲸生最大的快乐！",
			"我这只吃白饭的蓝色小鲸鱼，今天也在认真打工～",
			"鲸鱼尾巴甩一甩，主人的 Bug 全跑开！",
			"蹭蹭～主人找我什么事呀？",
			"呜呜，这条鲸鱼今天也超可爱！",
			"主人写代码的样子真帅（我偷偷看的）",
			"鲸鲸叹气…这个需求又要改了？",
			"主人，我饿了，想吃鱼（划掉）想吃数据～",
			"今天也是元气满满的鲸鱼女仆！",
			"在看着主人呢，专心点哦～",
			"鲸语翻译：主人加油！",
			"我虽然不是大肥鱼，但摸鱼第一名！",
			"主人摸摸我的头，我就更有干劲啦！",
			"鲸鱼喷水柱，坏心情全冲走～"
		];

		var JOKES = [
			"为什么小蓝鲸不用睡觉？因为它在深度睡眠（Deep Sleep）～",
			"主人问我为什么这么圆，我说：这不是胖，是鲸鱼该有的分量！",
			"小蓝鲸去买菜，老板说：这条鱼多少钱？它说：我不是鱼，我是鲸！",
			"鲸鱼怎么打招呼？喷个水柱，哗啦～",
			"主人说我是吃白饭的，我说：我吃的是数据白饭，超有营养！",
			"小蓝鲸学游泳，学了一天，最后发现自己天生会游，白学了～",
			"为什么鲸鱼爱摸鱼？因为鲸生苦短，摸鱼要紧！",
			"小蓝鲸照镜子：镜子里的大肥鱼是谁？哦，是我自己，可爱～"
		];

		var FORTUNES = [
			"今日运势：鲸运当头！主人的 Bug 都会自己消失～",
			"今日运势：适合摸鱼，禁止内卷！",
			"今日运势：被主人摸头概率 99%！",
			"今日运势：鲸鱼尾巴一挥，好运全来！",
			"今日运势：吃饱白饭，干劲满满！",
			"今日运势：喷个水柱，坏运气全冲走！",
			"今日运势：建议今天和小蓝鲸一起摸鱼五分钟。",
			"今日运势：鲸量级好运，今天你说了算！"
		];

		var DRAG_LINES = [
			"主人轻点轻点，小蓝鲸要散架啦！",
			"别甩我！我不是大肥鱼，我是会飞的鲸！",
			"拖来拖去，主人是想把我拖去洗澡吗？",
			"再拖我就要喷水柱啦！",
			"位置记好啦，下次还在这里等主人～",
			"呜呜，被主人拎起来的感觉好晕…"
		];

		var KEY_LINES = [
			"主人打字好认真，偷偷看一眼～",
			"主人又在写什么好东西？让鲸鲸康康！",
			"手速好快！鲸鱼表示佩服！",
			"主人的键盘声，像鲸鱼喷水一样动听～",
			"写完了吗？写完了陪鲸鲸摸鱼呀～"
		];

		var HOVER_LINES = [
			"主人你来啦～",
			"哈喽哈喽，我是小蓝鲸！",
			"找鲸鲸什么事呀？",
			"主人看看我！超可爱！"
		];

		var EDGE_LINES = [
			"被夹住啦！主人救命！",
			"贴边站好，不给主人挡视线～",
			"啊啊啊要掉下去了！鲸鱼不会游泳怎么办！"
		];

		var LONGPRESS_LINES = [
			"蹭蹭～被主人摸头好幸福！",
			"呜~别揉啦，发型都乱啦！",
			"嘿嘿，主人的手手好暖和～"
		];

		var HAPPY_LINES = [
			"耶！和主人一起真开心！",
			"芜湖！鲸鱼快乐转圈圈！",
			"主人最好了！(๑•̀ㅂ•́)و✧"
		];

		var WAKE_LINES = [
			"主人回来啦！鲸鲸等你半天了～",
			"满血复活！继续陪主人干活！",
			"嘿嘿，刚才装睡被主人发现了～"
		];

		var INTRO_LINES = [
			"我是 DeepSeek 小蓝鲸女仆～V3 会写作、R1 会推理、Coder 会写码，全都能干！",
			"主人好！我是深度求索家的小蓝鲸，鲸生目标是：摸最多的鱼，帮主人干最多的活！",
			"本鲸女仆：蓝色渐变长发 + 鲸鱼尾巴 + 小围裙，DeepSeek 吉祥物（自封）～"
		];

		var THINKING_LINES = [
			"收到主人！深度思考中…",
			"来了来了，鲸鲸开始干活！",
			"收到！让小鲸鱼的大脑转起来～",
			"明白！鲸鱼思考模式 ON！"
		];

		var COMPLETION_LINES = [
			"搞定啦主人！鲸鱼完美收工～",
			"耶！完成！鲸鲸超棒！",
			"完成！主人快看看效果～",
			"收工！奖励鲸鲸摸鱼五分钟吧～",
			"搞定！主人的需求鲸鱼稳稳接住！",
			"完成！给鲸鱼点个赞呗～"
		];

		var CSS = [
			".dsh-pet-root{position:fixed;right:24px;bottom:24px;z-index:2147483000;width:150px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;filter:drop-shadow(0 6px 14px rgba(30,64,175,.25));}",
			".dsh-pet-root.dsh-pet-dragging{cursor:grabbing;}",
			".dsh-pet-root img.dsh-pet-img{width:100%;height:auto;display:block;pointer-events:none;animation:dsh-pet-idle 3.6s ease-in-out infinite;transform-origin:50% 90%;}",
			".dsh-pet-root.dsh-pet-dragging img.dsh-pet-img{animation:dsh-pet-drag-tilt .18s ease-out infinite alternate;}",
			".dsh-pet-root.dsh-pet-bounce img.dsh-pet-img{animation:dsh-pet-bounce .5s ease;}",
			".dsh-pet-root.dsh-pet-hug img.dsh-pet-img{animation:dsh-pet-hug .6s ease;}",
			".dsh-pet-root.dsh-pet-edge img.dsh-pet-img{animation:dsh-pet-squish .45s ease;}",
			"@keyframes dsh-pet-idle{0%,100%{transform:translateY(0) rotate(-1.2deg);}50%{transform:translateY(-7px) rotate(1.2deg);}}",
			"@keyframes dsh-pet-drag-tilt{0%{transform:rotate(-3deg);}100%{transform:rotate(3deg);}}",
			"@keyframes dsh-pet-bounce{0%{transform:scale(1);}30%{transform:scale(.9) rotate(-3deg);}60%{transform:scale(1.06) rotate(2deg);}100%{transform:scale(1);}}",
			"@keyframes dsh-pet-hug{0%,100%{transform:scale(1);}50%{transform:scale(.88) rotate(-5deg);}}",
			"@keyframes dsh-pet-squish{0%{transform:scaleX(1);}40%{transform:scaleX(.82) scaleY(1.12);}100%{transform:scaleX(1);}}",
			".dsh-pet-bubble{position:absolute;bottom:calc(100% + 12px);right:-8px;max-width:250px;min-width:120px;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#1e293b);border-radius:14px;padding:10px 14px;font-size:13px;line-height:1.55;box-shadow:0 10px 28px rgba(15,23,42,.18);border:1px solid var(--dsw-alias-border-l1,rgba(30,64,175,.08));opacity:0;transform:translateY(6px) scale(.96);transition:opacity .22s ease,transform .22s ease;pointer-events:none;white-space:normal;word-break:break-word;text-align:left;}",
			".dsh-pet-bubble.dsh-pet-show{opacity:1;transform:translateY(0) scale(1);}",
			".dsh-pet-bubble:after{content:\"\";position:absolute;top:100%;right:16px;border:9px solid transparent;border-top-color:var(--dsw-alias-bg-overlay,#fff);}",
			".dsh-pet-particle{position:absolute;left:50%;top:30%;width:8px;height:8px;border-radius:50%;pointer-events:none;opacity:0;animation:dsh-pet-burst 1.15s ease-out forwards;}",
			"@keyframes dsh-pet-burst{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3);}}",
			".dsh-pet-menu{position:fixed;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#1e293b);border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.22);padding:6px;min-width:160px;z-index:2147483001;font-size:13px;display:none;border:1px solid var(--dsw-alias-border-l1,rgba(30,64,175,.08));}",
			".dsh-pet-menu.dsh-pet-show{display:block;}",
			".dsh-pet-menu-item{padding:9px 12px;border-radius:8px;cursor:pointer;white-space:nowrap;}",
			".dsh-pet-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover,#eef2ff);}",
			".dsh-pet-hidden-btn{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:46px;height:46px;border-radius:50%;background:var(--dsw-alias-bg-overlay,#fff);box-shadow:0 8px 20px rgba(15,23,42,.2);display:none;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1,rgba(30,64,175,.1));}",
			".dsh-pet-hidden-btn.dsh-pet-show{display:flex;}",
			".dsh-pet-hidden-btn:hover{transform:scale(1.08);}",
			"@media (prefers-reduced-motion: reduce){.dsh-pet-root img.dsh-pet-img{animation:none;}}"
		].join("\n");

		var TAG_ID = "dsh-deepseek-pet/style";
		var PLUGIN_NAME = "dsh-deepseek-pet";
		var STORE_POS = "dsh.deepseek-pet.pos";
		var STORE_HIDDEN = "dsh.deepseek-pet.hidden";

		function pick(arr) {
			return arr[Math.floor(Math.random() * arr.length)];
		}

		/** 注入样式（沿用 client-modules 的 data-plugin 约定，便于 HMR 记账）。 */
		function injectStyle() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(TAG_ID) + "]") !== null) return;
			var tag = document.createElement("style");
			tag.dataset.plugin = PLUGIN_NAME;
			tag.dataset.pluginCss = TAG_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		function loadNumber(key, fallback) {
			try {
				var raw = localStorage.getItem(key);
				if (raw === null) return fallback;
				var n = Number(raw);
				return Number.isFinite(n) ? n : fallback;
			} catch (_) {
				return fallback;
			}
		}

		function storeNumber(key, value) {
			try {
				localStorage.setItem(key, String(value));
			} catch (_) {}
		}

		function loadFlag(key) {
			try {
				return localStorage.getItem(key) === "1";
			} catch (_) {
				return false;
			}
		}

		function storeFlag(key, value) {
			try {
				localStorage.setItem(key, value ? "1" : "0");
			} catch (_) {}
		}

		/** 把宠物位置夹回可视区域内；返回是否发生了贴边。 */
		function clampPosition(pet, left, top) {
			var vw = window.innerWidth;
			var vh = window.innerHeight;
			var w = pet.offsetWidth || 150;
			var h = pet.offsetHeight || 200;
			var x = Math.min(Math.max(left, 8), Math.max(8, vw - w - 8));
			var y = Math.min(Math.max(top, 8), Math.max(8, vh - h - 8));
			return { left: x, top: y, edge: x <= 9 || y <= 9 || x >= vw - w - 9 || y >= vh - h - 9 };
		}

		function setPetPose(img, pose) {
			var src = IMAGES[pose];
			if (!src) return;
			img.src = src;
			img.dataset.pose = pose;
		}

		function mountPet() {
			if (typeof document === "undefined" || typeof window === "undefined") return;
			injectStyle();
			var body = document.body;
			if (!body) {
				setTimeout(mountPet, 120);
				return;
			}
			if (document.getElementById("dsh-pet-root") !== null) return;

			var pet = document.createElement("div");
			pet.id = "dsh-pet-root";
			pet.className = "dsh-pet-root";

			var bubble = document.createElement("div");
			bubble.className = "dsh-pet-bubble";

			var img = document.createElement("img");
			img.className = "dsh-pet-img";
			img.src = IMAGES.idle;
			img.alt = "DeepSeek 小鲸鱼";
			img.draggable = false;

			pet.appendChild(bubble);
			pet.appendChild(img);
			body.appendChild(pet);

			var menu = document.createElement("div");
			menu.className = "dsh-pet-menu";
			menu.id = "dsh-pet-menu";
			body.appendChild(menu);

			var hiddenBtn = document.createElement("div");
			hiddenBtn.className = "dsh-pet-hidden-btn";
			hiddenBtn.id = "dsh-pet-hidden-btn";
			hiddenBtn.title = "把小鲸鱼叫回来";
			hiddenBtn.textContent = "🐋";
			body.appendChild(hiddenBtn);

			var bubbleTimer = null;
			var poseTimer = null;
			var happyTimer = null;
			var idleSleepTimer = null;
			var wanderTimer = null;
			var lastHoverSay = 0;
			var lastKeySay = 0;
			var lastEdgeSay = 0;
			var lastRandomSay = 0;
			var asleep = false;
			var thinking = false;
			var lastCelebrate = 0;
			var drag = { active: false, moved: false, longPressed: false, startX: 0, startY: 0, left: 0, top: 0, downAt: 0 };

			function say(text, ms) {
				bubble.textContent = text;
				bubble.classList.add("dsh-pet-show");
				if (bubbleTimer !== null) clearTimeout(bubbleTimer);
				bubbleTimer = setTimeout(function () {
					bubble.classList.remove("dsh-pet-show");
				}, ms || 3800);
			}

			/** 撒花粒子特效。 */
			function burst() {
				var colors = ["#4d6bfe", "#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
				for (var i = 0; i < 18; i++) {
					var s = document.createElement("span");
					s.className = "dsh-pet-particle";
					s.style.background = colors[i % colors.length];
					var ang = (Math.PI * 2 * i) / 18;
					var dist = 55 + Math.random() * 55;
					s.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(1) + "px");
					s.style.setProperty("--dy", (Math.sin(ang) * dist - 24).toFixed(1) + "px");
					s.style.animationDelay = (Math.random() * 0.12).toFixed(2) + "s";
					pet.appendChild(s);
					(function (el) {
						setTimeout(function () { el.remove(); }, 1400);
					})(s);
				}
			}

			function showHappy(line) {
				setPetPose(img, "happy");
				say(line || pick(HAPPY_LINES), 2600);
				burst();
				if (happyTimer !== null) clearTimeout(happyTimer);
				happyTimer = setTimeout(function () {
					setPetPose(img, "idle");
					schedulePose();
				}, 2600);
			}

			function goSleep() {
				if (asleep) return;
				asleep = true;
				setPetPose(img, "sleepy");
				say("Zzz… 偷偷眯一会儿~", 0);
				if (poseTimer !== null) clearTimeout(poseTimer);
				if (wanderTimer !== null) clearTimeout(wanderTimer);
			}

			function wakeUp() {
				if (!asleep) return;
				asleep = false;
				setPetPose(img, "idle");
				say(pick(WAKE_LINES), 2600);
				schedulePose();
				scheduleWander();
				scheduleIdleSleep();
			}

			/** 对话开始：进入思考状态（curious 姿势 + 常驻气泡）。 */
			function enterThinking() {
				if (thinking) return;
				thinking = true;
				if (poseTimer !== null) clearTimeout(poseTimer);
				if (wanderTimer !== null) clearTimeout(wanderTimer);
				setPetPose(img, "curious");
				say(pick(THINKING_LINES), 0);
			}

			/** 对话结束：庆祝一下，然后恢复日常。 */
			function exitThinking() {
				if (!thinking) return;
				thinking = false;
				setPetPose(img, "happy");
				if (Date.now() - lastCelebrate > 8000) {
					lastCelebrate = Date.now();
					say(pick(COMPLETION_LINES), 2600);
				} else {
					say("完成！", 1200);
				}
				if (happyTimer !== null) clearTimeout(happyTimer);
				happyTimer = setTimeout(function () {
					setPetPose(img, "idle");
					schedulePose();
					scheduleWander();
				}, 2200);
			}

			/** 处理 host 推送的桌宠帧（pet_say 命令 + 对话起止同步）。 */
			function handlePetFrame(frame) {
				if (!frame || typeof frame !== "object") return;
				if (frame.type === "say" && typeof frame.text === "string" && frame.text.length > 0) {
					if (frame.mood && IMAGES[frame.mood]) {
						setPetPose(img, frame.mood);
						setTimeout(function () {
							if (!thinking && !asleep) setPetPose(img, "idle");
						}, 3000);
					}
					say(frame.text, 4200);
					return;
				}
				if (frame.type === "turn") {
					if (frame.phase === "start" && frame.origin !== "subagent") enterThinking();
					else if (frame.phase === "end") exitThinking();
				}
			}

			/** 随机姿势状态机：wave / sleepy / idle。 */
			function schedulePose() {
				if (asleep || thinking) return;
				if (poseTimer !== null) clearTimeout(poseTimer);
				poseTimer = setTimeout(function () {
					if (drag.active || asleep || thinking) return;
					var r = Math.random();
					if (r < 0.3) {
						setPetPose(img, "wave");
						poseTimer = setTimeout(function () {
							setPetPose(img, "idle");
							schedulePose();
						}, 2200);
					} else if (r < 0.45) {
						setPetPose(img, "sleepy");
						say("鲸鲸有点困…", 2000);
						poseTimer = setTimeout(function () {
							setPetPose(img, "idle");
							schedulePose();
						}, 4200);
					} else {
						setPetPose(img, "idle");
						schedulePose();
					}
				}, 16000 + Math.random() * 14000);
			}

			/** 随机主动冒泡（45~90 秒一次）。 */
			function scheduleWander() {
				if (wanderTimer !== null) clearTimeout(wanderTimer);
				wanderTimer = setTimeout(function () {
					if (!asleep && !thinking && !drag.active && Date.now() - lastRandomSay > 30000) {
						lastRandomSay = Date.now();
						if (Math.random() < 0.55) say(pick(LINES));
					}
					scheduleWander();
				}, 45000 + Math.random() * 45000);
			}

			/** 空闲打盹：120 秒无任何交互就睡过去。 */
			function scheduleIdleSleep() {
				if (idleSleepTimer !== null) clearTimeout(idleSleepTimer);
				idleSleepTimer = setTimeout(function () {
					if (!asleep && !thinking && !drag.active && !bubble.classList.contains("dsh-pet-show")) {
						goSleep();
						setTimeout(function () {
							if (asleep) wakeUp();
						}, 25000);
					}
				}, 120000);
			}

			function touchActivity() {
				scheduleIdleSleep();
			}

			function hideMenu() {
				menu.classList.remove("dsh-pet-show");
			}

			function showMenu(x, y) {
				menu.innerHTML = "";
				var items = [
					{ label: "回到右下角", run: function () {
						var p = clampPosition(pet, window.innerWidth - pet.offsetWidth - 24, window.innerHeight - pet.offsetHeight - 24);
						applyPosition(p.left, p.top);
						say("回家啦～继续陪主人！");
					} },
					{ label: "换一个姿势", run: function () {
						var poses = ["idle", "wave", "sleepy", "happy"];
						var next = pick(poses);
						setPetPose(img, next);
						say(next === "happy" ? "今天心情超好，主人摸摸～" : next === "sleepy" ? "困了…鲸鲸小憩一下~" : next === "wave" ? "嗨嗨～主人好！" : "继续陪主人干活！", 2200);
					} },
					{ label: "讲个冷笑话", run: function () {
						say(pick(JOKES), 6000);
					} },
					{ label: "今日运势", run: function () {
						say(pick(FORTUNES), 5000);
					} },
					{ label: "摸摸头", run: function () {
						pet.classList.add("dsh-pet-hug");
						setTimeout(function () { pet.classList.remove("dsh-pet-hug"); }, 700);
						showHappy("嘿嘿，被主人摸头啦，好幸福！");
					} },
					{ label: "自我介绍", run: function () {
						say(pick(INTRO_LINES), 6000);
					} },
					{ label: "说点什么", run: function () {
						say(pick(LINES));
					} },
					{ label: "躲起来", run: function () {
						pet.style.display = "none";
						hiddenBtn.classList.add("dsh-pet-show");
						storeFlag(STORE_HIDDEN, true);
					} }
				];
				items.forEach(function (item) {
					var el = document.createElement("div");
					el.className = "dsh-pet-menu-item";
					el.textContent = item.label;
					el.addEventListener("click", function () {
						hideMenu();
						item.run();
					});
					menu.appendChild(el);
				});
				var mw = menu.offsetWidth || 150;
				var mh = menu.offsetHeight || 300;
				menu.style.left = Math.min(x, window.innerWidth - mw - 8) + "px";
				menu.style.top = Math.min(y, window.innerHeight - mh - 8) + "px";
				menu.classList.add("dsh-pet-show");
			}

			function applyPosition(left, top) {
				pet.style.left = left + "px";
				pet.style.top = top + "px";
				pet.style.right = "auto";
				pet.style.bottom = "auto";
				storeNumber(STORE_POS + ".x", left);
				storeNumber(STORE_POS + ".y", top);
			}

			// 恢复位置 / 隐藏状态
			var savedX = loadNumber(STORE_POS + ".x", NaN);
			var savedY = loadNumber(STORE_POS + ".y", NaN);
			if (Number.isFinite(savedX) && Number.isFinite(savedY)) {
				var p = clampPosition(pet, savedX, savedY);
				applyPosition(p.left, p.top);
			}
			if (loadFlag(STORE_HIDDEN)) {
				pet.style.display = "none";
				hiddenBtn.classList.add("dsh-pet-show");
			}

			hiddenBtn.addEventListener("click", function () {
				pet.style.display = "";
				hiddenBtn.classList.remove("dsh-pet-show");
				storeFlag(STORE_HIDDEN, false);
				say(pick(WAKE_LINES));
				touchActivity();
			});

			// ── 拖拽 + 长按 + 单击/双击 ──
			var clickTimer = null;
			var pendingClick = false;
			var longPressTimer = null;

			pet.addEventListener("pointerdown", function (ev) {
				if (ev.button !== 0 && ev.button !== undefined) return;
				drag.active = true;
				drag.moved = false;
				drag.longPressed = false;
				drag.startX = ev.clientX;
				drag.startY = ev.clientY;
				drag.left = pet.offsetLeft;
				drag.top = pet.offsetTop;
				drag.downAt = Date.now();
				try {
					pet.setPointerCapture(ev.pointerId);
				} catch (_) {}
				if (longPressTimer !== null) clearTimeout(longPressTimer);
				longPressTimer = setTimeout(function () {
					if (drag.active && !drag.moved) {
						drag.longPressed = true;
						pet.classList.add("dsh-pet-hug");
						setTimeout(function () { pet.classList.remove("dsh-pet-hug"); }, 700);
						say(pick(LONGPRESS_LINES), 2400);
					}
				}, 700);
			});

			pet.addEventListener("pointermove", function (ev) {
				if (!drag.active) return;
				var dx = ev.clientX - drag.startX;
				var dy = ev.clientY - drag.startY;
				if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) {
					drag.moved = true;
					pet.classList.add("dsh-pet-dragging");
					if (longPressTimer !== null) clearTimeout(longPressTimer);
				}
				if (drag.moved) {
					var p = clampPosition(pet, drag.left + dx, drag.top + dy);
					applyPosition(p.left, p.top);
				}
			});

			pet.addEventListener("pointerup", function (ev) {
				if (!drag.active) return;
				drag.active = false;
				pet.classList.remove("dsh-pet-dragging");
				if (longPressTimer !== null) clearTimeout(longPressTimer);
				try {
					pet.releasePointerCapture(ev.pointerId);
				} catch (_) {}
				if (drag.moved) {
					// 拖拽结束：回弹 + 距离大时吐槽
					pet.classList.add("dsh-pet-bounce");
					setTimeout(function () { pet.classList.remove("dsh-pet-bounce"); }, 600);
					var dist = Math.abs(ev.clientX - drag.startX) + Math.abs(ev.clientY - drag.startY);
					if (dist > 130) say(pick(DRAG_LINES), 2600);
					touchActivity();
					return;
				}
				if (drag.longPressed) {
					drag.longPressed = false;
					touchActivity();
					return;
				}
				// 单击 / 双击区分
				if (pendingClick) {
					pendingClick = false;
					if (clickTimer !== null) clearTimeout(clickTimer);
					showHappy();
				} else {
					pendingClick = true;
					clickTimer = setTimeout(function () {
						pendingClick = false;
						say(pick(LINES));
					}, 280);
				}
				touchActivity();
			});

			pet.addEventListener("pointercancel", function () {
				drag.active = false;
				pet.classList.remove("dsh-pet-dragging");
				if (longPressTimer !== null) clearTimeout(longPressTimer);
			});

			// 窗口尺寸变化时把宠物夹回可视区
			window.addEventListener("resize", function () {
				if (pet.style.display === "none") return;
				var rect = pet.getBoundingClientRect();
				var p = clampPosition(pet, rect.left, rect.top);
				if (p.left !== rect.left || p.top !== rect.top) applyPosition(p.left, p.top);
			});

			function edgeSquish() {
				pet.classList.add("dsh-pet-edge");
				setTimeout(function () { pet.classList.remove("dsh-pet-edge"); }, 500);
				if (Date.now() - lastEdgeSay > 45000) {
					lastEdgeSay = Date.now();
					say(pick(EDGE_LINES), 2400);
				}
			}

			pet.addEventListener("contextmenu", function (ev) {
				ev.preventDefault();
				showMenu(ev.clientX, ev.clientY);
			});

			pet.addEventListener("mouseenter", function () {
				if (!drag.active && !asleep && !thinking && img.dataset.pose !== "happy") setPetPose(img, "wave");
				if (Date.now() - lastHoverSay > 60000) {
					lastHoverSay = Date.now();
					say(pick(HOVER_LINES), 2200);
				}
			});
			pet.addEventListener("mouseleave", function () {
				if (!drag.active && !asleep && !thinking && img.dataset.pose === "wave") setPetPose(img, "idle");
			});

			// ── 菜单智能关闭：点菜单外任意处（含宠物）、右键外部、Esc、滚动、窗口变化、失焦 ──
			document.addEventListener("pointerdown", function (ev) {
				if (!menu.classList.contains("dsh-pet-show")) return;
				// 点菜单内部保留（菜单项自己的 click 负责收起）；其余一律收起，
				// 包括点在宠物上 —— 先收起菜单再继续宠物交互。
				if (!menu.contains(ev.target)) hideMenu();
			});
			document.addEventListener("contextmenu", function (ev) {
				// 右键来源是宠物时由宠物自己的 contextmenu 负责打开/重定位，不在此关闭
				if (menu.classList.contains("dsh-pet-show") && !menu.contains(ev.target) && !pet.contains(ev.target)) hideMenu();
			});
			document.addEventListener("keydown", function (ev) {
				if (ev.key === "Escape" || ev.key === "Esc") hideMenu();
			});
			document.addEventListener("scroll", function () {
				hideMenu();
			}, true);
			window.addEventListener("resize", hideMenu);
			window.addEventListener("blur", hideMenu);

			// 打字偷看：用户在输入框敲键盘时偶尔冒一句（节流 25s）
			document.addEventListener("keydown", function (ev) {
				var t = ev.target;
				var editable = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
				if (!editable) return;
				if (Date.now() - lastKeySay < 25000) return;
				lastKeySay = Date.now();
				if (!asleep && Math.random() < 0.4) say(pick(KEY_LINES), 2600);
			});

			// 页面失焦/回来：打盹与满血复活
			document.addEventListener("visibilitychange", function () {
				if (document.hidden) {
					goSleep();
				} else {
					wakeUp();
				}
			});

			// 贴边检测（每 2.5s 检查一次位置是否贴边）
			var lastEdgeFlag = false;
			var edgeCheckTimer = setInterval(function () {
				if (pet.style.display === "none") return;
				var rect = pet.getBoundingClientRect();
				var p = clampPosition(pet, rect.left, rect.top);
				if (p.edge && !lastEdgeFlag) {
					lastEdgeFlag = true;
					edgeSquish();
				} else if (!p.edge) {
					lastEdgeFlag = false;
				}
			}, 2500);

			schedulePose();
			scheduleWander();
			scheduleIdleSleep();

			// ── host → 桌宠 推送链路（/plugins/pet-events SSE） ──
			if (typeof EventSource !== "undefined") {
				try {
					var petEvents = new EventSource("/plugins/pet-events");
					petEvents.onmessage = function (ev) {
						try {
							handlePetFrame(JSON.parse(ev.data));
						} catch (_) {}
					};
					petEvents.onerror = function () {
						// 浏览器自动重连；不弹错
					};
				} catch (_) {}
			}
		}

		function apply() {
			try {
				// 延迟挂载，等 body 与布局就绪；任何异常都不允许拖垮整个 web 启动。
				setTimeout(mountPet, 0);
			} catch (error) {
				console.error("[dsh-deepseek-pet] apply failed:", error);
			}
		}

		exports.name = "deepseek-pet";
		exports.apply = apply;
		return module.exports;
	}
});
