const canvas = document.getElementById('CanvasAnime');
const ctx = canvas.getContext('2d');


// ============================================================
// Canvas
// ============================================================

function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

resizeCanvas();

window.addEventListener('resize', () => {

    resizeCanvas();

});


// ============================================================
// ⚙️ 基本設定
// ============================================================


// 目前只使用這一張圖
const IMAGE_SOURCE = './pic/01.png';


// 動畫總時間
const IMAGE_DURATION = 10.5;


// 圖片最大寬度
const TARGET_MAX_WIDTH = 620;


// 圖片最大高度
const TARGET_MAX_HEIGHT_RATIO = 0.78;


// 取樣密度
//
// 2 = 密
// 3 = 比較省效能
//
// 你的半色調圖片本身已經很多點，
// 我建議先用 2.5 ～ 3。
const PARTICLE_GAP = 2;


// 背景漂浮粒子
const DUST_COUNT = 35;


// ============================================================
// 🎨 顏色
// 主色 #FF6B6B
// ============================================================

const SAND_PALETTE = [

    {
        r: 255,
        g: 107,
        b: 107
    },

    {
        r: 255,
        g: 122,
        b: 122
    },

    {
        r: 255,
        g: 140,
        b: 140
    },

    {
        r: 238,
        g: 91,
        b: 91
    },

    {
        r: 216,
        g: 75,
        b: 75
    }

];


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


function randomPaletteColor() {

    return SAND_PALETTE[
        Math.floor(
            Math.random() * SAND_PALETTE.length
        )
    ];

}


function rgba(color, alpha) {

    return `rgba(
        ${color.r},
        ${color.g},
        ${color.b},
        ${alpha}
    )`;

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
// 🌬️ 隨機方向
//
// 約 75% 左右
// 約 25% 上 / 下 / 四個斜角
//
// 這裡就是你這次最主要的修改。
// ============================================================

function getRandomDirection() {

    const value = Math.random();


    // --------------------------------------------------------
    // 左右合計約 74%
    // --------------------------------------------------------

    if (value < 0.37) {

        return 'left';

    }

    if (value < 0.74) {

        return 'right';

    }


    // --------------------------------------------------------
    // 其餘約 26%
    // --------------------------------------------------------

    if (value < 0.79) {

        return 'top';

    }

    if (value < 0.84) {

        return 'bottom';

    }

    if (value < 0.88) {

        return 'topLeft';

    }

    if (value < 0.92) {

        return 'topRight';

    }

    if (value < 0.96) {

        return 'bottomLeft';

    }

    return 'bottomRight';

}


// ============================================================
// 根據方向產生 Canvas 外圍座標
//
// 重點：
//
// 不使用固定一條直線。
// 每一顆粒子的生成位置都不同。
//
// 因此左邊不會出現整齊垂直邊界。
// ============================================================

function getOuterPosition(
    direction,
    targetX,
    targetY
) {

    const W = canvas.width;
    const H = canvas.height;


    // 每顆粒子飛行距離不同
    const horizontalDistance =
        W * random(0.10, 0.42);

    const verticalDistance =
        H * random(0.10, 0.42);


    // --------------------------------------------------------
    // 左
    // --------------------------------------------------------

    if (direction === 'left') {

        return {

            x:
                -horizontalDistance,

            y:
                targetY
                +
                random(
                    -H * 0.32,
                    H * 0.32
                )

        };

    }


    // --------------------------------------------------------
    // 右
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 上
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 下
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 左上
    // --------------------------------------------------------

    if (direction === 'topLeft') {

        return {

            x:
                -horizontalDistance,

            y:
                -verticalDistance

        };

    }


    // --------------------------------------------------------
    // 右上
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 左下
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // 右下
    // --------------------------------------------------------

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
                0.12
            );


        this.alpha =
            this.baseAlpha;


        this.color =
            randomPaletteColor();


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


        // ----------------------------------------------------
        // 與圖片中心距離
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // 每顆粒子獨立決定：
        //
        // 從哪裡來
        // 往哪裡走
        //
        // 進入與散出方向互相獨立。
        // ----------------------------------------------------

        this.enterDirection =
            getRandomDirection();


        this.exitDirection =
            getRandomDirection();


        // ----------------------------------------------------
        // 起點
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // 終點
        // ----------------------------------------------------

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
        // ====================================================

        const sizeSeed =
            Math.random();


        if (sizeSeed < 0.78) {

            this.size =
                random(
                    0.4,
                    1.05
                );

        }

        else if (sizeSeed < 0.95) {

            this.size =
                random(
                    1.05,
                    1.6
                );

        }

        else {

            this.size =
                random(
                    1.6,
                    2.3
                );

        }


        // ====================================================
        // 圖像亮度控制透明度
        //
        // 黑色越深 → 粒子越明顯
        //
        // 非常適合你現在的半色調圖片。
        // ====================================================

        const darkness =
            1
            -
            imageBrightness / 255;


        this.baseAlpha =
            0.2
            +
            darkness * 0.72;


        this.baseAlpha *=
            random(
                0.72,
                1
            );


        this.alpha = 0;


        this.color =
            randomPaletteColor();


        // ====================================================
        // 進場時間
        //
        // 每顆粒子不完全同步。
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
        // 快：25%
        // 中：45%
        // 慢：30%
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
                    0.32
                );

        }

        else {

            this.scatterType =
                'slow';


            this.exitStart =
                random(
                    0.67,
                    0.79
                );


            this.exitSpan =
                random(
                    0.28,
                    0.43
                );

        }


        // ----------------------------------------------------
        // 圖像外圈稍早開始風化
        // ----------------------------------------------------

        this.exitStart -=
            Math.min(
                0.05,
                this.radialDistance / 12000
            );


        // ====================================================
        // 柔粒子
        //
        // 約 30%
        // ====================================================

        this.isSoft =
            Math.random()
            <
            0.30;


        if (this.isSoft) {

            this.glowSize =
                random(
                    5,
                    13
                );

        }

        else {

            this.glowSize =
                random(
                    0.5,
                    2.8
                );

        }


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
                    1,
                    2.8
                )
                :
                random(
                    0.2,
                    1.1
                );


        // ====================================================
        // 散開時的曲線漂移
        //
        // 避免所有粒子直線移動。
        // ====================================================

        this.driftX =
            random(
                -100,
                100
            );


        this.driftY =
            random(
                -100,
                100
            );


        // ----------------------------------------------------
        // 額外旋流
        // ----------------------------------------------------

        this.waveAmount =
            random(
                5,
                30
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


        if (
            progress < 0
            ||
            progress > 1.1
        ) {

            this.alpha = 0;

            return;

        }


        // ====================================================
        // 1.
        // 聚合進入
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


            // ------------------------------------------------
            // 中途加入小幅度弧線
            // ------------------------------------------------

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
        // 2.
        // 完整成像
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
                0.25;


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
                0.25;


            this.alpha =
                this.baseAlpha;


            return;

        }


        // ====================================================
        // 3.
        // 散開
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


        // ----------------------------------------------------
        // 快
        // ----------------------------------------------------

        if (
            this.scatterType
            ===
            'fast'
        ) {

            moveP =
                easeOutCubic(p);

        }


        // ----------------------------------------------------
        // 慢
        // ----------------------------------------------------

        else if (
            this.scatterType
            ===
            'slow'
        ) {

            moveP =
                Math.pow(
                    p,
                    1.45
                );

        }


        // ----------------------------------------------------
        // 中
        // ----------------------------------------------------

        else {

            moveP =
                easeInCubic(p)
                *
                0.30
                +
                easeOutCubic(p)
                *
                0.70;

        }


        // ----------------------------------------------------
        // 中段漂移曲線
        // ----------------------------------------------------

        const arc =
            Math.sin(
                p
                *
                Math.PI
            );


        // ----------------------------------------------------
        // 額外風沙波動
        // ----------------------------------------------------

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
        // 淡出
        // ====================================================

        let fadePower;


        if (
            this.scatterType
            ===
            'fast'
        ) {

            fadePower =
                1.2;

        }

        else if (
            this.scatterType
            ===
            'slow'
        ) {

            fadePower =
                0.55;

        }

        else {

            fadePower =
                0.82;

        }


        this.alpha =

            this.baseAlpha

            *

            Math.pow(
                1 - p,
                fadePower
            );


        // ----------------------------------------------------
        // 柔粒子散出時增加暈開程度
        // ----------------------------------------------------

        if (this.isSoft) {

            this.glowSize +=
                0.02
                +
                p * 0.055;

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


        // ----------------------------------------------------
        // 柔粒子
        // ----------------------------------------------------

        if (this.isSoft) {

            ctx.shadowColor =
                rgba(
                    this.color,
                    this.alpha * 0.72
                );


            ctx.shadowBlur =
                this.glowSize;

        }


        // ----------------------------------------------------
        // 一般細砂
        // ----------------------------------------------------

        else {

            ctx.shadowColor =
                rgba(
                    this.color,
                    this.alpha * 0.28
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
            // 固定畫面中央
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
            // =================================================

            const offscreen =
                document.createElement(
                    'canvas'
                );


            const offCtx =
                offscreen.getContext(
                    '2d'
                );


            // ⚠️
            // 這裡只建立圖片大小的 Canvas，
            // 不建立整個螢幕大小。
            //
            // 對大螢幕效能會好很多。
            // =================================================

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


                    // -----------------------------------------
                    // 正確亮度計算
                    // 比單純 RGB 平均更接近人眼
                    // -----------------------------------------

                    const brightness =

                        r * 0.299

                        +

                        g * 0.587

                        +

                        b * 0.114;


                    // =========================================
                    // 你的 01.png 是白底黑色半色調。
                    //
                    // 所以：
                    //
                    // 深色點 → 保留
                    // 白色 → 排除
                    //
                    // brightness 越小越黑。
                    // =========================================

                    if (
                        alpha > 80
                        &&
                        brightness < 210
                    ) {

                        // -------------------------------------
                        // 為避免點太整齊，
                        // 隨機捨棄約 5%。
                        // -------------------------------------

                        if (
                            Math.random()
                            <
                            0.05
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
                    'none'

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


    // --------------------------------------------------------
    // 背景砂塵
    // --------------------------------------------------------

    floatingDustParticles.forEach(
        particle => {

            particle.update();

            particle.draw();

        }
    );


    // --------------------------------------------------------
    // 圖像粒子
    // --------------------------------------------------------

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

initImage();
