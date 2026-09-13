import test from "node:test";
import assert from "node:assert/strict";
import {
  createSave,
  sanitize,
  makeCourse,
  createPlayer,
  stepPlayer,
  jump,
  stageOf,
} from "./platformer.js";
const step = (p, input, course, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 120)
    stepPlayer(p, input, 1 / 120, course);
};
test("all four coats persist and malformed imports are bounded", () => {
  for (let coat = 0; coat < 4; coat++) {
    const s = { ...createSave(), coat, name: "우리 친구", xp: 251 };
    assert.deepEqual(sanitize(JSON.parse(JSON.stringify(s))), s);
  }
  assert.equal(sanitize({ version: 3, coat: 99, xp: -10 }).coat, 3);
  assert.equal(sanitize({ version: 3, checkpoint: NaN }).checkpoint, 160);
  assert.equal(stageOf(99), 0);
  assert.equal(stageOf(100), 1);
  assert.equal(stageOf(250), 2);
});
test("acceleration, jump, double jump and landing have distinct physical states", () => {
  const c = makeCourse(0),
    p = createPlayer(160);
  step(p, { right: true }, c, 0.3);
  assert.ok(p.x > 200);
  assert.equal(p.grounded, true);
  jump(p);
  step(p, { right: true, jumpHeld: true }, c, 0.2);
  assert.ok(p.y < 530);
  assert.equal(p.jumps, 1);
  jump(p);
  step(p, { jumpHeld: true }, c, 0.1);
  assert.equal(p.jumps, 2);
  const vy = p.vy;
  jump(p);
  step(p, { jumpHeld: true }, c, 0.01);
  assert.ok(p.vy > vy, "third jump must not reset vertical speed");
  step(p, {}, c, 2);
  assert.equal(p.grounded, true);
  assert.equal(p.jumps, 0);
});
test("solid obstacles block walking and all three courses can be completed with running and jumping", () => {
  const wall = createPlayer(685);
  step(wall, { right: true }, makeCourse(0), 1);
  assert.ok(wall.x <= 720);
  for (let level = 0; level < 3; level++) {
    const c = makeCourse(level),
      p = createPlayer();
    for (let frame = 0; frame < 120 * 45 && p.x < 4490; frame++) {
      if (p.grounded) {
        const support = c.platforms.find(
          (s) =>
            p.x >= s.x - 10 && p.x <= s.x + s.w + 10 && Math.abs(p.y - s.y) < 3,
        );
        const edge = support && support.x + support.w - p.x < 125;
        const obstacle = c.platforms.some(
          (s) => s.solid && s.y < p.y && s.x - p.x > 0 && s.x - p.x < 120,
        );
        if (edge || obstacle) jump(p);
      } else if (p.jumps === 1 && p.vy > 0) jump(p);
      stepPlayer(p, { right: true, run: true, jumpHeld: true }, 1 / 120, c);
      assert.ok(p.y < 880, `course ${level} fell at ${p.x}`);
    }
    assert.ok(p.x >= 4490, `course ${level} stuck at ${p.x}`);
  }
});
