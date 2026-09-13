export async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(Error("이미지를 불러오지 못했어요: " + url));
    i.src = url;
  });
}
// Chroma-keying is part of the game's texture loader; source artwork stays untouched.
function atlas(image, cols, run = false) {
  const c = document.createElement("canvas");
  c.width = image.width;
  c.height = image.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height),
    d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    if (r - g > 42 && b - g > 42) d[i + 3] = 0;
  }
  ctx.putImageData(pixels, 0, 0);
  const frames = [];
  const cuts = run
    ? [0, 268, 540, 808, 1032, 1303, 1536].map((x) =>
        Math.round((x / 1536) * c.width),
      )
    : Array.from({ length: cols + 1 }, (_, i) =>
        Math.round((i * c.width) / cols),
      );
  for (let row = 0; row < 4; row++) {
    frames[row] = [];
    for (let col = 0; col < cols; col++) {
      const x1 = cuts[col],
        x2 = cuts[col + 1],
        y1 = Math.round((row * c.height) / 4),
        y2 = Math.round(((row + 1) * c.height) / 4);
      let minX = x2,
        maxX = x1,
        minY = y2,
        maxY = y1;
      for (let y = y1; y < y2; y++)
        for (let x = x1; x < x2; x++)
          if (d[(y * c.width + x) * 4 + 3] > 128) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
      frames[row][col] = {
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1,
        cellHeight: c.height / 4,
      };
    }
  }
  return { image: c, frames };
}
export async function loadArt() {
  const [run, poses, bg, ground, forest, river] = await Promise.all([
    loadImage("./art/dogs-run.png"),
    loadImage("./art/dogs-poses.png"),
    loadImage("./art/spring-valley.png"),
    loadImage("./art/meadow-ground.png"),
    loadImage("./art/forest-path.png"),
    loadImage("./art/river-light.png"),
  ]);
  return {
    ground,
    backgrounds: [bg, forest, river],
    run: atlas(run, 6, true),
    poses: atlas(poses, 4),
    bg,
  };
}
export function drawDog(
  ctx,
  art,
  coat,
  x,
  y,
  { mode = "idle", phase = 0, size = 130, dir = 1, alpha = 1 } = {},
) {
  const a = mode === "run" ? art.run : art.poses,
    index =
      mode === "run"
        ? Math.floor(phase) % 6
        : mode === "sit"
          ? 1
          : mode === "jump"
            ? 2
            : mode === "land"
              ? 3
              : 0,
    f = a.frames[coat][index];
  const unit = (size / (mode === "run" ? 256 : f.cellHeight)) * 0.96;
  const w = f.w * unit,
    h = f.h * unit;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  if (mode === "run") {
    // Keep the spine stable while legs extend and gather.
    const bob = ([0, -6, -1, 2, 0, -5][index] * size) / 150;
    ctx.translate(0, bob);
  }
  ctx.drawImage(a.image, f.x, f.y, f.w, f.h, -w / 2, -h, w, h);
  ctx.restore();
}
