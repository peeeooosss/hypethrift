import * as THREE from "three";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + " ";
      y += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines) break;
    } else {
      line = testLine;
    }
  }
  if (lineCount < maxLines) ctx.fillText(line.trim(), x, y);
}

export function makeProductTexture({
  title,
  price,
  emoji,
  color,
  meta,
}: {
  title: string;
  price: string;
  emoji: string;
  color: string;
  meta: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#121212";
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(28, 28, canvas.width - 56, 250);
  ctx.strokeStyle = "#121212";
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, canvas.width - 56, 250);

  ctx.font = "120px Arial";
  ctx.textAlign = "center";
  ctx.fillText(emoji, 256, 200);

  ctx.textAlign = "left";
  ctx.fillStyle = "#121212";
  ctx.font = "900 46px Arial";
  wrapText(ctx, title.toUpperCase(), 36, 350, 440, 50, 3);

  ctx.font = "700 34px monospace";
  ctx.fillText(price, 36, 520);

  ctx.font = "900 20px Arial";
  ctx.fillStyle = "rgba(18,18,18,0.58)";
  ctx.fillText(meta.toUpperCase(), 36, 558);

  ctx.fillStyle = "#121212";
  ctx.fillRect(300, 565, 176, 42);
  ctx.fillStyle = "#D4FF33";
  ctx.font = "900 19px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CLICK TO VIEW", 388, 593);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function makeSignTexture({
  name,
  tagline,
  emoji,
  color,
  index,
}: {
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  index: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#121212";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.fillStyle = "#121212";
  ctx.font = "900 28px Arial";
  ctx.fillText(`ZONE ${String(index + 1).padStart(2, "0")}`, 40, 55);

  ctx.font = "900 76px Arial";
  ctx.fillText(name.toUpperCase(), 40, 142);

  ctx.font = "700 26px Arial";
  ctx.fillStyle = "rgba(18,18,18,0.62)";
  ctx.fillText(tagline.toUpperCase(), 40, 188);

  ctx.font = "100px Arial";
  ctx.textAlign = "right";
  ctx.fillText(emoji, 980, 160);
  ctx.textAlign = "left";

  ctx.fillStyle = "#121212";
  ctx.font = "900 20px monospace";
  ctx.textAlign = "right";
  ctx.fillText("CLICK SIGN →", 980, 228);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function makeArenaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0B0B0F";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#D4FF33";
  ctx.lineWidth = 22;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  ctx.fillStyle = "#FF66B2";
  ctx.font = "900 34px Arial";
  ctx.textAlign = "center";
  ctx.fillText("HYPETHRIFT LIVE", 512, 110);

  ctx.fillStyle = "#D4FF33";
  ctx.font = "900 150px Arial";
  ctx.fillText("BID", 512, 260);
  ctx.fillText("ARENA", 512, 400);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "700 24px Arial";
  ctx.fillText("CLICK TO ENTER", 512, 462);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function makeWallTexture(text: string, accent = "#D4FF33") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1A1A1A";
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = accent;
  ctx.font = "900 112px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, 512, 170);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
