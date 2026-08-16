window.__ModuleLoader__.load({
	id: "dsh-deepseek-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// DeepSeek 小鲸鱼桌宠 v4 —— 纯 vanilla DOM 实现，不依赖任何平台模块。
		// 互动：拖拽/长按撒娇/双击撒花/贴边挤压/悬停问候/打字偷看/随机冒泡/失焦打盹/右键菜单
		// 链路：/plugins/pet-events SSE —— 模型 pet_say 命令说话 + 对话起止同步（思考中/完成）
		// 姿势：精灵姿势 idle/happy/wave/sleepy/curious/shy/surprised/review + CSS 姿势 jump/spin/shake
		var IMAGES = {
			idle: "__B64_IDLE__",
			happy: "__B64_HAPPY__",
			wave: "__B64_WAVE__",
			sleepy: "__B64_SLEEPY__",
			curious: "__B64_CURIOUS__",
			shy: "__B64_SHY__",
			surprised: "__B64_SURPRISED__",
			review: "__B64_REVIEW__"
		};
		/** CSS 动画姿势（不换图，给 pet 根元素加临时类）。 */
		var CSS_POSES = {
			jump: { cls: "dsh-pet-pose-jump", ms: 1300 },
			spin: { cls: "dsh-pet-pose-spin", ms: 900 },
			shake: { cls: "dsh-pet-pose-shake", ms: 1100 }
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
			".dsh-pet-root{position:fixed;right:24px;bottom:24px;z-index:2147483000;width:150px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;filter:drop-shadow(0 6px 14px rgba(30,64,175,.25));transition:transform .3s cubic-bezier(.34,1.56,.64,1);}",
			".dsh-pet-root:hover{transform:scale(1.06);}",
			".dsh-pet-root.dsh-pet-dragging,.dsh-pet-root.dsh-pet-dragging:hover{transform:none;cursor:grabbing;}",
			".dsh-pet-root img.dsh-pet-img{width:100%;height:170px;object-fit:contain;display:block;pointer-events:none;animation:dsh-pet-idle 3.6s ease-in-out infinite;transform-origin:50% 90%;}",
			".dsh-pet-root.dsh-pet-dragging img.dsh-pet-img{animation:dsh-pet-drag-tilt .18s ease-out infinite alternate;}",
			".dsh-pet-root.dsh-pet-walking:after{content:'';position:absolute;left:30%;right:22%;bottom:5px;height:8px;border-radius:50%;background:rgba(30,64,175,.16);filter:blur(4px);pointer-events:none;animation:dsh-pet-walk-shadow 1.05s ease-in-out infinite;}",
			".dsh-pet-root.dsh-pet-walking img.dsh-pet-img{animation:dsh-pet-glide 1.05s cubic-bezier(.45,0,.55,1) infinite;}",
			".dsh-pet-root.dsh-pet-bounce img.dsh-pet-img{animation:dsh-pet-bounce .5s ease;}",
			".dsh-pet-root.dsh-pet-hug img.dsh-pet-img{animation:dsh-pet-hug .6s ease;}",
			".dsh-pet-root.dsh-pet-edge img.dsh-pet-img{animation:dsh-pet-squish .45s ease;}",
			"@keyframes dsh-pet-idle{0%,100%{transform:translateY(0) rotate(-1.2deg);}50%{transform:translateY(-7px) rotate(1.2deg);}}",
			"@keyframes dsh-pet-drag-tilt{0%{transform:rotate(-3deg);}100%{transform:rotate(3deg);}}",
			"@keyframes dsh-pet-glide{0%,100%{transform:translateY(0) rotate(0deg) scaleX(var(--dsh-pet-face,1));}35%{transform:translateY(-2px) rotate(-1deg) scaleX(var(--dsh-pet-face,1));}70%{transform:translateY(1px) rotate(.6deg) scaleX(var(--dsh-pet-face,1));}}",
			"@keyframes dsh-pet-walk-shadow{0%,100%{opacity:.55;transform:scaleX(1)}45%{opacity:.3;transform:scaleX(.86)}}",
			"@keyframes dsh-pet-bounce{0%{transform:scale(1);}30%{transform:scale(.9) rotate(-3deg);}60%{transform:scale(1.06) rotate(2deg);}100%{transform:scale(1);}}",
			"@keyframes dsh-pet-hug{0%,100%{transform:scale(1);}50%{transform:scale(.88) rotate(-5deg);}}",
			"@keyframes dsh-pet-squish{0%{transform:scaleX(1);}40%{transform:scaleX(.82) scaleY(1.12);}100%{transform:scaleX(1);}}",
			".dsh-pet-root.dsh-pet-pose-jump img.dsh-pet-img{animation:dsh-pet-jump .55s ease 2;}",
			".dsh-pet-root.dsh-pet-pose-spin img.dsh-pet-img{animation:dsh-pet-spin .8s ease 1;}",
			".dsh-pet-root.dsh-pet-pose-shake img.dsh-pet-img{animation:dsh-pet-shake .45s ease 2;}",
			"@keyframes dsh-pet-jump{0%,100%{transform:translateY(0);}35%{transform:translateY(-28px) scale(1.04);}65%{transform:translateY(0);}}",
			"@keyframes dsh-pet-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}",
			"@keyframes dsh-pet-shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-7px) rotate(-3deg);}75%{transform:translateX(7px) rotate(3deg);}}",
			".dsh-pet-bubble{position:absolute;bottom:calc(100% + 12px);right:-8px;max-width:250px;min-width:120px;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#1e293b);border-radius:14px;padding:10px 14px;font-size:13px;line-height:1.55;box-shadow:0 10px 28px rgba(15,23,42,.18);border:1px solid var(--dsw-alias-border-l1,rgba(30,64,175,.08));opacity:0;transform:translateY(6px) scale(.96);transition:opacity .22s ease,transform .22s ease;pointer-events:none;white-space:normal;word-break:break-word;text-align:left;}",
			".dsh-pet-bubble.dsh-pet-show{opacity:1;transform:translateY(0) scale(1);}",
			".dsh-pet-bubble:after{content:\"\";position:absolute;top:100%;right:16px;border:9px solid transparent;border-top-color:var(--dsw-alias-bg-overlay,#fff);}",
			".dsh-pet-particle{position:absolute;left:50%;top:30%;width:8px;height:8px;border-radius:50%;pointer-events:none;opacity:0;animation:dsh-pet-burst 1.15s ease-out forwards;}",
			"@keyframes dsh-pet-burst{0%{opacity:1;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3);}}",
			".dsh-pet-menu{position:fixed;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-primary,#1e293b);border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.22);padding:6px;min-width:160px;z-index:2147483001;font-size:13px;display:none;border:1px solid var(--dsw-alias-border-l1,rgba(30,64,175,.08));}",
			".dsh-pet-menu.dsh-pet-show{display:block;}",
			".dsh-pet-menu-item{padding:9px 12px;border-radius:8px;cursor:pointer;white-space:nowrap;}",
			".dsh-pet-menu-item:hover{background:var(--dsw-alias-interactive-bg-hover,#eef2ff);}",
			".dsh-pet-hidden-btn{position:fixed;right:22px;bottom:22px;z-index:2147483000;width:46px;height:46px;border-radius:50%;background:var(--dsw-alias-bg-overlay,#fff);box-shadow:0 8px 20px rgba(15,23,42,.2);display:none;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1,rgba(30,64,175,.1));transition:transform .2s ease;}",
			".dsh-pet-hidden-btn.dsh-pet-show{display:flex;}",
			".dsh-pet-hidden-btn:hover{transform:scale(1.08);}",
			".dsh-pet-root.dsh-pet-reduced img.dsh-pet-img{animation:none;}",
			".dsh-pet-root.dsh-pet-reduced,.dsh-pet-root.dsh-pet-reduced:hover{transform:none;transition:none;}",
			"@media (prefers-reduced-motion: reduce){.dsh-pet-root img.dsh-pet-img{animation:none;}.dsh-pet-root,.dsh-pet-root:hover{transform:none;transition:none;}.dsh-pet-hidden-btn{transition:none;}}"
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

		/** 切换到任意姿势：精灵姿势换图；CSS 姿势给根元素加临时动画类。 */
		function makeApplyPose(pet, img) {
			var cssClasses = Object.keys(CSS_POSES).map(function (key) { return CSS_POSES[key].cls; });
			var cssTimer = null;
			function clearCssPoses() {
				for (var i = 0; i < cssClasses.length; i++) pet.classList.remove(cssClasses[i]);
				if (cssTimer !== null) { clearTimeout(cssTimer); cssTimer = null; }
			}
			return function applyPose(pose, stay) {
				clearCssPoses();
				var css = CSS_POSES[pose];
				if (css !== void 0) {
					pet.classList.add(css.cls);
					cssTimer = setTimeout(function () {
						pet.classList.remove(css.cls);
						cssTimer = null;
						if (!stay) setPetPose(img, "idle");
					}, css.ms);
					img.dataset.pose = pose;
					return;
				}
				if (IMAGES[pose] !== void 0) setPetPose(img, pose);
			};
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
			img.dataset.pose = "idle";
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
			var streamTextTimer = null;
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
			var applyPose = makeApplyPose(pet, img);

			// 设置（host 推送 /config）：启用 / 大小 / 活跃度 / 减少动态
			var petConfig = { enabled: true, scale: 1, activityLevel: "normal", reducedMotion: false, physicsEnabled: true, streamText: true, settingsPanelAnimation: true };
			var activityFactor = 1;

			function applyPetConfig(cfg) {
				if (!cfg || typeof cfg !== "object") return;
				petConfig = Object.assign({}, petConfig, cfg);
				cfg = petConfig;
				activityFactor = cfg.activityLevel === "quiet" ? 2.6 : cfg.activityLevel === "lively" ? 0.55 : 1;
				pet.classList.toggle("dsh-pet-reduced", cfg.reducedMotion === true);
				if (document.documentElement && document.documentElement.classList) {
					document.documentElement.classList.toggle("dsh-settings-animation-off", cfg.settingsPanelAnimation === false);
				}
				var scale = Number(cfg.scale);
				if (!Number.isFinite(scale)) scale = 1;
				scale = Math.max(0.7, Math.min(1.4, scale));
				pet.style.width = Math.round(150 * scale) + "px";
				if (cfg.enabled === false) {
					// 设置里禁用：彻底隐藏且不显示唤回按钮
					pet.style.display = "none";
					hiddenBtn.classList.remove("dsh-pet-show");
				} else if (loadFlag(STORE_HIDDEN)) {
					// 用户此前主动"躲起来"过：保持隐藏，显示唤回按钮
					pet.style.display = "none";
					hiddenBtn.classList.add("dsh-pet-show");
				} else {
					pet.style.display = "";
				}
			}

			window.addEventListener("dsh-pet-config-preview", function (event) {
				if (!event || !event.detail) return;
				var detail = event.detail;
				var cfg = detail.config || detail;
				applyPetConfig(cfg);
				if (detail.field !== "activityLevel" || cfg.enabled === false) return;
				if (cfg.activityLevel === "quiet") {
					applyPose("sleepy");
					say("好呀，我安静陪着你～", 2800);
				} else if (cfg.activityLevel === "lively") {
					applyPose("jump");
					burst();
					say("活力全开！一起冲呀！", 2800);
				} else {
					applyPose("wave");
					say("收到，保持刚刚好的节奏！", 2800);
				}
			});

			function say(text, ms) {
				if (streamTextTimer !== null) {
					clearTimeout(streamTextTimer);
					streamTextTimer = null;
				}
				if (bubbleTimer !== null) {
					clearTimeout(bubbleTimer);
					bubbleTimer = null;
				}
				bubble.classList.add("dsh-pet-show");
				var content = String(text || "");
				function scheduleBubbleHide() {
					bubbleTimer = setTimeout(function () {
						bubble.classList.remove("dsh-pet-show");
					}, ms || 3800);
				}
				if (petConfig.streamText !== true || content.length < 2) {
					bubble.textContent = content;
					scheduleBubbleHide();
					return;
				}
				var glyphs = Array.from(content);
				var index = 0;
				bubble.textContent = "";
				function revealNext() {
					index += 1;
					bubble.textContent = glyphs.slice(0, index).join("");
					if (index < glyphs.length) streamTextTimer = setTimeout(revealNext, 34);
					else {
						streamTextTimer = null;
						scheduleBubbleHide();
					}
				}
				revealNext();
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
				applyPose("happy");
				say(line || pick(HAPPY_LINES), 2600);
				burst();
				if (happyTimer !== null) clearTimeout(happyTimer);
				happyTimer = setTimeout(function () {
					applyPose("idle");
					schedulePose();
				}, 2600);
			}

			function goSleep() {
				if (asleep) return;
				asleep = true;
				applyPose("sleepy");
				say("Zzz… 偷偷眯一会儿~", 0);
				if (poseTimer !== null) clearTimeout(poseTimer);
				if (wanderTimer !== null) clearTimeout(wanderTimer);
			}

			function wakeUp() {
				if (!asleep) return;
				asleep = false;
				applyPose("idle");
				say(pick(WAKE_LINES), 2600);
				schedulePose();
				scheduleWander();
				scheduleIdleSleep();
			}

			/** 进入忙碌状态（thinking/working/waiting）：停随机动作，锁姿势与常驻气泡。 */
			function enterBusy() {
				if (thinking) return;
				thinking = true;
				if (poseTimer !== null) clearTimeout(poseTimer);
				if (wanderTimer !== null) clearTimeout(wanderTimer);
			}

			/** 退出忙碌状态，恢复日常随机动作。 */
			function exitBusy() {
				if (!thinking) return;
				thinking = false;
				schedulePose();
				scheduleWander();
				scheduleIdleSleep();
			}

			/** 渲染 host 状态机推来的 status 帧（思考/工作/等待/错误/完成）。 */
			function renderStatus(frame) {
				var state = frame.state;
				var detail = frame.detail && frame.detail !== frame.message ? frame.detail : "";
				var text = (frame.message || "") + (detail ? "\n" + detail : "");
				if (state === "thinking" || state === "working" || state === "waiting") {
					enterBusy();
					applyPose(state === "working" ? "curious" : "review");
					say(text || "鲸鲸在处理呢～", 0);
					return;
				}
				if (state === "idle") {
					exitBusy();
					applyPose("idle");
					if (text) say(text, 2600);
					return;
				}
				if (state === "error") {
					exitBusy();
					if (frame.pulse) {
						applyPose("shake");
						if (text) say(text, 2600);
					} else {
						applyPose("surprised");
						say(text || "任务好像遇到问题了呢…", 0);
					}
					return;
				}
				if (state === "success") {
					exitBusy();
					applyPose("happy");
					applyPose("jump", true);
					if (Date.now() - lastCelebrate > 8000) {
						lastCelebrate = Date.now();
						say(text || pick(COMPLETION_LINES), 2600);
					} else {
						say("完成！", 1200);
					}
					return;
				}
			}

			/** 处理 host 推送的桌宠帧（pet_say 命令 / status 状态 / config 配置）。 */
			function handlePetFrame(frame) {
				if (!frame || typeof frame !== "object") return;
				if (frame.type === "say" && typeof frame.text === "string" && frame.text.length > 0) {
					if (frame.mood && (IMAGES[frame.mood] || CSS_POSES[frame.mood])) {
						applyPose(frame.mood);
						setTimeout(function () {
							if (!thinking && !asleep) applyPose("idle");
						}, 3000);
					}
					say(frame.text, 4200);
					return;
				}
				if (frame.type === "status") {
					renderStatus(frame);
					return;
				}
				if (frame.type === "config" && frame.config) {
					applyPetConfig(frame.config);
				}
			}

			/** 随机姿势状态机：wave / sleepy / shy / surprised / review / curious + CSS 姿势（减少动态时只用精灵姿势）。 */
			function schedulePose() {
				if (asleep || thinking) return;
				if (poseTimer !== null) clearTimeout(poseTimer);
				poseTimer = setTimeout(function () {
					if (drag.active || asleep || thinking) return;
					var reduced = petConfig.reducedMotion === true;
					var r = Math.random();
					var pose = "idle";
					var stay = 0;
					if (r < 0.18) { pose = "wave"; stay = 2200; }
					else if (r < 0.3) { pose = "sleepy"; stay = 4200; say("鲸鲸有点困…", 2000); }
					else if (r < 0.42) { pose = "shy"; stay = 2400; say("被主人盯着看，鲸鲸害羞啦～", 2200); }
					else if (r < 0.52) { pose = "surprised"; stay = 2000; say("咦？！", 1600); }
					else if (r < 0.6) { pose = "review"; stay = 2600; say("让鲸鲸审阅一下…", 2200); }
					else if (r < 0.68) { pose = "curious"; stay = 2200; say("嗯？什么动静？", 1800); }
					else if (!reduced && r < 0.78) { pose = "jump"; stay = 1500; }
					else if (!reduced && r < 0.86) { pose = "shake"; stay = 1300; }
					else if (!reduced && r < 0.92) { pose = "spin"; stay = 1100; }
					if (pose === "idle") {
						applyPose("idle");
						schedulePose();
					} else {
						applyPose(pose);
						poseTimer = setTimeout(function () {
							applyPose("idle");
							schedulePose();
						}, stay);
					}
				}, (16000 + Math.random() * 14000) * activityFactor);
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
						var poses = ["idle", "wave", "sleepy", "happy", "shy", "surprised", "review", "curious", "jump", "spin", "shake"];
						var next = pick(poses);
						applyPose(next);
						say(next === "happy" ? "今天心情超好，主人摸摸～" : next === "sleepy" ? "困了…鲸鲸小憩一下~" : next === "wave" ? "嗨嗨～主人好！" : next === "shy" ? "被主人看着，好害羞…" : next === "surprised" ? "哇！吓鲸鲸一跳！" : next === "review" ? "让鲸鲸审阅一下～" : next === "jump" ? "耶！蹦蹦跳跳！" : next === "spin" ? "转圈圈～头晕啦！" : next === "shake" ? "抖抖抖…好冷！" : next === "curious" ? "嗯？有什么好玩的？" : "继续陪主人干活！", 2200);
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

			function applyPosition(left, top, persist) {
				pet.style.left = left + "px";
				pet.style.top = top + "px";
				pet.style.right = "auto";
				pet.style.bottom = "auto";
				if (persist !== false) {
					storeNumber(STORE_POS + ".x", left);
					storeNumber(STORE_POS + ".y", top);
				}
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

			// 轻量页面物理：大肥鱼受重力影响，能在视口底部和聊天输入区顶部行走。
			var physics = { x: NaN, y: NaN, vx: 0, vy: 0, grounded: false, moving: false, nextMoveAt: 0, stopAt: 0, lastAt: 0, persistAt: 0, platformsAt: 0, platformCache: [], renderedX: NaN, renderedY: NaN };
			function physicsPlatforms(now) {
				if (physics.platformCache.length && now - physics.platformsAt < 700) return physics.platformCache;
				var platforms = [{ left: 0, right: window.innerWidth, top: window.innerHeight - 8 }];
				var nodes = document.querySelectorAll('textarea,[contenteditable="true"],[role="textbox"]');
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					var best = null;
					for (var depth = 0; node && depth < 5; depth++, node = node.parentElement) {
						if (!node.getBoundingClientRect) continue;
						var rect = node.getBoundingClientRect();
						if (rect.width >= 260 && rect.height >= 36 && rect.height <= 260 && rect.bottom > window.innerHeight * 0.5) best = rect;
					}
					if (best && best.top > 80 && best.top < window.innerHeight - 20) {
						platforms.push({ left: best.left, right: best.right, top: best.top });
					}
				}
				platforms.sort(function (a, b) { return a.top - b.top; });
				physics.platformsAt = now;
				physics.platformCache = platforms;
				return platforms;
			}
			function schedulePhysics(delay) {
				setTimeout(function () {
					if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(physicsFrame);
				}, delay);
			}
			function physicsFrame(now) {
				if (!Number.isFinite(physics.x) || !Number.isFinite(physics.y)) {
					var initial = pet.getBoundingClientRect();
					physics.x = initial.left;
					physics.y = initial.top;
				}
				var dt = physics.lastAt ? Math.min(0.034, (now - physics.lastAt) / 1000) : 0;
				physics.lastAt = now;
				if (petConfig.physicsEnabled !== false && pet.style.display !== "none" && !drag.active) {
					var w = pet.offsetWidth || 150;
					var h = pet.offsetHeight || 170;
					var oldBottom = physics.y + h;
					if (!thinking && !asleep && petConfig.reducedMotion !== true) {
						if (physics.moving && now >= physics.stopAt) {
							physics.moving = false;
							physics.vx = 0;
							pet.classList.remove("dsh-pet-walking");
							var restBase = petConfig.activityLevel === "quiet" ? 33000 : petConfig.activityLevel === "lively" ? 9300 : 18300;
							var restSpread = petConfig.activityLevel === "quiet" ? 30000 : petConfig.activityLevel === "lively" ? 14000 : 21700;
							physics.nextMoveAt = now + restBase + Math.random() * restSpread;
						} else if (!physics.moving && now >= physics.nextMoveAt) {
							var walkChance = petConfig.activityLevel === "quiet" ? 0.16 : petConfig.activityLevel === "lively" ? 0.42 : 0.28;
							if (Math.random() >= walkChance) {
								var retryBase = petConfig.activityLevel === "quiet" ? 12000 : petConfig.activityLevel === "lively" ? 4500 : 7500;
								physics.nextMoveAt = now + retryBase + Math.random() * retryBase;
							} else {
							physics.moving = true;
							var speed = petConfig.activityLevel === "quiet" ? 18 : petConfig.activityLevel === "lively" ? 46 : 30;
							var walkBase = petConfig.activityLevel === "quiet" ? 1200 : petConfig.activityLevel === "lively" ? 1800 : 1500;
							physics.vx = (Math.random() < 0.5 ? -1 : 1) * speed;
							pet.style.setProperty("--dsh-pet-face", physics.vx < 0 ? 1 : -1);
							pet.classList.add("dsh-pet-walking");
							physics.stopAt = now + walkBase + Math.random() * 2200;
							}
						}
					} else {
						physics.moving = false;
						physics.vx = 0;
						pet.classList.remove("dsh-pet-walking");
						physics.nextMoveAt = now + 3000;
					}
					physics.vy += 1250 * dt;
					var nextX = physics.x + physics.vx * dt;
					var nextY = physics.y + physics.vy * dt;
					if (nextX < 8 || nextX + w > window.innerWidth - 8) {
						nextX = Math.max(8, Math.min(window.innerWidth - w - 8, nextX));
						physics.vx = -physics.vx;
						pet.style.setProperty("--dsh-pet-face", physics.vx < 0 ? 1 : -1);
						edgeSquish();
					}
					physics.grounded = false;
					var platforms = physicsPlatforms(now);
					for (var j = 0; j < platforms.length; j++) {
						var platform = platforms[j];
						var center = nextX + w * 0.5;
						var nextBottom = nextY + h;
						var landsFromAbove = oldBottom <= platform.top + 8 && nextBottom >= platform.top;
						if (center >= platform.left && center <= platform.right && physics.vy >= 0 && landsFromAbove) {
							nextY = platform.top - h;
							physics.vy = 0;
							physics.grounded = true;
							break;
						}
					}
					physics.x = nextX;
					physics.y = Math.max(8, nextY);
					if (!Number.isFinite(physics.renderedX) || !Number.isFinite(physics.renderedY) || Math.abs(physics.x - physics.renderedX) > 0.1 || Math.abs(physics.y - physics.renderedY) > 0.1) {
						applyPosition(physics.x, physics.y, false);
						physics.renderedX = physics.x;
						physics.renderedY = physics.y;
					}
					if (now - physics.persistAt > 1200) {
						physics.persistAt = now;
						storeNumber(STORE_POS + ".x", physics.x);
						storeNumber(STORE_POS + ".y", physics.y);
					}
				} else {
					var paused = pet.getBoundingClientRect();
					physics.x = paused.left;
					physics.y = paused.top;
					physics.renderedX = paused.left;
					physics.renderedY = paused.top;
					physics.vy = 0;
				}
				var activePhysics = petConfig.physicsEnabled !== false && pet.style.display !== "none" && !drag.active && (physics.moving || !physics.grounded);
				schedulePhysics(activePhysics ? 0 : 220);
			}
			if (typeof window.requestAnimationFrame === "function") schedulePhysics(0);

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
				physics.moving = false;
				physics.vx = 0;
				pet.classList.remove("dsh-pet-walking");
				physics.nextMoveAt = (physics.lastAt || 0) + 4500;
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
				var releasedRect = pet.getBoundingClientRect();
				physics.x = releasedRect.left;
				physics.y = releasedRect.top;
				physics.renderedX = releasedRect.left;
				physics.renderedY = releasedRect.top;
				physics.vy = 0;
				physics.grounded = false;
				physics.lastAt = 0;
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
				var cancelledRect = pet.getBoundingClientRect();
				physics.x = cancelledRect.left;
				physics.y = cancelledRect.top;
				physics.renderedX = cancelledRect.left;
				physics.renderedY = cancelledRect.top;
				physics.vy = 0;
				physics.grounded = false;
				physics.lastAt = 0;
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
				// 只在空闲时打招呼：正在做动作（转圈/蹦跳/害羞等）时悬停不打断
				if (!drag.active && !asleep && !thinking && img.dataset.pose === "idle") applyPose("wave");
				if (Date.now() - lastHoverSay > 60000) {
					lastHoverSay = Date.now();
					say(pick(HOVER_LINES), 2200);
				}
			});
			pet.addEventListener("mouseleave", function () {
				if (!drag.active && !asleep && !thinking && img.dataset.pose === "wave") applyPose("idle");
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
				// 模型运行中页面会自动滚动（对话流式输出），此时滚动不应关闭菜单
				if (thinking) return;
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

			// ── host → 桌宠 推送链路（/plugins/pet-events SSE）+ 初始配置拉取 ──
			if (typeof fetch === "function") {
				try {
					fetch("/plugins/dsh-deepseek-pet/config").then(function (resp) {
						if (resp.ok) return resp.json();
						return null;
					}).then(function (cfg) {
						if (cfg) applyPetConfig(cfg);
					}).catch(function () {});
				} catch (_) {}
			}
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

		function registerSettingsCard(ctx) {
			var React;
			try { React = require("react"); } catch (_) { return; }
			if (!ctx || !ctx.slots || typeof ctx.slots.inject !== "function") return;
			var h = React.createElement;
			var useEffect = React.useEffect;
			var useRef = React.useRef;
			var useState = React.useState;
			if (!document.querySelector("style[data-dsh-pet-settings]")) {
				var settingsStyle = document.createElement("style");
				settingsStyle.setAttribute("data-dsh-pet-settings", "");
				settingsStyle.textContent = ".dsp-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.dsp-card:hover{border-color:var(--dsw-alias-label-dimmed)}.dsp-card.dsp-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.dsp-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.dsp-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.dsp-head{display:flex;flex-direction:column;flex:1;gap:4px;min-width:0}.dsp-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.dsp-desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.dsp-pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.dsp-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.dsp-open .dsp-chevron{transform:rotate(180deg)}.dsp-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.dsp-field{display:flex;flex-direction:column;gap:6px;padding:12px 0}.dsp-field+.dsp-field{border-top:1px solid var(--dsw-alias-border-l2)}.dsp-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}.dsp-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px}.dsp-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.dsp-range{width:100%;height:24px;margin:0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}.dsp-range:disabled{cursor:default;opacity:.5}.dsp-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.dsp-error{color:var(--dsw-alias-label-error);font-size:12px}.dsp-footer{border-top:1px solid var(--dsw-alias-border-l2);display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px}.dsp-button{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 14px;font-size:13px;background:transparent;color:var(--dsw-alias-label-secondary)}.dsp-button.dsp-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);border-color:transparent}.dsp-button:disabled{opacity:.4;cursor:default}";
				settingsStyle.textContent += ".dsp-input:hover{border-color:var(--dsw-alias-label-dimmed)}.dsp-toggle{position:relative;display:inline-flex;width:36px;height:20px;cursor:pointer}.dsp-toggle input{position:absolute;opacity:0;pointer-events:none}.dsp-toggle-track{width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l2);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);transition:background .16s,box-shadow .16s}.dsp-toggle-track:after{content:'';display:block;width:16px;height:16px;margin:2px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);box-shadow:0 1px 3px rgba(0,0,0,.22);transition:transform .16s}.dsp-toggle input:checked+.dsp-toggle-track{background:var(--dsw-alias-brand-primary);box-shadow:none}.dsp-toggle input:checked+.dsp-toggle-track:after{transform:translateX(16px)}.dsp-toggle input:focus-visible+.dsp-toggle-track{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dsp-toggle input:disabled+.dsp-toggle-track{opacity:.45}.dsp-toggle:has(input:disabled){cursor:default}.dsp-button:not(:disabled):hover{background:var(--dsw-alias-bg-module-platform)}.dsp-button.dsp-save:not(:disabled):hover{filter:brightness(.92)}";
				settingsStyle.textContent += ".dsp-select{position:relative;display:block}.dsp-select .dsp-input{appearance:none;width:100%;padding-right:34px;cursor:pointer}.dsp-select svg{position:absolute;right:11px;top:10px;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);pointer-events:none}.dsp-select:focus-within svg{color:var(--dsw-alias-brand-primary)}";
				settingsStyle.textContent += ".dsp-segment{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:3px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-3)}.dsp-segment-button{appearance:none;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;height:30px;cursor:pointer;transition:background .16s,color .16s,box-shadow .16s}.dsp-segment-button:not(:disabled):hover{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary)}.dsp-segment-button.dsp-active{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-brand-primary);font-weight:500;box-shadow:0 1px 3px rgba(0,0,0,.12)}.dsp-segment-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.dsp-segment-button:disabled{opacity:.45;cursor:default}";
				settingsStyle.textContent += ".dsp-card{animation:dsp-card-enter .22s cubic-bezier(.2,.8,.2,1) both}.dsp-body{transform-origin:top;animation:dsp-body-open .2s cubic-bezier(.2,.8,.2,1) both}@keyframes dsp-card-enter{from{opacity:0;transform:translateY(6px) scale(.995)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes dsp-body-open{from{opacity:0;transform:translateY(-5px) scaleY(.985)}to{opacity:1;transform:translateY(0) scaleY(1)}}@media (prefers-reduced-motion:reduce){.dsp-card,.dsp-body{animation:none}.dsp-chevron,.dsp-card,.dsp-toggle-track,.dsp-toggle-track:after,.dsp-segment-button{transition:none}}";
				settingsStyle.textContent += ".VOzbGW_overlay{animation:dsp-settings-overlay-in .2s ease-out both}.VOzbGW_mask{animation:dsp-settings-mask-in .2s ease-out both}.VOzbGW_panel{transform-origin:50% 46%;animation:dsp-settings-panel-in .26s cubic-bezier(.16,1,.3,1) both}@keyframes dsp-settings-overlay-in{from{visibility:hidden}to{visibility:visible}}@keyframes dsp-settings-mask-in{from{opacity:0}to{opacity:1}}@keyframes dsp-settings-panel-in{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}@media (prefers-reduced-motion:reduce){.VOzbGW_overlay,.VOzbGW_mask,.VOzbGW_panel{animation:none}}";
				settingsStyle.textContent += ".dsh-settings-animation-off .VOzbGW_overlay,.dsh-settings-animation-off .VOzbGW_mask,.dsh-settings-animation-off .VOzbGW_panel{animation:none}";
				document.head.appendChild(settingsStyle);
			}
			function Field(props) {
				return h("div", { className: "dsp-field" }, h("label", { className: "dsp-label", htmlFor: props.id }, props.label), props.children, h("p", { className: "dsp-hint" }, props.hint));
			}
			function Toggle(props) {
				return h("label", { className: "dsp-toggle", htmlFor: props.id },
					h("input", { id: props.id, type: "checkbox", checked: props.checked, disabled: props.disabled, onChange: props.onChange }),
					h("span", { className: "dsp-toggle-track", "aria-hidden": "true" }));
			}
			function PetSettingsCard() {
				var openState = useState(false);
				var open = openState[0], setOpen = openState[1];
				var state = useState("loading");
				var status = state[0], setStatus = state[1];
				var savedState = useState({}), saved = savedState[0], setSaved = savedState[1];
				var draftState = useState({}), draft = draftState[0], setDraft = draftState[1];
				var savedRef = useRef(saved);
				var dirtyRef = useRef(false);
				savedRef.current = saved;
				useEffect(function () {
					var active = true;
					fetch("/plugins/dsh-deepseek-pet/config", { cache: "no-store" })
						.then(function (response) { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
						.then(function (next) { if (active) { savedRef.current = next; dirtyRef.current = false; setSaved(next); setDraft(next); setStatus("ready"); } })
						.catch(function () { if (active) setStatus("unavailable"); });
					return function () { active = false; };
				}, []);
				useEffect(function () {
					return function () {
						if (dirtyRef.current) preview(savedRef.current);
					};
				}, []);
				function preview(next, field) {
					window.dispatchEvent(new CustomEvent("dsh-pet-config-preview", { detail: { config: next, field: field || "" } }));
				}
				function edit(field, next) {
					setDraft(function (previous) {
						var updated = Object.assign({}, previous, { [field]: next });
						preview(updated, field);
						return updated;
					});
				}
				function save() {
					setStatus("saving");
					fetch("/plugins/dsh-deepseek-pet/config", {
						method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(draft)
					}).then(function (response) { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
						.then(function (updated) { savedRef.current = updated; dirtyRef.current = false; setSaved(updated); setDraft(updated); setStatus("ready"); })
						.catch(function () { setStatus("failed"); });
				}
				var disabled = status !== "ready" && status !== "failed";
				var dirty = JSON.stringify(saved) !== JSON.stringify(draft);
				dirtyRef.current = dirty;
				var chevron = h("svg", { width: 14, height: 14, viewBox: "0 0 14 14", className: "dsp-chevron" }, h("path", { d: "M11.85 5.5 7.85 9.5a1.2 1.2 0 0 1-1.7 0l-4-4 .85-.85 4 4 4-4Z", fill: "currentColor" }));
				function activityChoice(value, label) { return h("button", { key: value, type: "button", className: "dsp-segment-button" + ((draft.activityLevel || "normal") === value ? " dsp-active" : ""), disabled: disabled, "aria-pressed": (draft.activityLevel || "normal") === value, onClick: function () { edit("activityLevel", value); } }, label); }
				return h("li", { className: "dsp-card" + (open ? " dsp-open" : ""), "data-testid": "dsh-deepseek-pet-settings" },
					h("button", { type: "button", className: "dsp-header", "aria-expanded": open, onClick: function () { if (open && dirty) { setDraft(saved); preview(saved); setStatus("ready"); } setOpen(!open); } }, h("span", { className: "dsp-head" }, h("span", { className: "dsp-name" }, "小鲸鱼桌宠"), h("span", { className: "dsp-desc" }, "跟随 DSH 真实任务状态变化的页面桌宠。")), dirty ? h("span", { className: "dsp-pending" }, "未保存") : null, chevron),
					open ? h("div", { className: "dsp-body" },
						status === "unavailable" || status === "failed" ? h("p", { className: "dsp-error", role: "status" }, status === "failed" ? "保存失败，请重试。" : "设置暂时无法连接到 DSH Host。") : null,
						h(Field, { id: "dsp-enabled", label: "启用小鲸鱼", hint: "切换后立即预览，保存后正式生效。" }, h(Toggle, { id: "dsp-enabled", checked: draft.enabled !== false, disabled: disabled, onChange: function (event) { edit("enabled", event.target.checked); } })),
						h(Field, { id: "dsp-scale", label: "角色大小", hint: "当前 " + Math.round((draft.scale || 1) * 100) + "%（范围 70%–140%）" }, h("input", { id: "dsp-scale", className: "dsp-range", type: "range", min: 0.7, max: 1.4, step: 0.05, value: draft.scale || 1, disabled: disabled, onChange: function (event) { edit("scale", Number(event.target.value)); } })),
						h(Field, { id: "dsp-activity", label: "活跃程度", hint: "选择后大肥鱼会立即回应，保存后正式生效。" }, h("div", { id: "dsp-activity", className: "dsp-segment", role: "group", "aria-label": "活跃程度" }, activityChoice("quiet", "安静"), activityChoice("normal", "标准"), activityChoice("lively", "活泼"))),
						h(Field, { id: "dsp-motion", label: "减少动态效果", hint: "切换后立即预览，减少走动、循环和晃动。" }, h(Toggle, { id: "dsp-motion", checked: draft.reducedMotion === true, disabled: disabled, onChange: function (event) { edit("reducedMotion", event.target.checked); } })),
						h(Field, { id: "dsp-physics", label: "自由行走与重力", hint: "让大肥鱼自由行走，并站在聊天输入框等页面平台上。" }, h(Toggle, { id: "dsp-physics", checked: draft.physicsEnabled !== false, disabled: disabled, onChange: function (event) { edit("physicsEnabled", event.target.checked); } })),
						h(Field, { id: "dsp-stream-text", label: "气泡文字流式输出", hint: "开启后，大肥鱼的台词会逐字显示；关闭则一次性出现。" }, h(Toggle, { id: "dsp-stream-text", checked: draft.streamText === true, disabled: disabled, onChange: function (event) { edit("streamText", event.target.checked); } })),
						h(Field, { id: "dsp-settings-animation", label: "设置页打开动画", hint: "只控制 DSH 设置面板的打开过渡，不影响大肥鱼动作。" }, h(Toggle, { id: "dsp-settings-animation", checked: draft.settingsPanelAnimation !== false, disabled: disabled, onChange: function (event) { edit("settingsPanelAnimation", event.target.checked); } })),
						h(Field, { id: "dsp-subagents", label: "响应子 Agent", hint: "允许子 Agent 状态参与桌宠状态选择。" }, h(Toggle, { id: "dsp-subagents", checked: draft.includeSubagents === true, disabled: disabled, onChange: function (event) { edit("includeSubagents", event.target.checked); } })),
						h("div", { className: "dsp-footer" }, h("button", { type: "button", className: "dsp-button", disabled: !dirty || status === "saving", onClick: function () { setDraft(saved); preview(saved); setStatus("ready"); } }, "放弃修改"), h("button", { type: "button", className: "dsp-button dsp-save", disabled: !dirty || status === "saving", onClick: save }, status === "saving" ? "保存中" : "保存"))) : null);
			}
			ctx.slots.inject("settings.plugin.item", function () {
				return ctx.slots.register({ name: "settings.plugin.item", id: "dsh-deepseek-pet", order: 30, inject: function () { return {}; } }, PetSettingsCard);
			});
		}

		function apply(ctx) {
			try {
				// 延迟挂载，等 body 与布局就绪；任何异常都不允许拖垮整个 web 启动。
				setTimeout(mountPet, 0);
				registerSettingsCard(ctx);
			} catch (error) {
				console.error("[dsh-deepseek-pet] apply failed:", error);
			}
		}

		exports.name = "deepseek-pet";
		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	}
});
