export const COATS = ["백구", "황구", "흑구", "우리 강아지"];
export const COURSE_NAMES = ["햇살 들판", "바람 숲길", "반짝 개울"];
export const stageOf = (xp) => (xp >= 250 ? 2 : xp >= 100 ? 1 : 0);
export function createSave() {
  return {
    version: 3,
    coat: 3,
    name: "보리",
    xp: 0,
    treats: 0,
    unlocked: 0,
    course: 0,
    checkpoint: 160,
    finished: [false, false, false],
    day: 1,
    memories: [],
    collected: [],
    fetches: 0,
  };
}
export function sanitize(s) {
  const n = createSave();
  if (!s || typeof s !== "object") return n;
  for (const k of ["xp", "treats", "day", "fetches"])
    if (Number.isFinite(s[k]))
      n[k] = Math.max(k === "day" ? 1 : 0, Math.min(999999, Math.floor(s[k])));
  if (typeof s.name === "string" && s.name.trim())
    n.name = s.name.trim().slice(0, 12);
  if (s.version === 3) {
    n.coat = Number.isInteger(s.coat) && s.coat >= 0 && s.coat < 4 ? s.coat : 3;
    n.unlocked = Math.max(0, Math.min(2, Math.floor(s.unlocked) || 0));
    n.course = Math.max(0, Math.min(n.unlocked, Math.floor(s.course) || 0));
    n.checkpoint = [160, 1630, 3120].includes(s.checkpoint)
      ? s.checkpoint
      : 160;
    n.finished = [0, 1, 2].map((i) => s.finished?.[i] === true);
    n.collected = Array.isArray(s.collected)
      ? s.collected.filter((x) => typeof x === "string").slice(0, 600)
      : [];
  }
  n.memories = Array.isArray(s.memories)
    ? s.memories.filter((m) => typeof m === "string").slice(0, 60)
    : [];
  return n;
}
export function makeCourse(index) {
  const ground = [
    { x: -200, y: 600, w: 1450, h: 400, kind: "ground", solid: true },
    { x: 1510, y: 600, w: 1160, h: 400, kind: "ground", solid: true },
    { x: 2990, y: 600, w: 1810, h: 400, kind: "ground", solid: true },
  ];
  const platforms = [
    { x: 440, y: 495, w: 150, h: 24, kind: "wood" },
    { x: 740, y: 557, w: 90, h: 43, kind: "log", solid: true },
    { x: 960, y: 475, w: 165, h: 24, kind: "wood" },
    { x: 1280, y: 575, w: 75, h: 120, kind: "rock" },
    { x: 1400, y: 548, w: 85, h: 150, kind: "rock" },
    { x: 1790, y: 500, w: 150, h: 24, kind: "wood" },
    { x: 2060, y: 425, w: 155, h: 24, kind: "wood" },
    { x: 2350, y: 490, w: 170, h: 24, kind: "wood" },
    { x: 2710, y: 545, w: 76, h: 150, kind: "rock" },
    { x: 2820, y: 490, w: 76, h: 200, kind: "rock" },
    { x: 2930, y: 545, w: 65, h: 150, kind: "rock" },
    { x: 3370, y: 555, w: 100, h: 45, kind: "log", solid: true },
    { x: 3630, y: 488, w: 165, h: 24, kind: "wood" },
    { x: 3900, y: 435, w: 155, h: 24, kind: "wood" },
  ];
  if (index === 1) {
    platforms.push(
      { x: 1960, y: 525, w: 68, h: 18, kind: "wood" },
      { x: 3510, y: 520, w: 75, h: 18, kind: "wood" },
    );
    platforms[0].y = 510;
    platforms[2].y = 460;
  }
  if (index === 2) {
    platforms[4].y = 530;
    platforms[8].y = 520;
    platforms.push(
      { x: 3170, y: 500, w: 110, h: 22, kind: "rock" },
      { x: 4150, y: 490, w: 125, h: 22, kind: "wood" },
    );
  }
  const treats = [];
  let id = 0;
  for (const p of [...ground, ...platforms]) {
    if (p.kind === "ground") {
      for (
        let x = Math.max(280, p.x + 100);
        x < p.x + p.w - 80 && x < 4460;
        x += 145
      )
        treats.push({ id: `${index}-${id++}`, x, y: p.y - 60 });
    } else
      for (let x = p.x + 25; x < p.x + p.w - 15; x += 55)
        treats.push({ id: `${index}-${id++}`, x, y: p.y - 65 });
  }
  return {
    index,
    length: 4600,
    platforms: [...ground, ...platforms],
    treats,
    checkpoints: [160, 1630, 3120],
    spots: [
      { id: "bowl", x: 320, y: 600, label: "든든하게 밥 먹기" },
      { id: "ball", x: 1660, y: 600, label: "공 던지고 가져오기" },
      { id: "rest", x: 3150, y: 600, label: "나무 그늘에서 쉬기" },
      { id: "friend", x: 4230, y: 600, label: "친구와 인사하기" },
    ],
  };
}
export function createPlayer(x = 160) {
  return {
    x,
    y: 600,
    vx: 0,
    vy: 0,
    grounded: true,
    coyote: 0.12,
    buffer: 0,
    jumps: 0,
    dir: 1,
    phase: 0,
    land: 0,
  };
}
export function jump(p) {
  p.buffer = 0.14;
}
const approach = (a, b, d) => (a < b ? Math.min(b, a + d) : Math.max(b, a - d));
export function stepPlayer(p, input, dt, course) {
  const steps = Math.ceil(dt / (1 / 120));
  for (let i = 0; i < steps; i++) {
    const d = dt / steps;
    p.coyote = Math.max(0, p.coyote - d);
    p.buffer = Math.max(0, p.buffer - d);
    p.land = Math.max(0, p.land - d);
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0),
      max = input.run ? 420 : 290;
    p.vx = approach(p.vx, direction * max, (direction ? 1550 : 2000) * d);
    if (direction) p.dir = direction;
    if (p.buffer > 0 && (p.coyote > 0 || p.jumps < 2)) {
      p.vy = -655;
      p.grounded = false;
      p.coyote = 0;
      p.buffer = 0;
      p.jumps++;
    }
    if (!input.jumpHeld && p.vy < -330) p.vy += 1700 * d;
    p.vy = Math.min(950, p.vy + 1650 * d);
    const oldX = p.x,
      oldY = p.y;
    p.x = Math.max(32, Math.min(course.length - 30, p.x + p.vx * d));
    for (const s of course.platforms) {
      if (!s.solid || oldY <= s.y + 2 || oldY - 48 >= s.y + s.h) continue;
      if (p.x + 20 > s.x && p.x - 20 < s.x + s.w) {
        if (oldX + 20 <= s.x + 1) {
          p.x = s.x - 20;
          p.vx = 0;
        } else if (oldX - 20 >= s.x + s.w - 1) {
          p.x = s.x + s.w + 20;
          p.vx = 0;
        }
      }
    }
    p.y += p.vy * d;
    p.grounded = false;
    for (const s of course.platforms) {
      if (
        p.x + 18 > s.x &&
        p.x - 18 < s.x + s.w &&
        p.vy >= 0 &&
        oldY <= s.y + 3 &&
        p.y >= s.y
      ) {
        p.y = s.y;
        if (p.vy > 220) p.land = 0.12;
        p.vy = 0;
        p.grounded = true;
        p.coyote = 0.12;
        p.jumps = 0;
        break;
      }
    }
    p.phase += (Math.abs(p.vx) * d) / 24;
  }
  return p;
}
