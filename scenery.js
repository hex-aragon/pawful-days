import { drawDog } from "./sprites.js";
const ellipse = (c, x, y, rx, ry, color) => {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
};
function line(c, p, color, width) {
  c.beginPath();
  p.forEach((a, i) => (i ? c.lineTo(...a) : c.moveTo(...a)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = "round";
  c.stroke();
}
function round(c, x, y, w, h, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function random(n) {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export function background(c, art, w, h, camera, time, theme = 0) {
  c.fillStyle = "#a2d8e8";
  c.fillRect(0, 0, w, h);
  const bg = art.backgrounds[theme] || art.bg;
  const scale = Math.max(w / bg.width, h / bg.height) * 1.13,
    bw = bg.width * scale,
    bh = bg.height * scale;
  let off = (((camera * 0.12) % (bw * 2)) + bw * 2) % (bw * 2);
  for (let i = -1; i < 3; i++) {
    const x = i * bw - off;
    c.save();
    c.translate(x + bw * (i % 2 !== 0 ? 1 : 0), h - bh);
    if (i % 2 !== 0) c.scale(-1, 1);
    c.drawImage(bg, 0, 0, bw, bh);
    c.restore();
  }
  if (theme === 1) {
    c.fillStyle = "#4c998121";
    c.fillRect(0, 0, w, h);
  }
  if (theme === 2) {
    c.fillStyle = "#95d7e316";
    c.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < 8; i++) {
    let x =
      ((i * w) / 7 + Math.sin(time * 0.35 + i) * 35 - camera * 0.08) % (w + 50);
    if (x < 0) x += w + 50;
    const y = h * 0.2 + (i % 4) * h * 0.095 + Math.sin(time * 0.7 + i) * 8;
    ellipse(c, x, y, 3, 1.5, "#fffbe5b0");
  }
}
function flower(c, x, y, seed) {
  line(
    c,
    [
      [x, y],
      [x + 2, y - 14],
    ],
    "#75904b",
    2,
  );
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    ellipse(
      c,
      x + 2 + Math.cos(a) * 4,
      y - 16 + Math.sin(a) * 4,
      3,
      3,
      seed % 2 ? "#fff3ca" : "#f8c9c0",
    );
  }
  ellipse(c, x + 2, y - 16, 2.5, 2.5, "#d6ac59");
}
function grass(c, p) {
  const grad = c.createLinearGradient(0, p.y, 0, p.y + 60);
  grad.addColorStop(0, "#b8cc75");
  grad.addColorStop(0.2, "#86a650");
  grad.addColorStop(1, "#668848");
  c.fillStyle = grad;
  c.beginPath();
  c.moveTo(p.x, p.y + 5);
  for (let x = p.x; x < p.x + p.w; x += 9) {
    const n = random(x);
    c.lineTo(x, p.y - 2 - n * 7);
    c.lineTo(x + 5, p.y + 4);
  }
  c.lineTo(p.x + p.w, p.y + 11);
  c.lineTo(p.x + p.w, p.y + 24);
  c.lineTo(p.x, p.y + 25);
  c.fill();
  for (let x = p.x + 10; x < p.x + p.w - 5; x += 19) {
    const n = random(x);
    line(
      c,
      [
        [x, p.y + 2],
        [x - 3, p.y - 5 - n * 6],
        [x + 2, p.y + 1],
        [x + 6, p.y - 3 - n * 6],
      ],
      n > 0.5 ? "#bed581" : "#739544",
      1.3,
    );
  }
}
function platform(c, p, art) {
  if (p.kind === "ground") {
    c.save();
    c.beginPath();
    c.rect(p.x, p.y - 3, p.w, p.h + 3);
    c.clip();
    for (let tx = p.x; tx < p.x + p.w; tx += 1200)
      c.drawImage(art.ground, tx, p.y - 3, 1200, 400);
    c.restore();
  } else if (p.kind === "wood") {
    round(c, p.x, p.y, p.w, p.h, 5, "#86724f");
    round(c, p.x, p.y + 2, p.w, p.h - 6, 4, "#c1a16e");
    for (let x = p.x + 4; x < p.x + p.w; x += 26) {
      line(
        c,
        [
          [x, p.y + 3],
          [x, p.y + p.h - 5],
        ],
        "#9a7d52",
        2,
      );
      ellipse(c, x + 9, p.y + 6, 1, 1, "#786248");
    }
    line(
      c,
      [
        [p.x + 2, p.y],
        [p.x + p.w - 2, p.y],
      ],
      "#e3c895",
      3,
    );
    line(
      c,
      [
        [p.x + 12, p.y + p.h],
        [p.x + 22, p.y + p.h + 11],
        [p.x + 35, p.y + p.h],
      ],
      "#758953",
      2,
    );
  } else if (p.kind === "log") {
    round(c, p.x, p.y, p.w, p.h, 15, "#99764e");
    round(c, p.x + 3, p.y + 4, p.w - 7, p.h - 8, 13, "#b99767");
    for (let j = 0; j < 3; j++)
      line(
        c,
        [
          [p.x + 12, p.y + 9 + j * 10],
          [p.x + p.w - 12, p.y + 6 + j * 11],
        ],
        "#95764c",
        2,
      );
    ellipse(c, p.x + p.w - 8, p.y + p.h / 2, 10, p.h / 2 - 3, "#d5b583");
    ellipse(c, p.x + p.w - 8, p.y + p.h / 2, 5, p.h / 2 - 10, "#b39360");
    grass(c, { ...p, h: 10 });
  } else {
    c.fillStyle = "#879989";
    c.beginPath();
    c.moveTo(p.x - 4, p.y + 20);
    c.lineTo(p.x + 9, p.y);
    c.lineTo(p.x + p.w - 10, p.y - 2);
    c.lineTo(p.x + p.w + 4, p.y + 20);
    c.lineTo(p.x + p.w + 10, p.y + p.h);
    c.lineTo(p.x - 8, p.y + p.h);
    c.fill();
    line(
      c,
      [
        [p.x + 11, p.y + 4],
        [p.x + p.w - 12, p.y + 3],
      ],
      "#c3c9a6",
      6,
    );
    line(
      c,
      [
        [p.x + 14, p.y + 18],
        [p.x + 8, p.y + 58],
        [p.x + 25, p.y + 77],
      ],
      "#aab49a",
      2,
    );
    grass(c, { ...p, h: 10 });
  }
}
function treat(c, x, y, time) {
  const pulse = 1 + Math.sin(time * 3 + x) * 0.06;
  c.save();
  c.translate(x, y);
  c.scale(pulse, pulse);
  ellipse(c, 0, 0, 15, 15, "#fffce52b");
  ellipse(c, 0, 0, 11, 11, "#f8df8c");
  ellipse(c, 0, 0, 8.5, 8.5, "#e9c967");
  c.fillStyle = "#fff1b5";
  c.beginPath();
  c.moveTo(0, -6);
  c.lineTo(2, -2);
  c.lineTo(6, 0);
  c.lineTo(2, 2);
  c.lineTo(0, 6);
  c.lineTo(-2, 2);
  c.lineTo(-6, 0);
  c.lineTo(-2, -2);
  c.fill();
  c.restore();
}
export function render(
  c,
  art,
  view,
  p,
  save,
  course,
  live,
  time,
  menu = false,
) {
  const { w, h, dpr, scale, camera, offsetY } = view;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  background(c, art, w, h, menu ? time * 9 : camera, time, course.index);
  if (menu) {
    const portrait = w < 580;
    const x = portrait ? w * 0.72 : w * 0.73,
      y = portrait ? h * 0.62 : h * 0.78,
      size = portrait ? Math.min(w * 0.58, 235) : Math.min(w * 0.31, h * 0.48);
    ellipse(c, x, y + 4, size * 0.42, size * 0.065, "#3f743b25");
    drawDog(c, art, save.coat, x, y, { mode: "idle", size, phase: time * 3 });
    return;
  }
  c.save();
  c.translate(-camera * scale, offsetY);
  c.scale(scale, scale);
  const minX = camera - 150,
    maxX = camera + w / scale + 150;

  for (const gap of [
    [1250, 1510],
    [2670, 2990],
  ]) {
    const g = c.createLinearGradient(0, 650, 0, 850);
    g.addColorStop(0, "#8bcfc6");
    g.addColorStop(1, "#4e9a9a");
    c.fillStyle = g;
    c.fillRect(gap[0] - 12, 647, gap[1] - gap[0] + 24, 250);
    for (let i = 0; i < 7; i++) {
      const x = gap[0] + i * 44 + Math.sin(time * 2 + i) * 9;
      line(
        c,
        [
          [x, 659 + (i % 3) * 15],
          [x + 23, 659 + (i % 3) * 15],
        ],
        "#d9efcd",
        2,
      );
    }
  }
  for (const platformData of course.platforms)
    if (platformData.x < maxX && platformData.x + platformData.w > minX)
      platform(c, platformData, art);
  for (const t of course.treats)
    if (!live.collected.has(t.id) && t.x > minX && t.x < maxX)
      treat(c, t.x, t.y + Math.sin(time * 2 + t.x) * 3, time);
  for (const cp of course.checkpoints.slice(1)) {
    if (cp < minX || cp > maxX) continue;
    line(
      c,
      [
        [cp, 600],
        [cp, 492],
      ],
      "#9b9368",
      6,
    );
    c.fillStyle = save.checkpoint >= cp ? "#a1be79" : "#dfdba3";
    c.beginPath();
    c.moveTo(cp + 3, 492);
    c.bezierCurveTo(
      cp + 22,
      486 + Math.sin(time * 2) * 3,
      cp + 37,
      500,
      cp + 58,
      491,
    );
    c.lineTo(cp + 55, 523);
    c.bezierCurveTo(cp + 35, 529, cp + 19, 517, cp + 3, 522);
    c.fill();
    c.font = "14px sans-serif";
    c.fillStyle = "#fff7d5";
    c.fillText("✓", cp + 21, 514);
  }
  for (const s of course.spots) {
    if (s.x < minX || s.x > maxX) continue;
    if (s.id === "bowl") {
      ellipse(c, s.x, s.y - 8, 23, 8, "#758f90");
      round(c, s.x - 20, s.y - 12, 40, 14, 6, "#91aaa1");
      ellipse(c, s.x, s.y - 12, 20, 7, "#e7d7a4");
      for (let i = 0; i < 7; i++)
        ellipse(c, s.x - 12 + i * 4, s.y - 13, 2.5, 2, "#9d764d");
    } else if (s.id === "ball" && !live.ball) {
      ellipse(c, s.x, s.y - 11, 12, 12, "#c4d989");
      line(
        c,
        [
          [s.x - 6, s.y - 21],
          [s.x - 3, s.y - 12],
          [s.x - 5, s.y - 2],
        ],
        "#f6f0c3",
        2,
      );
    } else if (s.id === "rest") {
      round(c, s.x - 46, s.y - 10, 92, 10, 5, "#d2bd8d");
      flower(c, s.x - 52, s.y, 1);
    } else if (s.id === "friend") {
      drawDog(c, art, (save.coat + 1) % 4, s.x, s.y, {
        mode: "sit",
        size: 120,
        dir: -1,
      });
    }
  }
  const end = 4510;
  line(
    c,
    [
      [end - 85, 600],
      [end - 85, 429],
    ],
    "#a89b72",
    8,
  );
  line(
    c,
    [
      [end + 85, 600],
      [end + 85, 429],
    ],
    "#a89b72",
    8,
  );
  c.strokeStyle = "#e9d8a1";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(end - 85, 430);
  c.quadraticCurveTo(end, 473, end + 85, 430);
  c.stroke();
  for (let i = 0; i < 7; i++) {
    const x = end - 76 + i * 24,
      y = 434 + Math.sin((i / 6) * Math.PI) * 18;
    c.fillStyle = ["#e6bf99", "#c8d698", "#a9c5b0"][i % 3];
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 20, y + 3);
    c.lineTo(x + 9, y + 24);
    c.fill();
  }
  c.font = '14px "Gowun Dodum",sans-serif';
  c.textAlign = "center";
  c.fillStyle = "#557b4c";
  c.fillText("오늘의 모험, 완주!", end, 413);
  if (live.ball) {
    ellipse(c, live.ball.x, live.ball.y, 12, 12, "#dae28b");
    line(
      c,
      [
        [live.ball.x - 6, live.ball.y - 9],
        [live.ball.x - 2, live.ball.y],
        [live.ball.x - 5, live.ball.y + 10],
      ],
      "#fff2c5",
      2,
    );
  }
  for (const dust of live.dust) {
    ellipse(
      c,
      dust.x,
      dust.y,
      dust.r,
      dust.r * 0.6,
      `rgba(238,226,183,${Math.max(0, dust.life) * 0.45})`,
    );
  }
  const size = [126, 146, 165][save.xp >= 250 ? 2 : save.xp >= 100 ? 1 : 0];
  if (p.grounded) ellipse(c, p.x, p.y + 2, size * 0.33, 6, "#41663624");
  let mode = live.sitting
    ? "sit"
    : p.land > 0
      ? "land"
      : !p.grounded
        ? "jump"
        : Math.abs(p.vx) > 15
          ? "run"
          : "idle";
  drawDog(c, art, save.coat, p.x, p.y, {
    mode,
    phase: p.phase,
    size,
    dir: p.dir,
  });
  for (const a of live.particles) {
    c.globalAlpha = Math.min(1, a.life);
    c.font = "18px sans-serif";
    c.fillStyle = "#fff2b4";
    c.textAlign = "center";
    c.fillText(a.text, a.x, a.y);
    c.globalAlpha = 1;
  }
  if (live.near) {
    const x = live.near.x,
      y = live.near.y - 160;
    c.font = '11px "Gowun Dodum",sans-serif';
    c.textAlign = "center";
    const text =
      live.near.id === "friend"
        ? "새 친구"
        : live.near.id === "bowl"
          ? "우리 집 밥그릇"
          : live.near.id === "ball"
            ? "공놀이 할까?"
            : "포근한 쉼터";
    const tw = c.measureText(text).width + 22;
    round(c, x - tw / 2, y, tw, 26, 10, "#fffdebdb");
    c.fillStyle = "#66805a";
    c.fillText(text, x, y + 18);
  }
  c.restore();
}
