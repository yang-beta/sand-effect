const canvas = document.getElementById('CanvasAnime');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// -------------------------------------------------------------
// ⚙️ 參數設定區
// -------------------------------------------------------------
const ALL_IMAGE_SOURCES = [
    './pic/01.png',
    './pic/01.png'
];

const DUST_COUNT = 45;
const IMAGE_DURATION = 10.5;
const TARGET_MAX_WIDTH = 430;
const TARGET_MAX_HEIGHT_RATIO = 0.72;

// 主色調：#FF6B6B
// 僅使用同一紅粉色相的明暗與透明差，避免偏離品牌主色。
const SAND_PALETTE = [
    { r: 255, g: 107, b: 107 }, // #FF6B6B 主色
    { r: 255, g: 124, b: 124 }, // 淺亮
    { r: 255, g: 145, b: 145 }, // 柔光
    { r: 239, g: 91,  b: 91  }, // 深一階
    { r: 215, g: 73,  b: 73  }  // 深紅粉
];

let floatingDustParticles = [];
let sandImageParticles = [];
let globalProgress = { t: 0 };
let totalAnimationDuration = IMAGE_DURATION;

function randomPaletteColor() {
    return SAND_PALETTE[Math.floor(Math.random() * SAND_PALETTE.length)];
}

function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t) {
    return t * t * t;
}

// -------------------------------------------------------------
// 🔲 類別 1: 背景極淡砂塵
// -------------------------------------------------------------
class FloatingDust {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.7 + 0.35;
        this.vx = (Math.random() - 0.5) * 0.28;
        this.vy = (Math.random() - 0.5) * 0.28;
        this.baseAlpha = Math.random() * 0.14 + 0.035;
        this.alpha = this.baseAlpha;
        this.pulseSpeed = Math.random() * 0.0015 + 0.0005;
        this.color = randomPaletteColor();
        this.glowSize = Math.random() * 5 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        this.alpha = Math.max(
            0,
            this.baseAlpha + Math.sin(Date.now() * this.pulseSpeed) * 0.035
        );
    }

    draw() {
        ctx.save();
        ctx.shadowColor = rgba(this.color, this.alpha * 0.35);
        ctx.shadowBlur = this.glowSize;
        ctx.fillStyle = rgba(this.color, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initFloatingDust() {
    floatingDustParticles = [];
    for (let i = 0; i < DUST_COUNT; i++) {
        floatingDustParticles.push(new FloatingDust());
    }
}

// -------------------------------------------------------------
// 🔲 類別 2: 圖片砂粒
//    隨機左/右進場 → 中央成像 → 不同速度、不同柔度左右崩散
// -------------------------------------------------------------
class SandParticle {
    constructor(targetX, targetY, imageCenterX, imageCenterY) {
        this.targetX = targetX;
        this.targetY = targetY;

        // 距離中心越外圍，越容易提早鬆散，模擬 GIF 的邊緣風化感。
        const dx = targetX - imageCenterX;
        const dy = targetY - imageCenterY;
        this.radialDistance = Math.sqrt(dx * dx + dy * dy);

        // 左右隨機進入／離開。
        this.enterFromLeft = Math.random() < 0.5;
        this.exitToLeft = Math.random() < 0.5;

        const startDistance = canvas.width * (0.10 + Math.random() * 0.30);
        this.startX = this.enterFromLeft
            ? -startDistance
            : canvas.width + startDistance;
        this.startY = targetY + (Math.random() - 0.5) * 180;

        // 散開時不要所有粒子都飛到相同距離。
        const exitDistance = canvas.width * (0.12 + Math.random() * 0.42);
        this.endX = this.exitToLeft
            ? -exitDistance
            : canvas.width + exitDistance;
        this.endY = targetY + (Math.random() - 0.5) * (130 + Math.random() * 250);

        this.x = this.startX;
        this.y = this.startY;

        // 粒子大小混合：多數細砂，少量稍大的亮點。
        const sizeSeed = Math.random();
        this.size = sizeSeed < 0.82
            ? 0.45 + Math.random() * 0.85
            : 1.3 + Math.random() * 1.25;

        this.baseAlpha = 0.28 + Math.random() * 0.68;
        this.alpha = 0;
        this.color = randomPaletteColor();

        // 三種散逸類型：fast / normal / slow。
        const speedSeed = Math.random();
        if (speedSeed < 0.28) {
            this.scatterType = 'fast';
            this.exitStart = 0.57 + Math.random() * 0.07;
            this.exitSpan = 0.14 + Math.random() * 0.08;
        } else if (speedSeed < 0.72) {
            this.scatterType = 'normal';
            this.exitStart = 0.62 + Math.random() * 0.10;
            this.exitSpan = 0.20 + Math.random() * 0.11;
        } else {
            this.scatterType = 'slow';
            this.exitStart = 0.68 + Math.random() * 0.12;
            this.exitSpan = 0.26 + Math.random() * 0.16;
        }

        // 外圈略提早散掉，中心輪廓會多停留一些。
        this.exitStart -= Math.min(0.055, this.radialDistance / 11000);

        // 柔化粒子：約 1/3 帶較明顯暈散。
        this.isSoft = Math.random() < 0.34;
        this.glowSize = this.isSoft
            ? 5 + Math.random() * 12
            : 0.8 + Math.random() * 3.2;

        // 個別的延遲與抖動讓聚合和崩散不要像整齊轉場。
        this.enterDelay = Math.random() * 0.12;
        this.enterDuration = 0.21 + Math.random() * 0.10;
        this.noisePhase = Math.random() * Math.PI * 2;
        this.noiseAmount = this.isSoft
            ? 1.3 + Math.random() * 2.6
            : 0.25 + Math.random() * 1.25;

        // 離場曲線加一小段側向漂移，產生煙砂感。
        this.driftX = (Math.random() - 0.5) * 90;
        this.driftY = (Math.random() - 0.5) * 80;
    }

    update(totalElapsedSec) {
        const progress = totalElapsedSec / IMAGE_DURATION;

        if (progress < 0 || progress > 1.08) {
            this.alpha = 0;
            return;
        }

        // 進場：每顆粒子有些微時間差。
        if (progress < this.enterDelay + this.enterDuration) {
            const p = clamp01((progress - this.enterDelay) / this.enterDuration);
            const e = easeOutCubic(p);

            this.x = this.startX + (this.targetX - this.startX) * e;
            this.y = this.startY + (this.targetY - this.startY) * e;
            this.alpha = this.baseAlpha * Math.min(1, p * 1.75);
            return;
        }

        // 完整成像後，在輪廓位置做非常細微的呼吸與漂移。
        if (progress < this.exitStart) {
            const now = performance.now() * 0.001;
            this.x = this.targetX + Math.sin(now * 1.7 + this.noisePhase) * this.noiseAmount * 0.34;
            this.y = this.targetY + Math.cos(now * 1.35 + this.noisePhase) * this.noiseAmount * 0.34;
            this.alpha = this.baseAlpha;
            return;
        }

        // 離場：每顆粒子的起始時間、持續時間都不同。
        const p = clamp01((progress - this.exitStart) / this.exitSpan);

        // 快速粒子比較猛；慢速粒子拖尾、殘留更久。
        let moveP;
        if (this.scatterType === 'fast') {
            moveP = easeOutCubic(p);
        } else if (this.scatterType === 'slow') {
            moveP = Math.pow(p, 1.45);
        } else {
            moveP = easeInCubic(p) * 0.35 + easeOutCubic(p) * 0.65;
        }

        // 離場不是完全直線，加上中段漂浮弧度。
        const arc = Math.sin(p * Math.PI);
        this.x = this.targetX
            + (this.endX - this.targetX) * moveP
            + this.driftX * arc;
        this.y = this.targetY
            + (this.endY - this.targetY) * moveP
            + this.driftY * arc;

        // 柔化粒子與慢粒子殘影較久；快粒子較快淡出。
        const fadePower = this.scatterType === 'fast'
            ? 1.15
            : this.scatterType === 'slow'
                ? 0.58
                : 0.82;

        this.alpha = this.baseAlpha * Math.pow(1 - p, fadePower);

        // 離場時讓部分粒子變得更柔、更散。
        if (this.isSoft) {
            this.glowSize += 0.035 + p * 0.08;
        }
    }

    draw() {
        if (this.alpha <= 0.006) return;

        ctx.save();

        if (this.isSoft) {
            ctx.shadowColor = rgba(this.color, this.alpha * 0.72);
            ctx.shadowBlur = this.glowSize;
        } else {
            ctx.shadowColor = rgba(this.color, this.alpha * 0.32);
            ctx.shadowBlur = this.glowSize;
        }

        ctx.fillStyle = rgba(this.color, this.alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// -------------------------------------------------------------
// 🖼️ 每次只抽 1 張圖，固定畫面正中央
// -------------------------------------------------------------
function getOneRandomImage(sourceArray) {
    return sourceArray[Math.floor(Math.random() * sourceArray.length)];
}

async function initSingleImage() {
    initFloatingDust();
    sandImageParticles = [];

    const selectedSource = getOneRandomImage(ALL_IMAGE_SOURCES);

    await new Promise((resolve) => {
        const img = new Image();
        img.src = selectedSource;

        img.onload = () => {
            // 同時依畫面寬高限制縮放，手機與桌機都保持中央完整顯示。
            const widthLimit = Math.min(TARGET_MAX_WIDTH, canvas.width * 0.56);
            const heightLimit = canvas.height * TARGET_MAX_HEIGHT_RATIO;
            const scale = Math.min(widthLimit / img.width, heightLimit / img.height);

            const imgW = img.width * scale;
            const imgH = img.height * scale;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const offsetX = centerX - imgW / 2;
            const offsetY = centerY - imgH / 2;

            const offscreen = document.createElement('canvas');
            const offCtx = offscreen.getContext('2d');
            offscreen.width = canvas.width;
            offscreen.height = canvas.height;
            offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
            offCtx.drawImage(img, offsetX, offsetY, imgW, imgH);

            const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // gap 越小，砂粒越密。2 px 可保留 GIF 那種細碎人像輪廓。
            const gap = 2;

            for (let y = 0; y < canvas.height; y += gap) {
                for (let x = 0; x < canvas.width; x += gap) {
                    const index = (y * canvas.width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const alpha = data[index + 3];
                    const brightness = (r + g + b) / 3;

                    // 保留原圖深色輪廓，同時用機率抽樣避免太實、太像純點陣。
                    if (alpha > 90 && brightness < 205 && Math.random() > 0.08) {
                        sandImageParticles.push(
                            new SandParticle(x, y, centerX, centerY)
                        );
                    }
                }
            }

            resolve();
        };

        img.onerror = () => {
            console.warn(`圖片載入失敗：${selectedSource}`);
            resolve();
        };
    });

    startAnimation();
}

let animId;
let animationTween;

function startAnimation() {
    if (animationTween) animationTween.kill();
    if (animId) cancelAnimationFrame(animId);

    globalProgress.t = 0;

    animationTween = gsap.to(globalProgress, {
        t: totalAnimationDuration,
        duration: totalAnimationDuration,
        ease: 'none'
    });

    animate();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    floatingDustParticles.forEach((dust) => {
        dust.update();
        dust.draw();
    });

    sandImageParticles.forEach((particle) => {
        particle.update(globalProgress.t);
        particle.draw();
    });

    animId = requestAnimationFrame(animate);
}

initSingleImage();
