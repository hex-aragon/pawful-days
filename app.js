import {
  COATS,
  COURSE_NAMES,
  createSave,
  sanitize,
  makeCourse,
  createPlayer,
  jump,
  stepPlayer,
  stageOf,
} from "./platformer.js";
import { loadArt, drawDog } from "./sprites.js";
import { render } from "./scenery.js";
const $ = (s) => document.querySelector(s),
  key = "pawful-platformer-v3",
  canvas = $("#world"),
  ctx = canvas.getContext("2d");
let save = createSave();
try {
  save = sanitize(
    JSON.parse(
      localStorage.getItem(key) ||
        localStorage.getItem("pawful-adventure-v2") ||
        localStorage.getItem("pawful-days-v1"),
    ),
  );
} catch {}
let art,
  course = makeCourse(save.course),
  p = createPlayer(save.checkpoint),
  view = {
    w: innerWidth,
    h: innerHeight,
    dpr: 1,
    scale: 1,
    camera: 0,
    offsetY: 0,
  },
  mode = "menu",
  time = 0,
  last = 0,
  saveTime = 0,
  hudTime = 0,
  toastTimer,
  audio,
  sound = false,
  nearCooldown = 0,
  sitUntil = 0,
  dustTimer = 0;
let keys = new Set(),
  touch = { left: false, right: false, run: false, jumpHeld: false },
  live = {
    collected: new Set(save.collected),
    near: null,
    ball: null,
    particles: [],
    dust: [],
    sitting: false,
  };
let runTreats = 0;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function persist() {
  save.collected = [...live.collected];
  try {
    localStorage.setItem(key, JSON.stringify(save));
    $("#save-note").textContent = "발자국을 저장했어요";
  } catch {
    $("#save-note").textContent =
      "자동 저장이 어려워요 · 메뉴에서 기록 내보내기";
  }
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3100);
}
function notes(freqs = [523, 659, 784]) {
  if (!sound) return;
  audio ??= new AudioContext();
  audio.resume();
  freqs.forEach((f, i) => {
    const o = audio.createOscillator(),
      g = audio.createGain(),
      t = audio.currentTime + i * 0.085;
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.45);
  });
}
function particles(text, x = p.x, y = p.y - 90, n = 5) {
  for (let i = 0; i < n; i++)
    live.particles.push({
      text,
      x: x + (i - n / 2) * 13,
      y,
      life: 1.2 + i * 0.08,
      vx: (i - n / 2) * 8,
    });
}
function remember(text) {
  save.memories.unshift(`${save.day}일 · ${text}`);
  save.memories = save.memories.slice(0, 60);
}
function gain(xp) {
  const before = stageOf(save.xp);
  save.xp += xp;
  if (stageOf(save.xp) > before) {
    toast(
      `${save.name}가 ${stageOf(save.xp) === 1 ? "청소년" : "어른"} 강아지로 자랐어요!`,
    );
    particles("✦", p.x, p.y - 120, 12);
    notes([523, 659, 784, 1046]);
    remember("한 뼘 더 자랐어요. 더 넓은 길을 함께 달려요.");
  }
  updateHUD();
  persist();
}
function resetInput() {
  keys.clear();
  touch = { left: false, right: false, run: false, jumpHeld: false };
  p.vx = 0;
}
function modal(html) {
  resetInput();
  $("#dialog-content").innerHTML = html;
  $("#dialog").showModal();
}
function updateHUD() {
  const stage = stageOf(save.xp);
  $("#dog-name").textContent = save.name;
  $("#growth-name").textContent = [
    "아기 강아지",
    "청소년 강아지",
    "어른 강아지",
  ][stage];
  $("#xp").style.width =
    Math.min(
      100,
      ((save.xp - [0, 100, 250][stage]) / [100, 150, 250][stage]) * 100,
    ) + "%";
  $("#course-number").textContent = [
    "첫 번째 산책길",
    "두 번째 산책길",
    "세 번째 산책길",
  ][save.course];
  $("#course-name").textContent = COURSE_NAMES[save.course];
  $("#treats").textContent = save.treats;
  $("#distance").style.width = Math.min(100, (p.x / course.length) * 100) + "%";
  if (art) {
    const c = $("#portrait").getContext("2d");
    c.clearRect(0, 0, 100, 100);
    drawDog(c, art, save.coat, 50, 94, { mode: "idle", size: 110 });
  }
  document.querySelectorAll("[data-coat]").forEach((b) => {
    b.classList.toggle("selected", +b.dataset.coat === save.coat);
    b.setAttribute("aria-pressed", String(+b.dataset.coat === save.coat));
  });
  $("#start>span").textContent =
    save.checkpoint > 160 ? "이어서 달리기" : "함께 달리기";
}
function showSelection() {
  resetInput();
  clearTimeout(toastTimer);
  $("#toast").classList.remove("show");
  mode = "menu";
  $("#start-screen").classList.remove("hidden");
  for (const id of [
    "hud",
    "controls",
    "keyboard-hint",
    "interact",
    "save-note",
  ])
    $("#" + id).classList.add("hidden");
  updateHUD();
  persist();
}
function begin(index = save.course, fresh = false) {
  if (fresh) {
    save.checkpoint = 160;
    save.collected = save.collected.filter((id) => !id.startsWith(index + "-"));
  }
  save.course = index;
  course = makeCourse(index);
  p = createPlayer(save.checkpoint);
  live = {
    collected: new Set(save.collected),
    near: null,
    ball: null,
    particles: [],
    dust: [],
    sitting: false,
  };
  runTreats = 0;
  mode = "play";
  view.camera = Math.max(0, p.x - (view.w / view.scale) * 0.35);
  $("#start-screen").classList.add("hidden");
  for (const id of ["hud", "controls", "keyboard-hint", "save-note"])
    $("#" + id).classList.remove("hidden");
  if (innerWidth < 850)
    $("#keyboard-hint").textContent =
      "좌우로 달리고, 점프를 두 번 눌러 더 높이!";
  $("#dialog").close();
  canvas.focus();
  updateHUD();
  persist();
  toast("가볍게 달려 볼까? 공중에서 한 번 더 점프할 수 있어요.");
  notes();
}
function finish() {
  mode = "complete";
  resetInput();
  const first = !save.finished[save.course];
  save.finished[save.course] = true;
  save.unlocked = Math.min(2, Math.max(save.unlocked, save.course + 1));
  save.checkpoint = 160;
  save.day++;
  gain(first ? 40 : 15);
  remember(
    `${COURSE_NAMES[save.course]} 완주! 함께 달리고 뛰며 추억을 만들었어요.`,
  );
  persist();
  notes([523, 659, 784, 1046]);
  modal(
    `<div class="result-stars">✦ ✦ ✦</div><h2 style="text-align:center">우리, 함께 해냈어!</h2><p style="text-align:center">${COURSE_NAMES[save.course]}의 끝까지 달려왔어요.<br>${save.name}와 함께한 발자국이 한 뼘 더 자랐어요.</p><div class="result-stats"><div><b>${runTreats}</b><small>이번에 찾은 햇살</small></div><div><b>+${first ? 40 : 15}</b><small>완주 사랑</small></div><div><b>${save.day}</b><small>함께한 날</small></div></div><button class="primary" id="next">${save.course < 2 ? "다음 산책길로" : "다시 신나게 달리기"}</button><button class="secondary" id="choose-friend">친구 선택 화면</button>`,
  );
  $("#next").onclick = () => begin(save.course < 2 ? save.course + 1 : 0, true);
  $("#choose-friend").onclick = () => {
    $("#dialog").close();
    showSelection();
  };
}
function respawn() {
  p = createPlayer(save.checkpoint);
  live.ball = null;
  live.sitting = false;
  view.camera = Math.max(0, p.x - (view.w / view.scale) * 0.35);
  particles("✧");
  toast("괜찮아! 방금 지나온 깃발에서 다시 출발해요.");
  notes([392, 523]);
  persist();
}
function interact() {
  if (mode !== "play" || $("#dialog").open || time < nearCooldown || !live.near)
    return;
  nearCooldown = time + 1.8;
  const s = live.near;
  if (s.id === "bowl") {
    live.sitting = true;
    sitUntil = time + 1.4;
    gain(5);
    remember("밥을 맛있게 먹고 다시 달릴 힘을 얻었어요.");
    toast("냠냠, 든든하게! 사랑 +5");
    particles("♡");
    notes();
  }
  if (s.id === "rest") {
    live.sitting = true;
    sitUntil = time + 2;
    gain(6);
    toast("잠깐 쉬어 가도 좋아. 네 곁은 언제나 포근해.");
    particles("♪");
    notes([392, 523, 659]);
    remember("나무 그늘에 앉아 바람을 느꼈어요.");
  }
  if (s.id === "ball" && !live.ball) {
    live.ball = { x: s.x, y: 555, t: 0, start: s.x, end: s.x + 250 };
    toast("공을 던졌어요! 달려가서 가져와요.");
    notes([660, 880]);
  }
  if (s.id === "friend") {
    live.sitting = true;
    sitUntil = time + 1.8;
    gain(5);
    toast("멍멍! 같이 달리니 더 신나! 사랑 +5");
    particles("♡", s.x, s.y - 100);
    remember("산책길에서 새 친구와 인사했어요.");
    notes();
  }
}
function doJump() {
  if (mode !== "play" || $("#dialog").open) return;
  live.sitting = false;
  jump(p);
  notes([510, 720]);
}
function resize() {
  view.w = innerWidth;
  view.h = innerHeight;
  view.dpr = Math.min(devicePixelRatio || 1, 2);
  view.scale = innerWidth < 580 ? 0.72 : Math.min(1.35, innerHeight / 720);
  view.offsetY =
    innerHeight * (innerWidth < 580 ? 0.74 : 0.79) - 600 * view.scale;
  canvas.width = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
}
function frame(timestamp) {
  const dt = Math.min(0.04, (timestamp - last) / 1000 || 0.016);
  last = timestamp;
  const paused = $("#dialog").open;
  time += dt;
  if (mode === "play" && !paused) {
    const input = {
      left: keys.has("arrowleft") || keys.has("a") || touch.left,
      right: keys.has("arrowright") || keys.has("d") || touch.right,
      run: keys.has("shift") || touch.run,
      jumpHeld:
        keys.has(" ") || keys.has("arrowup") || keys.has("w") || touch.jumpHeld,
    };
    if (live.sitting && time < sitUntil && !input.left && !input.right) {
      p.vx = 0;
    } else {
      live.sitting = false;
      stepPlayer(p, input, dt, course);
    }
    if (p.y > 880) respawn();
    const dest = Math.max(
      0,
      Math.min(
        course.length - view.w / view.scale,
        p.x - (view.w / view.scale) * 0.36,
      ),
    );
    view.camera += (dest - view.camera) * Math.min(1, dt * 7);
    for (const cp of course.checkpoints) {
      if (p.grounded && p.x >= cp && cp > save.checkpoint) {
        save.checkpoint = cp;
        toast("새로운 발자국을 기억했어요. 여기서 다시 시작할 수 있어요.");
        particles("✦");
        persist();
      }
    }
    for (const t of course.treats)
      if (
        !live.collected.has(t.id) &&
        Math.hypot(t.x - p.x, t.y - (p.y - 42)) < 43
      ) {
        live.collected.add(t.id);
        save.treats++;
        runTreats++;
        particles("✧", t.x, t.y, 2);
        gain(2);
        notes([880, 1046]);
      }
    if (live.ball) {
      const b = live.ball;
      b.t += dt;
      if (b.t < 1.2) {
        const k = b.t / 1.2;
        b.x = b.start + (b.end - b.start) * k;
        b.y = 578 - Math.sin(k * Math.PI) * 155;
      } else {
        b.x = b.end;
        b.y = 578;
        if (Math.hypot(p.x - b.x, p.y - 35 - b.y) < 58) {
          live.ball = null;
          save.fetches++;
          gain(12);
          particles("♡");
          toast("공을 가져왔어요! 정말 신나! 사랑 +12");
          remember("공을 쫓아 달려가서 멋지게 가져왔어요.");
          notes();
        }
      }
    }
    dustTimer -= dt;
    if (p.grounded && Math.abs(p.vx) > 80 && dustTimer < 0) {
      dustTimer = 0.07;
      live.dust.push({
        x: p.x - p.dir * 35,
        y: p.y - 4,
        r: 4 + Math.random() * 5,
        life: 0.65,
      });
    }
    live.near =
      course.spots.find(
        (s) =>
          Math.abs(s.x - p.x) < 85 &&
          Math.abs(s.y - p.y) < 40 &&
          !(s.id === "ball" && live.ball),
      ) || null;
    $("#interact").classList.toggle("hidden", !live.near);
    if (live.near) $("#interact span").textContent = live.near.label;
    if (p.x >= 4490 && p.grounded) finish();
  }
  for (const x of live.particles) {
    x.life -= dt;
    x.y -= dt * 26;
    x.x += x.vx * dt;
  }
  live.particles = live.particles.filter((x) => x.life > 0);
  for (const x of live.dust) {
    x.life -= dt;
    x.r += dt * 8;
    x.y -= dt * 8;
  }
  live.dust = live.dust.filter((x) => x.life > 0);
  if (timestamp - hudTime > 80) {
    canvas.dataset.play = JSON.stringify({
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      grounded: p.grounded,
      jumps: p.jumps,
      phase: p.phase,
      camera: view.camera,
      mode,
    });
    $("#distance").style.width =
      Math.min(100, (p.x / course.length) * 100) + "%";
    hudTime = timestamp;
  }
  if (timestamp - saveTime > 5000) {
    persist();
    saveTime = timestamp;
  }
  render(ctx, art, view, p, save, course, live, time, mode === "menu");
  requestAnimationFrame(frame);
}
$("#start").onclick = () => begin();
document.querySelectorAll("[data-coat]").forEach(
  (b) =>
    (b.onclick = () => {
      save.coat = +b.dataset.coat;
      if (["보리", ...COATS].includes(save.name))
        save.name = save.coat === 3 ? "보리" : COATS[save.coat];
      updateHUD();
      persist();
      notes([523, 659]);
    }),
);
$("#name-edit").onclick = () => {
  modal(
    `<h2>네 이름을 불러 줄게</h2><form id="name-form"><label for="name-input">강아지 이름</label><input id="name-input" maxlength="12" required value="${escape(save.name)}"><button class="primary">이 이름으로 함께하기</button></form>`,
  );
  $("#name-form").onsubmit = (e) => {
    e.preventDefault();
    const name = $("#name-input").value.trim();
    if (!name) return;
    save.name = name;
    updateHUD();
    persist();
    $("#dialog").close();
  };
};
function help() {
  modal(
    '<h2>달리고, 폴짝 뛰고!</h2><p>강아지를 직접 움직여 오른쪽 끝의 깃발까지 모험해요. 네 가지 털색 모두 같은 능력으로 달려요.</p><ul><li>← → / A D: 달리기 · Shift: 더 빠르게</li><li>Space / ↑ / W: 점프. 공중에서 한 번 더 점프할 수 있어요.</li><li>E: 밥 먹기, 쉬기, 친구 만나기, 공놀이</li><li>모바일: 왼쪽 방향 버튼과 오른쪽 점프 버튼. 달리기 버튼을 함께 누르면 빨라져요.</li><li>햇살을 모으면 성장해요. 사랑 100에 청소년, 250에 어른이 돼요.</li><li>물에 빠져도 중간 깃발에서 다시 출발해요. 기록은 사라지지 않아요.</li></ul><button class="primary" id="help-close">알겠어, 같이 가자!</button>',
  );
  $("#help-close").onclick = () => $("#dialog").close();
}
$("#start-help").onclick = help;
function courses() {
  modal(
    `<h2>오늘은 어디로 달릴까?</h2>${COURSE_NAMES.map((name, i) => `<button class="course-choice" data-course="${i}" ${i > save.unlocked ? "disabled" : ""}><b>${i + 1}. ${name} ${i > save.unlocked ? "🔒" : save.finished[i] ? "✓" : ""}</b><small>${["풀향기를 따라 달리는 첫 번째 모험", "높은 나무 발판을 뛰어넘는 숲속 모험", "징검다리를 폴짝폴짝 건너는 물빛 모험"][i]}${i > save.unlocked ? " · 앞 산책길을 마치면 열려요." : ""}</small></button>`).join("")}`,
  );
  document
    .querySelectorAll("[data-course]")
    .forEach((b) => (b.onclick = () => begin(+b.dataset.course, true)));
}
$("#courses").onclick = courses;
$("#portrait-button").onclick = showSelection;
$("#interact").onclick = interact;
$("#sound").onclick = () => {
  sound = !sound;
  $("#sound").textContent = sound ? "♪" : "♫";
  $("#sound").setAttribute("aria-pressed", String(sound));
  $("#sound").setAttribute("aria-label", sound ? "효과음 끄기" : "효과음 켜기");
  notes();
  toast(sound ? "모험의 소리를 켰어요" : "소리를 껐어요");
};
function pause() {
  modal(
    '<h2>잠깐, 숨 고르기</h2><button class="primary" id="resume">계속 달리기</button><button class="secondary" id="change-coat">강아지 고르기</button><button class="secondary" id="how">놀이 방법</button><button class="secondary" id="replay">이 산책길 처음부터</button><button class="secondary" id="journal">우리의 발자국 일기</button><button class="secondary" id="export">성장 기록 내려받기</button><label class="secondary" for="import" style="cursor:pointer">성장 기록 불러오기</label><input type="file" id="import" accept="application/json" hidden><button class="secondary" id="reset">새 아기 강아지로 시작하기</button><p style="font-size:10px">같은 브라우저에 자동 저장돼요. 위치는 가장 최근 깃발에서 이어집니다.</p>',
  );
  $("#resume").onclick = () => $("#dialog").close();
  $("#change-coat").onclick = () => {
    $("#dialog").close();
    showSelection();
  };
  $("#how").onclick = help;
  $("#replay").onclick = () => begin(save.course, true);
  $("#journal").onclick = () =>
    modal(
      `<h2>우리의 발자국 일기</h2><p>${save.memories.length ? save.memories.map(escape).join("<br>") : "첫 번째 발자국을 기다리고 있어요. 함께 달려 볼까요?"}</p>`,
    );
  $("#export").onclick = () => {
    persist();
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "pawful-days-growth.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("#import").onchange = async (e) => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (
        ![1, 2, 3].includes(data.version) ||
        typeof data.name !== "string" ||
        !Number.isFinite(data.xp)
      )
        throw Error();
      save = sanitize(data);
      live.collected = new Set(save.collected);
      course = makeCourse(save.course);
      p = createPlayer(save.checkpoint);
      persist();
      $("#dialog").close();
      showSelection();
      toast("소중한 성장 기록을 불러왔어요");
    } catch {
      toast("꼬리의 하루에서 저장한 JSON 기록을 선택해 주세요.");
    }
  };
  $("#reset").onclick = () => {
    modal(
      '<h2>새로운 아기 강아지와 만날까요?</h2><p>현재 성장과 모험 기록이 지워져요. 간직하려면 먼저 기록 파일을 내려받아 주세요.</p><button class="primary" id="confirm-reset">새로운 첫 만남 시작하기</button><button class="secondary" id="cancel-reset">지금 친구와 계속하기</button>',
    );
    $("#cancel-reset").onclick = pause;
    $("#confirm-reset").onclick = () => {
      save = createSave();
      live.collected.clear();
      p = createPlayer();
      course = makeCourse(0);
      $("#dialog").close();
      showSelection();
    };
  };
}
$("#pause").onclick = pause;
$("#close").onclick = () => {
  if (mode === "complete") {
    $("#dialog").close();
    showSelection();
  } else $("#dialog").close();
};
$("#dialog").addEventListener("close", () => {
  resetInput();
  if (mode === "complete") showSelection();
  canvas.focus();
});
window.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"].includes(k))
    e.preventDefault();
  if ($("#dialog").open) return;
  if (!e.repeat && (k === "escape" || k === "p") && mode === "play") {
    pause();
    return;
  }
  if (mode !== "play") return;
  keys.add(k);
  if (!e.repeat && [" ", "arrowup", "w"].includes(k)) doJump();
  if (!e.repeat && k === "e") interact();
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  resetInput();
  persist();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resetInput();
    persist();
  }
});
for (const id of ["left", "right", "run", "jump"]) {
  const b = $("#" + id),
    property = id === "jump" ? "jumpHeld" : id;
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    touch[property] = true;
    if (id === "jump") doJump();
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(event, () => (touch[property] = false));
}
window.addEventListener("resize", resize);
async function init() {
  try {
    art = await loadArt();
    resize();
    document.querySelectorAll("[data-coat]").forEach((b) => {
      const c = b.querySelector("canvas").getContext("2d");
      drawDog(c, art, +b.dataset.coat, 90, 132, { mode: "idle", size: 153 });
    });
    $("#loading").classList.add("hidden");
    showSelection();
    requestAnimationFrame(frame);
  } catch (error) {
    $("#loading").innerHTML =
      '<span>☁</span><p>그림을 불러오지 못했어요.</p><button id="retry">다시 불러오기</button>';
    $("#retry").onclick = () => location.reload();
    console.error(error);
  }
}
init();
