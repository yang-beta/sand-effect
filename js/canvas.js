const canvas = document.getElementById('CanvasAnime');
const ctx = canvas.getContext('2d', { alpha: false });

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const IMAGE_SOURCE = './pic/01.png';

const IMAGE_DURATION = 10.5;
const PARTICLE_GAP = 2;

const TARGET_MAX_WIDTH = 820;
const TARGET_MAX_HEIGHT_RATIO = 0.88;

const MAIN_COLOR = {
    r: 255,
    g: 107,
    b: 107
};

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let sandImageParticles = [];

function random(min, max) {
    return min + Math.random() * (max - min);
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

function getRandomDirection() {
    const value = Math.random();

    if (value < 0.37) return 'left';
    if (value < 0.74) return 'right';
    if (value < 0.79) return 'top';
    if (value < 0.84) return 'bottom';
    if (value < 0.88) return 'topLeft';
    if (value < 0.92) return 'topRight';
    if (value < 0.96) return 'bottomLeft';

    return 'bottomRight';
}

function getOuterPosition(direction, targetX, targetY) {
    const W = canvas.width;
    const H = canvas.height;

    const horizontalDistance = W * random(0.10, 0.42);
    const verticalDistance = H * random(0.10, 0.42);

    switch (direction) {
        case 'left':
            return {
                x: -horizontalDistance,
                y: targetY + random(-H * 0.32, H * 0.32)
            };

        case 'right':
            return {
                x: W + horizontalDistance,
                y: targetY + random(-H * 0.32, H * 0.32)
            };

        case 'top':
            return {
                x: targetX + random(-W * 0.32, W * 0.32),
                y: -verticalDistance
            };

        case 'bottom':
            return {
                x: targetX + random(-W * 0.32, W * 0.32),
                y: H + verticalDistance
            };

        case 'topLeft':
            return {
                x: -horizontalDistance,
                y: -verticalDistance
            };

        case 'topRight':
            return {
                x: W + horizontalDistance,
                y: -verticalDistance
            };

        case 'bottomLeft':
            return {
                x: -horizontalDistance,
                y: H + verticalDistance
            };

        default:
            return {
                x: W + horizontalDistance,
                y: H + verticalDistance
            };
    }
}

class SandParticle {
    constructor(
        targetX,
        targetY,
        imageCenterX,
        imageCenterY,
        imageBrightness
    ) {
        this.targetX = targetX;
        this.targetY = targetY;

        const dx = targetX - imageCenterX;
        const dy = targetY - imageCenterY;

        this.radialDistance = Math.sqrt(
            dx * dx + dy * dy
        );

        this.enterDirection = getRandomDirection();
        this.exitDirection = getRandomDirection();

        const start = getOuterPosition(
            this.enterDirection,
            targetX,
            targetY
        );

        const end = getOuterPosition(
            this.exitDirection,
            targetX,
            targetY
        );

        this.startX = start.x;
        this.startY = start.y;

        this.endX = end.x;
        this.endY = end.y;

        this.x = this.startX;
        this.y = this.startY;

        const sizeSeed = Math.random();

        if (sizeSeed < 0.75) {
            this.size = random(0.65, 1.30);
        } else if (sizeSeed < 0.94) {
            this.size = random(1.30, 2.10);
        } else {
            this.size = random(2.10, 3.20);
        }

        const darkness =
            1 - imageBrightness / 255;

        this.darkness = darkness;

        const brightnessFactor =
            0.42 + darkness * 0.58;

        const randomVariation =
            random(0.88, 1.08);

        this.color = {
            r: Math.min(
                255,
                Math.round(
                    MAIN_COLOR.r *
                    brightnessFactor *
                    randomVariation
                )
            ),
            g: Math.min(
                255,
                Math.round(
                    MAIN_COLOR.g *
                    brightnessFactor *
                    randomVariation
                )
            ),
            b: Math.min(
                255,
                Math.round(
                    MAIN_COLOR.b *
                    brightnessFactor *
                    randomVariation
                )
            )
        };

        this.baseAlpha =
            0.20 + darkness * 0.78;

        this.baseAlpha *=
            random(0.80, 1);

        this.alpha = 0;

        this.enterDelay =
            random(0, 0.10);

        this.enterDuration =
            random(0.20, 0.32);

        const speedSeed =
            Math.random();

        if (speedSeed < 0.25) {
            this.scatterType = 'fast';
            this.exitStart = random(0.57, 0.64);
            this.exitSpan = random(0.13, 0.21);
        } else if (speedSeed < 0.70) {
            this.scatterType = 'normal';
            this.exitStart = random(0.61, 0.70);
            this.exitSpan = random(0.18, 0.27);
        } else {
            this.scatterType = 'slow';
            this.exitStart = random(0.65, 0.74);
            this.exitSpan = random(0.20, 0.30);
        }

        this.exitStart -= Math.min(
            0.05,
            this.radialDistance / 12000
        );

        const maxExitEnd = 0.96;

        if (
            this.exitStart +
            this.exitSpan >
            maxExitEnd
        ) {
            this.exitSpan = Math.max(
                0.08,
                maxExitEnd - this.exitStart
            );
        }

        this.isSoft =
            Math.random() < 0.28;

        this.baseGlowSize =
            this.isSoft
                ? random(5, 13)
                : random(0.5, 3.0);

        this.glowSize =
            this.baseGlowSize;

        this.noisePhase =
            random(0, Math.PI * 2);

        this.noiseAmount =
            this.isSoft
                ? random(0.8, 2.4)
                : random(0.15, 0.8);

        this.driftX =
            random(-110, 110);

        this.driftY =
            random(-110, 110);

        this.waveAmount =
            random(5, 28);

        this.waveSpeed =
            random(0.8, 2.2);
    }

    update(elapsedSeconds) {
        const progress =
            elapsedSeconds /
            IMAGE_DURATION;

        if (progress >= 1) {
            this.alpha = 0;
            return;
        }

        if (progress < 0) {
            this.alpha = 0;
            return;
        }

        if (
            progress <
            this.enterDelay +
            this.enterDuration
        ) {
            const p = clamp01(
                (
                    progress -
                    this.enterDelay
                ) /
                this.enterDuration
            );

            const moveP =
                easeOutCubic(p);

            const arc =
                Math.sin(p * Math.PI);

            const curveX =
                Math.sin(this.noisePhase) *
                45 *
                arc;

            const curveY =
                Math.cos(this.noisePhase) *
                45 *
                arc;

            this.x =
                this.startX +
                (
                    this.targetX -
                    this.startX
                ) *
                moveP +
                curveX;

            this.y =
                this.startY +
                (
                    this.targetY -
                    this.startY
                ) *
                moveP +
                curveY;

            this.alpha =
                this.baseAlpha *
                Math.min(
                    1,
                    p * 1.8
                );

            return;
        }

        if (
            progress <
            this.exitStart
        ) {
            const now =
                elapsedSeconds;

            this.x =
                this.targetX +
                Math.sin(
                    now * 1.6 +
                    this.noisePhase
                ) *
                this.noiseAmount *
                0.22;

            this.y =
                this.targetY +
                Math.cos(
                    now * 1.3 +
                    this.noisePhase
                ) *
                this.noiseAmount *
                0.22;

            this.alpha =
                this.baseAlpha;

            this.glowSize =
                this.baseGlowSize;

            return;
        }

        const p = clamp01(
            (
                progress -
                this.exitStart
            ) /
            this.exitSpan
        );

        let moveP;

        if (
            this.scatterType ===
            'fast'
        ) {
            moveP =
                easeOutCubic(p);
        } else if (
            this.scatterType ===
            'slow'
        ) {
            moveP =
                Math.pow(p, 1.38);
        } else {
            moveP =
                easeInCubic(p) *
                0.28 +
                easeOutCubic(p) *
                0.72;
        }

        const arc =
            Math.sin(p * Math.PI);

        const wave =
            Math.sin(
                p *
                Math.PI *
                this.waveSpeed +
                this.noisePhase
            ) *
            this.waveAmount *
            arc;

        this.x =
            this.targetX +
            (
                this.endX -
                this.targetX
            ) *
            moveP +
            this.driftX *
            arc +
            wave;

        this.y =
            this.targetY +
            (
                this.endY -
                this.targetY
            ) *
            moveP +
            this.driftY *
            arc +
            wave * 0.35;

        let fadePower;

        if (
            this.scatterType ===
            'fast'
        ) {
            fadePower = 1.3;
        } else if (
            this.scatterType ===
            'slow'
        ) {
            fadePower = 0.68;
        } else {
            fadePower = 0.92;
        }

        this.alpha =
            this.baseAlpha *
            Math.pow(
                1 - p,
                fadePower
            );

        if (
            progress > 0.92
        ) {
            const finalFade =
                clamp01(
                    1 -
                    (
                        progress -
                        0.92
                    ) /
                    0.08
                );

            this.alpha *=
                finalFade;
        }

        if (this.isSoft) {
            this.glowSize =
                this.baseGlowSize +
                p * 8;
        }

        if (p >= 1) {
            this.alpha = 0;
        }
    }

    draw() {
        if (
            this.alpha <=
            0.005
        ) {
            return;
        }

        ctx.save();

        if (this.isSoft) {
            ctx.shadowColor =
                rgba(
                    this.color,
                    this.alpha * 0.65
                );

            ctx.shadowBlur =
                this.glowSize;
        } else {
            ctx.shadowColor =
                rgba(
                    this.color,
                    this.alpha * 0.20
                );

            ctx.shadowBlur =
                this.glowSize;
        }

        ctx.fillStyle =
            rgba(
                this.color,
                this.alpha
            );

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

function clearCanvas() {
    ctx.fillStyle = '#000000';

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

function loadImageParticles() {
    return new Promise(
        (resolve, reject) => {
            const img =
                new Image();

            img.onload = () => {
                sandImageParticles = [];

                const widthLimit =
                    Math.min(
                        TARGET_MAX_WIDTH,
                        canvas.width * 0.64
                    );

                const heightLimit =
                    canvas.height *
                    TARGET_MAX_HEIGHT_RATIO;

                const scale =
                    Math.min(
                        widthLimit /
                        img.width,

                        heightLimit /
                        img.height
                    );

                const imgW =
                    img.width *
                    scale;

                const imgH =
                    img.height *
                    scale;

                const centerX =
                    canvas.width / 2;

                const centerY =
                    canvas.height / 2;

                const offsetX =
                    centerX -
                    imgW / 2;

                const offsetY =
                    centerY -
                    imgH / 2;

                const offscreen =
                    document.createElement(
                        'canvas'
                    );

                const offCtx =
                    offscreen.getContext(
                        '2d',
                        {
                            willReadFrequently:
                                true
                        }
                    );

                offscreen.width =
                    Math.ceil(imgW);

                offscreen.height =
                    Math.ceil(imgH);

                offCtx.drawImage(
                    img,
                    0,
                    0,
                    imgW,
                    imgH
                );

                const imageData =
                    offCtx.getImageData(
                        0,
                        0,
                        offscreen.width,
                        offscreen.height
                    );

                const data =
                    imageData.data;

                const W =
                    offscreen.width;

                const H =
                    offscreen.height;

                for (
                    let y = 0;
                    y < H;
                    y += PARTICLE_GAP
                ) {
                    for (
                        let x = 0;
                        x < W;
                        x += PARTICLE_GAP
                    ) {
                        const index =
                            (
                                y * W +
                                x
                            ) *
                            4;

                        const r =
                            data[index];

                        const g =
                            data[index + 1];

                        const b =
                            data[index + 2];

                        const alpha =
                            data[index + 3];

                        const brightness =
                            r * 0.299 +
                            g * 0.587 +
                            b * 0.114;

                        if (
                            alpha > 80 &&
                            brightness < 210
                        ) {
                            if (
                                Math.random() <
                                0.04
                            ) {
                                continue;
                            }

                            sandImageParticles.push(
                                new SandParticle(
                                    offsetX + x,
                                    offsetY + y,
                                    centerX,
                                    centerY,
                                    brightness
                                )
                            );
                        }
                    }
                }

                console.log(
                    'Particles:',
                    sandImageParticles.length
                );

                resolve();
            };

            img.onerror = () => {
                reject(
                    new Error(
                        '圖片載入失敗'
                    )
                );
            };

            img.src =
                IMAGE_SOURCE;
        }
    );
}

function renderSandFrame(time) {
    clearCanvas();

    for (
        let i = 0;
        i <
        sandImageParticles.length;
        i++
    ) {
        const particle =
            sandImageParticles[i];

        particle.update(time);
        particle.draw();
    }
}

async function prepareSandAnimation() {
    clearCanvas();

    await loadImageParticles();

    return true;
}

// 提供 export.js 使用
window.prepareSandAnimation =
    prepareSandAnimation;

window.renderSandFrame =
    renderSandFrame;

window.SAND_DURATION =
    IMAGE_DURATION;

window.SAND_CANVAS =
    canvas;
