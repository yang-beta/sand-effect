// ============================================================
// export.js
//
// 功能：
// 1. 預覽模式：正常播放沙畫，不輸出影片
// 2. 輸出模式：固定 1920×1080 / 60 FPS / 10.5 秒
//
// 使用方式：
// const EXPORT_VIDEO = false;
// false = 預覽
// true  = 輸出影片
// ============================================================


// ============================================================
// ★ 最常修改的地方
// ============================================================

// 是否輸出影片
// false = 只預覽
// true  = 正式輸出影片
const EXPORT_VIDEO = false;


// 輸出 FPS
const EXPORT_FPS = 60;


// 動畫時間
// 必須和 canvas.js 裡的 IMAGE_DURATION 一致
const EXPORT_DURATION = 10.5;


// CCapture 輸出檔名
const EXPORT_FILENAME = 'sand-animation-1080p60';


// ============================================================
// 不建議隨意修改
// ============================================================

const TOTAL_FRAMES = Math.round(
    EXPORT_FPS * EXPORT_DURATION
);


// ============================================================
// 取得狀態文字
// ============================================================

const statusElement = document.getElementById(
    'exportStatus'
);


// ============================================================
// 顯示狀態
// ============================================================

function setStatus(text) {
    if (statusElement) {
        statusElement.textContent = text;
    }
}


// ============================================================
// 隱藏狀態文字
// ============================================================

function hideStatus() {
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}


// ============================================================
// 預覽模式
//
// EXPORT_VIDEO = false 時執行
//
// 使用瀏覽器正常的 requestAnimationFrame
// 所以適合快速確認：
// - 人物大小
// - 粒子大小
// - 顏色
// - 進場效果
// - 散開效果
// ============================================================

async function startPreview() {

    console.log('[Preview] 開始準備動畫');

    hideStatus();


    // --------------------------------------------------------
    // 檢查 canvas.js 是否正常載入
    // --------------------------------------------------------

    if (
        typeof window.prepareSandAnimation !== 'function' ||
        typeof window.renderSandFrame !== 'function'
    ) {
        console.error(
            '[Preview] 找不到 canvas.js 提供的動畫函式'
        );

        return;
    }


    // --------------------------------------------------------
    // 載入圖片並建立粒子
    // --------------------------------------------------------

    try {
        await window.prepareSandAnimation();
    } catch (error) {
        console.error(
            '[Preview] 初始化失敗：',
            error
        );

        return;
    }


    // --------------------------------------------------------
    // 紀錄預覽開始時間
    // --------------------------------------------------------

    let startTime = null;


    // --------------------------------------------------------
    // 預覽動畫
    // --------------------------------------------------------

    function previewLoop(timestamp) {

        // 第一幀
        if (startTime === null) {
            startTime = timestamp;
        }


        // 已經經過多少秒
        const elapsed =
            (timestamp - startTime) / 1000;


        // ----------------------------------------------------
        // 呼叫 canvas.js 畫指定時間
        // ----------------------------------------------------

        window.renderSandFrame(elapsed);


        // ----------------------------------------------------
        // 動畫尚未結束
        // ----------------------------------------------------

        if (elapsed < EXPORT_DURATION) {

            requestAnimationFrame(
                previewLoop
            );

        } else {

            // ------------------------------------------------
            // 最後再畫一次完整結束畫面
            // ------------------------------------------------

            window.renderSandFrame(
                EXPORT_DURATION
            );


            console.log(
                '[Preview] 動畫播放完成'
            );
        }
    }


    requestAnimationFrame(
        previewLoop
    );
}


// ============================================================
// 正式影片輸出模式
//
// EXPORT_VIDEO = true 時執行
//
// 固定：
// 1920 × 1080
// 60 FPS
// 10.5 秒
// 630 Frames
//
// 不使用即時錄影。
// 每一幀都由 frame / FPS 算出精確時間。
// ============================================================

async function startExport() {

    console.log(
        '[Export] 開始準備影片'
    );


    // --------------------------------------------------------
    // 檢查 CCapture
    // --------------------------------------------------------

    if (
        typeof CCapture ===
        'undefined'
    ) {

        setStatus(
            '錯誤：CCapture.js 尚未載入'
        );


        console.error(
            '[Export] CCapture.js 尚未載入'
        );


        return;
    }


    // --------------------------------------------------------
    // 檢查 canvas.js
    // --------------------------------------------------------

    if (
        typeof window.prepareSandAnimation !== 'function' ||
        typeof window.renderSandFrame !== 'function'
    ) {

        setStatus(
            '錯誤：canvas.js 尚未正確載入'
        );


        console.error(
            '[Export] 找不到 canvas.js 動畫函式'
        );


        return;
    }


    // --------------------------------------------------------
    // 顯示準備狀態
    // --------------------------------------------------------

    setStatus(
        '正在建立沙畫粒子...'
    );


    // --------------------------------------------------------
    // 建立沙畫粒子
    // --------------------------------------------------------

    try {

        await window.prepareSandAnimation();

    } catch (error) {

        console.error(
            '[Export] 沙畫初始化失敗：',
            error
        );


        setStatus(
            '圖片或沙畫初始化失敗'
        );


        return;
    }


    // --------------------------------------------------------
    // 取得 Canvas
    // --------------------------------------------------------

    const canvas =
        window.SAND_CANVAS;


    if (!canvas) {

        setStatus(
            '錯誤：找不到 Canvas'
        );


        console.error(
            '[Export] window.SAND_CANVAS 不存在'
        );


        return;
    }


    // --------------------------------------------------------
    // 檢查解析度
    // --------------------------------------------------------

    console.log(
        '[Export] Canvas:',
        canvas.width,
        'x',
        canvas.height
    );


    console.log(
        '[Export] FPS:',
        EXPORT_FPS
    );


    console.log(
        '[Export] Duration:',
        EXPORT_DURATION
    );


    console.log(
        '[Export] Frames:',
        TOTAL_FRAMES
    );


    // ========================================================
    // 建立 CCapture
    // ========================================================

    const capturer =
        new CCapture({

            // WebM
            format: 'webm',

            // 固定幀率
            framerate:
                EXPORT_FPS,

            // CCapture WebM 品質
            quality: 100,

            // 輸出檔名
            name:
                EXPORT_FILENAME,

            // Console 不輸出大量資訊
            verbose: false

        });


    // ========================================================
    // 開始擷取
    // ========================================================

    capturer.start();


    console.log(
        '[Export] 開始輸出'
    );


    // ========================================================
    // 逐幀輸出
    // ========================================================

    for (
        let frame = 0;
        frame < TOTAL_FRAMES;
        frame++
    ) {

        // ----------------------------------------------------
        // 每一幀對應的精確動畫時間
        //
        // Frame 0   = 0 秒
        // Frame 60  = 1 秒
        // Frame 300 = 5 秒
        // ----------------------------------------------------

        const time =
            frame /
            EXPORT_FPS;


        // ----------------------------------------------------
        // 畫出這一幀
        // ----------------------------------------------------

        window.renderSandFrame(
            time
        );


        // ----------------------------------------------------
        // 擷取 Canvas
        // ----------------------------------------------------

        capturer.capture(
            canvas
        );


        // ----------------------------------------------------
        // 百分比
        // ----------------------------------------------------

        const percent =
            Math.round(
                (
                    (frame + 1) /
                    TOTAL_FRAMES
                ) *
                100
            );


        setStatus(
            `影片輸出中 ${percent}% ｜ ${frame + 1} / ${TOTAL_FRAMES}`
        );


        // ----------------------------------------------------
        // 每 5 幀讓瀏覽器暫停一下
        //
        // 重要：
        // 這不會影響影片 FPS。
        //
        // 它只是避免瀏覽器因為連續計算
        // 太多幀而整個卡死。
        // ----------------------------------------------------

        if (
            frame % 5 === 0
        ) {

            await new Promise(
                resolve => {

                    setTimeout(
                        resolve,
                        0
                    );

                }
            );
        }
    }


    // ========================================================
    // 停止擷取
    // ========================================================

    capturer.stop();


    setStatus(
        '影片完成，正在建立下載檔...'
    );


    console.log(
        '[Export] 擷取完成'
    );


    // ========================================================
    // 儲存 WebM
    // ========================================================

    capturer.save();


    setStatus(
        `${EXPORT_FILENAME}.webm 已完成`
    );


    console.log(
        '[Export] WebM 輸出完成'
    );
}


// ============================================================
// 網頁載入完成後自動執行
// ============================================================

window.addEventListener(
    'load',
    () => {

        // ----------------------------------------------------
        // ★ 這裡會根據 EXPORT_VIDEO 決定模式
        // ----------------------------------------------------

        if (EXPORT_VIDEO) {

            console.log(
                '[Mode] VIDEO EXPORT'
            );


            setTimeout(
                startExport,
                500
            );

        } else {

            console.log(
                '[Mode] PREVIEW'
            );


            setTimeout(
                startPreview,
                100
            );

        }
    }
);
