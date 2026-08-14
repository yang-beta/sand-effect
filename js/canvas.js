const canvas = document.getElementById('CanvasAnime');
const ctx = canvas.getContext('2d');

// ============================================================
// Canvas 固定影片解析度
// ============================================================

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;


function resizeCanvas() {

    canvas.width =
        CANVAS_WIDTH;

    canvas.height =
        CANVAS_HEIGHT;

}


resizeCanvas();


// ============================================================
// ⚙️ 基本設定
// ============================================================

// 圖片路徑
const IMAGE_SOURCE = './pic/01.png';

// 動畫總時間
const IMAGE_DURATION = 10.5;

// 圖片最大寬度
const TARGET_MAX_WIDTH = 620;

// 圖片最大高度比例
const TARGET_MAX_HEIGHT_RATIO = 0.78;

// 粒子取樣密度
// 2 = 比較細緻
// 3 = 比較省效能
const PARTICLE_GAP = 2;

// 背景漂浮粒子
// 設 0，避免動畫結束後畫面仍有殘留紅點
const DUST_COUNT = 0;


// ============================================================
// 🎨 主色
// ============================================================

const MAIN_COLOR = {
    r: 255,
    g: 107,
    b: 107
};


// ============================================================
// 全域變數
// ============================================================

let floatingDustParticles = [];
let sandImageParticles = [];

let globalProgress = {
    t: 0
};

let animationTween = null;
let animId = null;


// ============================================================
// Utility
// ============================================================

function random(min, max) {
    return min + Math.random() * (max - min);
}


function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}


function clamp01(value) {
    return Math.max(
        0,
        Math.min(1, value)
    );
}


function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}


function easeInCubic(t) {
    return t * t * t;
}


// ============================================================
// 🌬️ 隨機進出方向
//
// 左右：約 74%
// 上下與四個斜角：約 26%
//
// 目的是避免左右進出形成明顯矩形邊界。
// ============================================================

function getRandomDirection() {

    const value = Math.random();


    // 左 37%
    if (value < 0.37) {
        return 'left';
    }


    // 右 37%
    if (value < 0.74) {
        return 'right';
    }


    // 上 5%
    if (value < 0.79) {
        return 'top';
    }


    // 下 5%
    if (value < 0.84) {
        return 'bottom';
    }


    // 左上 4%
    if (value < 0.88) {
        return 'topLeft';
    }


    // 右上 4%
    if (value < 0.92) {
        return 'topRight';
    }


    // 左下 4%
    if (value < 0.96) {
        return 'bottomLeft';
    }


    // 右下 4%
    return 'bottomRight';
}


// ============================================================
// 根據方向產生畫面外的隨機座標
//
// 不讓粒子全部從同一條直線進來，
// 避免明顯邊界。
// ============================================================

function getOuterPosition(
    direction,
    targetX,
    targetY
) {

    const W = canvas.width;
    const H = canvas.height;


    // 每顆粒子的飛行距離不同
    const horizontalDistance =
        W * random(0.10, 0.42);

    const verticalDistance =
        H * random(0.10, 0.42);


    // 左
    if (direction === 'left') {

        return {
            x: -horizontalDistance,

            y:
                targetY
                +
                random(
                    -H * 0.32,
                    H * 0.32
                )
        };
    }


    // 右
    if (direction === 'right') {

        return {
            x:
                W
                +
                horizontalDistance,

            y:
                targetY
                +
                random(
                    -H * 0.32,
                    H * 0.32
                )
        };
    }


    // 上
    if (direction === 'top') {

        return {
            x:
                targetX
                +
                random(
                    -W * 0.32,
                    W * 0.32
                ),

            y:
                -verticalDistance
        };
    }


    // 下
    if (direction === 'bottom') {

        return {
            x:
                targetX
                +
                random(
                    -W * 0.32,
                    W * 0.32
                ),

            y:
                H
                +
                verticalDistance
        };
    }


    // 左上
    if (direction === 'topLeft') {

        return {
            x:
                -horizontalDistance,

            y:
                -verticalDistance
        };
    }


    // 右上
    if (direction === 'topRight') {

        return {
            x:
                W
                +
                horizontalDistance,

            y:
                -verticalDistance
        };
    }


    // 左下
    if (direction === 'bottomLeft') {

        return {
            x:
                -horizontalDistance,

            y:
                H
                +
                verticalDistance
        };
    }


    // 右下
    return {
        x:
            W
            +
            horizontalDistance,

        y:
            H
            +
            verticalDistance
    };
}


// ============================================================
// 🌫️ 背景微粒
//
// 目前 DUST_COUNT = 0
// 所以不會實際產生。
// ============================================================

class FloatingDust {

    constructor() {

        this.x =
            Math.random()
            *
            canvas.width;

        this.y =
            Math.random()
            *
            canvas.height;


        this.size =
            random(
                0.3,
                1.6
            );


        this.vx =
            random(
                -0.15,
                0.15
            );


        this.vy =
            random(
                -0.15,
                0.15
            );


        this.baseAlpha =
            random(
                0.02,
                0.08
            );


        this.alpha =
            this.baseAlpha;


        this.color = {
            ...MAIN_COLOR
        };


        this.pulseSpeed =
            random(
                0.0004,
                0.0014
            );


        this.glowSize =
            random(
                1,
                5
            );
    }


    update() {

        this.x += this.vx;
        this.y += this.vy;


        if (this.x < 0) {
            this.x = canvas.width;
        }


        if (this.x > canvas.width) {
            this.x = 0;
        }


        if (this.y < 0) {
            this.y = canvas.height;
        }


        if (this.y > canvas.height) {
            this.y = 0;
        }


        this.alpha =
            Math.max(
                0,

                this.baseAlpha
                +
                Math.sin(
                    Date.now()
                    *
                    this.pulseSpeed
                )
                *
                0.025
            );
    }


    draw() {

        if (this.alpha <= 0.001) {
            return;
        }


        ctx.save();


        ctx.shadowColor =
            rgba(
                this.color,
                this.alpha * 0.3
            );


        ctx.shadowBlur =
            this.glowSize;


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


// ============================================================
// 初始化背景微粒
// ============================================================

function initFloatingDust() {

    floatingDustParticles = [];


    for (
        let i = 0;
        i < DUST_COUNT;
        i++
    ) {

        floatingDustParticles.push(
            new FloatingDust()
        );
    }
}


// ============================================================
// 🟠 圖像粒子
// ============================================================

class SandParticle {

    constructor(
        targetX,
        targetY,
        imageCenterX,
        imageCenterY,
        imageBrightness
    ) {

        this.targetX =
            targetX;

        this.targetY =
            targetY;


        // ====================================================
        // 距離圖片中心
        // ====================================================

        const dx =
            targetX
            -
            imageCenterX;

        const dy =
            targetY
            -
            imageCenterY;


        this.radialDistance =
            Math.sqrt(
                dx * dx
                +
                dy * dy
            );


        // ====================================================
        // 進出方向各自獨立
        // ====================================================

        this.enterDirection =
            getRandomDirection();

        this.exitDirection =
            getRandomDirection();


        // ====================================================
        // 起點
        // ====================================================

        const start =
            getOuterPosition(
                this.enterDirection,
                targetX,
                targetY
            );


        this.startX =
            start.x;

        this.startY =
            start.y;


        // ====================================================
        // 終點
        // ====================================================

        const end =
            getOuterPosition(
                this.exitDirection,
                targetX,
                targetY
            );


        this.endX =
            end.x;

        this.endY =
            end.y;


        this.x =
            this.startX;

        this.y =
            this.startY;


        // ====================================================
        // 粒子尺寸
        //
        // GAP = 2 後粒子密度較高，
        // 所以尺寸稍微縮小。
        // ====================================================

        const sizeSeed =
            Math.random();


        if (sizeSeed < 0.82) {

            this.size =
                random(
                    0.32,
                    0.82
                );
        }

        else if (sizeSeed < 0.97) {

            this.size =
                random(
                    0.82,
                    1.35
                );
        }

        else {

            this.size =
                random(
                    1.35,
                    2.0
                );
        }


        // ====================================================
        // 原圖黑度
        //
        // 0   = 黑
        // 255 = 白
        // ====================================================

        const darkness =
            1
            -
            imageBrightness / 255;


        this.darkness =
            darkness;


        // ====================================================
        // 🎨 顏色深淺
        //
        // 原圖越黑：
        // 越接近 #FF6B6B
        //
        // 原圖越灰：
        // 顏色稍暗。
        //
        // 每顆粒子再加入少量隨機差異，
        // 避免整張人物同一個色塊。
        // ====================================================

        const brightnessFactor =
            0.54
            +
            darkness * 0.46;


        const randomVariation =
            random(
                0.86,
                1.08
            );


        this.color = {

            r:
                Math.min(
                    255,

                    Math.round(
                        MAIN_COLOR.r
                        *
                        brightnessFactor
                        *
                        randomVariation
                    )
                ),

            g:
                Math.min(
                    255,

                    Math.round(
                        MAIN_COLOR.g
                        *
                        brightnessFactor
                        *
                        randomVariation
                    )
                ),

            b:
                Math.min(
                    255,

                    Math.round(
                        MAIN_COLOR.b
                        *
                        brightnessFactor
                        *
                        randomVariation
                    )
                )
        };


        // ====================================================
        // 透明度也依原圖明暗
        // ====================================================

        this.baseAlpha =
            0.18
            +
            darkness
            *
            0.78;


        this.baseAlpha *=
            random(
                0.78,
                1
            );


        this.alpha = 0;


        // ====================================================
        // 進場時間差
        // ====================================================

        this.enterDelay =
            random(
                0,
                0.10
            );


        this.enterDuration =
            random(
                0.20,
                0.32
            );


        // ====================================================
        // 散開速度
        //
        // 快 25%
        // 中 45%
        // 慢 30%
        // ====================================================

        const speedSeed =
            Math.random();


        if (speedSeed < 0.25) {

            this.scatterType =
                'fast';


            this.exitStart =
                random(
                    0.57,
                    0.64
                );


            this.exitSpan =
                random(
                    0.13,
                    0.21
                );
        }

        else if (speedSeed < 0.70) {

            this.scatterType =
                'normal';


            this.exitStart =
                random(
                    0.61,
                    0.72
                );


            this.exitSpan =
                random(
                    0.20,
                    0.30
                );
        }

        else {

            this.scatterType =
                'slow';


            this.exitStart =
                random(
                    0.66,
                    0.76
                );


            this.exitSpan =
                random(
                    0.20,
                    0.32
                );
        }


        // ====================================================
        // 外圍稍早風化
        // ====================================================

        this.exitStart -=
            Math.min(
                0.05,
                this.radialDistance / 12000
            );


        // ====================================================
        // 確保所有粒子在 progress 1.0 前一定完成
        //
        // 這也是避免左右殘留的重要修正。
        // ====================================================

        const maxExitEnd =
            0.96;


        if (
            this.exitStart
            +
            this.exitSpan
            >
            maxExitEnd
        ) {

            this.exitSpan =
                Math.max(
                    0.08,
                    maxExitEnd
                    -
                    this.exitStart
                );
        }


        // ====================================================
        // 柔化粒子
        //
        // 約 28%
        // ====================================================

        this.isSoft =
            Math.random()
            <
            0.28;


        if (this.isSoft) {

            this.baseGlowSize =
                random(
                    4,
                    10
                );
        }

        else {

            this.baseGlowSize =
                random(
                    0.3,
                    2.2
                );
        }


        this.glowSize =
            this.baseGlowSize;


        // ====================================================
        // 微小漂移
        // ====================================================

        this.noisePhase =
            random(
                0,
                Math.PI * 2
            );


        this.noiseAmount =
            this.isSoft
                ?
                random(
                    0.8,
                    2.4
                )
                :
                random(
                    0.15,
                    0.8
                );


        // ====================================================
        // 散開曲線
        // ====================================================

        this.driftX =
            random(
                -110,
                110
            );


        this.driftY =
            random(
                -110,
                110
            );


        this.waveAmount =
            random(
                5,
                28
            );


        this.waveSpeed =
            random(
                0.8,
                2.2
            );
    }


    // ========================================================
    // Update
    // ========================================================

    update(totalElapsedSec) {

        const progress =
            totalElapsedSec
            /
            IMAGE_DURATION;


        // ====================================================
        // 動畫完成後強制清除
        //
        // 不論 slow 粒子進度如何，
        // progress >= 1 時一定不再繪製。
        // ====================================================

        if (progress >= 1) {

            this.alpha = 0;

            return;
        }


        if (progress < 0) {

            this.alpha = 0;

            return;
        }


        // ====================================================
        // 1. 聚合進場
        // ====================================================

        if (
            progress
            <
            this.enterDelay
            +
            this.enterDuration
        ) {

            const p =
                clamp01(

                    (
                        progress
                        -
                        this.enterDelay
                    )

                    /

                    this.enterDuration

                );


            const moveP =
                easeOutCubic(p);


            const arc =
                Math.sin(
                    p
                    *
                    Math.PI
                );


            const curveX =
                Math.sin(
                    this.noisePhase
                )
                *
                45
                *
                arc;


            const curveY =
                Math.cos(
                    this.noisePhase
                )
                *
                45
                *
                arc;


            this.x =
                this.startX
                +
                (
                    this.targetX
                    -
                    this.startX
                )
                *
                moveP
                +
                curveX;


            this.y =
                this.startY
                +
                (
                    this.targetY
                    -
                    this.startY
                )
                *
                moveP
                +
                curveY;


            this.alpha =
                this.baseAlpha
                *
                Math.min(
                    1,
                    p * 1.8
                );


            return;
        }


        // ====================================================
        // 2. 完整成像
        // ====================================================

        if (
            progress
            <
            this.exitStart
        ) {

            const now =
                performance.now()
                *
                0.001;


            this.x =
                this.targetX
                +
                Math.sin(
                    now * 1.6
                    +
                    this.noisePhase
                )
                *
                this.noiseAmount
                *
                0.22;


            this.y =
                this.targetY
                +
                Math.cos(
                    now * 1.3
                    +
                    this.noisePhase
                )
                *
                this.noiseAmount
                *
                0.22;


            this.alpha =
                this.baseAlpha;


            this.glowSize =
                this.baseGlowSize;


            return;
        }


        // ====================================================
        // 3. 散開
        // ====================================================

        const p =
            clamp01(

                (
                    progress
                    -
                    this.exitStart
                )

                /

                this.exitSpan

            );


        let moveP;


        // 快速粒子
        if (
            this.scatterType
            ===
            'fast'
        ) {

            moveP =
                easeOutCubic(p);
        }


        // 慢速粒子
        else if (
            this.scatterType
            ===
            'slow'
        ) {

            moveP =
                Math.pow(
                    p,
                    1.38
                );
        }


        // 一般粒子
        else {

            moveP =
                easeInCubic(p)
                *
                0.28
                +
                easeOutCubic(p)
                *
                0.72;
        }


        // ====================================================
        // 中段曲線
        // ====================================================

        const arc =
            Math.sin(
                p
                *
                Math.PI
            );


        const wave =
            Math.sin(

                p
                *
                Math.PI
                *
                this.waveSpeed

                +

                this.noisePhase

            )

            *

            this.waveAmount

            *

            arc;


        this.x =

            this.targetX

            +

            (
                this.endX
                -
                this.targetX
            )

            *
            moveP

            +

            this.driftX
            *
            arc

            +

            wave;


        this.y =

            this.targetY

            +

            (
                this.endY
                -
                this.targetY
            )

            *
            moveP

            +

            this.driftY
            *
            arc

            +

            wave * 0.35;


        // ====================================================
        // 淡出速度
        // ====================================================

        let fadePower;


        if (
            this.scatterType
            ===
            'fast'
        ) {

            fadePower =
                1.3;
        }

        else if (
            this.scatterType
            ===
            'slow'
        ) {

            fadePower =
                0.68;
        }

        else {

            fadePower =
                0.92;
        }


        this.alpha =

            this.baseAlpha

            *

            Math.pow(
                1 - p,
                fadePower
            );


        // ====================================================
        // 最後 8% 強制加速淡出
        //
        // 避免畫面邊緣還留小紅點。
        // ====================================================

        if (progress > 0.92) {

            const finalFade =
                clamp01(
                    1
                    -
                    (
                        progress
                        -
                        0.92
                    )
                    /
                    0.08
                );


            this.alpha *=
                finalFade;
        }


        // ====================================================
        // 柔粒子散開時暈開
        // ====================================================

        if (this.isSoft) {

            this.glowSize =
                this.baseGlowSize
                +
                p * 8;
        }


        // ====================================================
        // 粒子已完成散開後直接關閉
        // ====================================================

        if (p >= 1) {

            this.alpha = 0;
        }
    }


    // ========================================================
    // Draw
    // ========================================================

    draw() {

        if (
            this.alpha
            <=
            0.005
        ) {

            return;
        }


        ctx.save();


        // 柔粒子
        if (this.isSoft) {

            ctx.shadowColor =
                rgba(
                    this.color,
                    this.alpha * 0.65
                );


            ctx.shadowBlur =
                this.glowSize;
        }

        // 一般粒子
        else {

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


// ============================================================
// 🖼️ 建立圖片粒子
// ============================================================

async function initImage() {

    initFloatingDust();


    sandImageParticles = [];


    await new Promise((resolve) => {

        const img =
            new Image();


        img.src =
            IMAGE_SOURCE;


        img.onload = () => {


            // =================================================
            // 圖片縮放
            // =================================================

            const widthLimit =
                Math.min(
                    TARGET_MAX_WIDTH,
                    canvas.width * 0.64
                );


            const heightLimit =
                canvas.height
                *
                TARGET_MAX_HEIGHT_RATIO;


            const scale =
                Math.min(
                    widthLimit / img.width,
                    heightLimit / img.height
                );


            const imgW =
                img.width
                *
                scale;


            const imgH =
                img.height
                *
                scale;


            // =================================================
            // 畫面正中央
            // =================================================

            const centerX =
                canvas.width / 2;


            const centerY =
                canvas.height / 2;


            const offsetX =
                centerX
                -
                imgW / 2;


            const offsetY =
                centerY
                -
                imgH / 2;


            // =================================================
            // Offscreen Canvas
            //
            // 只建立圖片顯示尺寸，
            // 避免不必要的大面積像素運算。
            // =================================================

            const offscreen =
                document.createElement(
                    'canvas'
                );


            const offCtx =
                offscreen.getContext(
                    '2d',
                    {
                        willReadFrequently: true
                    }
                );


            offscreen.width =
                Math.ceil(imgW);


            offscreen.height =
                Math.ceil(imgH);


            offCtx.clearRect(
                0,
                0,
                offscreen.width,
                offscreen.height
            );


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


            // =================================================
            // 粒子取樣
            // =================================================

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
                            y * W
                            +
                            x
                        )
                        *
                        4;


                    const r =
                        data[index];


                    const g =
                        data[index + 1];


                    const b =
                        data[index + 2];


                    const alpha =
                        data[index + 3];


                    // =================================================
                    // 人眼感知亮度
                    // =================================================

                    const brightness =

                        r * 0.299

                        +

                        g * 0.587

                        +

                        b * 0.114;


                    // =================================================
                    // 白底黑點半色調圖
                    //
                    // 只取深色區域。
                    // =================================================

                    if (
                        alpha > 80
                        &&
                        brightness < 210
                    ) {

                        // =============================================
                        // 隨機捨棄少量粒子
                        //
                        // 避免半色調圖過度規則，
                        // 增加砂粒自然感。
                        // =============================================

                        if (
                            Math.random()
                            <
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
                `Particle count: ${sandImageParticles.length}`
            );


            resolve();
        };


        img.onerror = () => {

            console.warn(
                `圖片載入失敗：${IMAGE_SOURCE}`
            );


            resolve();
        };
    });


    startAnimation();
}


// ============================================================
// 動畫
// ============================================================

function startAnimation() {

    if (animationTween) {

        animationTween.kill();
    }


    if (animId) {

        cancelAnimationFrame(
            animId
        );
    }


    globalProgress.t = 0;


    animationTween =
        gsap.to(

            globalProgress,

            {

                t:
                    IMAGE_DURATION,

                duration:
                    IMAGE_DURATION,

                ease:
                    'none',

                onComplete: () => {

                    // =================================================
                    // GSAP 結束時再保險清除一次
                    // =================================================

                    sandImageParticles.forEach(
                        particle => {

                            particle.alpha = 0;

                        }
                    );

                }

            }

        );


    animate();
}


// ============================================================
// Render Loop
// ============================================================

function animate() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // ========================================================
    // 背景粒子
    // 目前 DUST_COUNT = 0
    // ========================================================

    floatingDustParticles.forEach(
        particle => {

            particle.update();

            particle.draw();

        }
    );


    // ========================================================
    // 人像粒子
    // ========================================================

    sandImageParticles.forEach(
        particle => {

            particle.update(
                globalProgress.t
            );

            particle.draw();

        }
    );


    animId =
        requestAnimationFrame(
            animate
        );
}


// ============================================================
// Start
// ============================================================

// initImage();
// ============================================================
// 提供 recorder.js 啟動動畫
// ============================================================

window.startSandAnimation =
    async function () {

        await initImage();

    };
