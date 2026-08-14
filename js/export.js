const EXPORT_FPS = 60;
const EXPORT_DURATION = 10.5;

const TOTAL_FRAMES =
    Math.round(
        EXPORT_FPS *
        EXPORT_DURATION
    );

const statusElement =
    document.getElementById(
        'exportStatus'
    );

async function startExport() {
    if (
        typeof CCapture ===
        'undefined'
    ) {
        statusElement.textContent =
            '錯誤：CCapture.js 尚未載入';

        console.error(
            'CCapture.js not loaded'
        );

        return;
    }

    statusElement.textContent =
        '正在建立沙畫粒子...';

    try {
        await window
            .prepareSandAnimation();
    } catch (error) {
        console.error(error);

        statusElement.textContent =
            '圖片或沙畫初始化失敗';

        return;
    }

    const canvas =
        window.SAND_CANVAS;

    const capturer =
        new CCapture({
            format: 'webm',
            framerate: EXPORT_FPS,
            quality: 100,
            name:
                'sand-animation-1080p60',
            verbose: false
        });

    capturer.start();

    console.log(
        'Start export:',
        TOTAL_FRAMES,
        'frames'
    );

    for (
        let frame = 0;
        frame <
        TOTAL_FRAMES;
        frame++
    ) {
        const time =
            frame /
            EXPORT_FPS;

        window.renderSandFrame(
            time
        );

        capturer.capture(
            canvas
        );

        const percent =
            Math.round(
                (
                    frame /
                    (
                        TOTAL_FRAMES -
                        1
                    )
                ) *
                100
            );

        statusElement.textContent =
            `影片輸出中 ${percent}% ｜ ${frame + 1} / ${TOTAL_FRAMES}`;

        /*
            每幾幀讓瀏覽器喘一下。

            不會影響影片 FPS，
            因為影片時間由 CCapture 控制。
        */
        if (
            frame % 5 === 0
        ) {
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        0
                    )
            );
        }
    }

    capturer.stop();

    statusElement.textContent =
        '影片完成，正在產生下載檔...';

    capturer.save();

    statusElement.textContent =
        '完成：sand-animation-1080p60.webm';

    console.log(
        'Export complete'
    );
}

window.addEventListener(
    'load',
    () => {
        setTimeout(
            startExport,
            500
        );
    }
);
