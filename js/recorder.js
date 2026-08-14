// ============================================================
// Sand Animation Video Recorder
//
// Output:
//
// 1920 × 1080
// 60 FPS
// 30 Mbps
// VP9 WebM
//
// 網頁載入後自動開始。
// ============================================================


(() => {

    'use strict';


    // ========================================================
    // ⚙️ 錄影設定
    // ========================================================

    const VIDEO_WIDTH =
        1920;


    const VIDEO_HEIGHT =
        1080;


    const VIDEO_FPS =
        60;


    const VIDEO_BITRATE =
        30_000_000;


    // 沙畫動畫時間
    const VIDEO_DURATION =
        10.5;


    // 額外多錄一點點尾端
    // 確保最後黑畫面也被記錄
    const END_PADDING =
        0.25;


    // ========================================================
    // 取得 Canvas
    // ========================================================

    const canvas =
        document.getElementById(
            'CanvasAnime'
        );


    if (!canvas) {

        console.error(
            '[Recorder] 找不到 #CanvasAnime'
        );

        return;

    }


    // ========================================================
    // 強制影片解析度
    // ========================================================

    canvas.width =
        VIDEO_WIDTH;


    canvas.height =
        VIDEO_HEIGHT;


    // ========================================================
    // 尋找瀏覽器支援的最佳格式
    //
    // 優先 VP9
    // ========================================================

    function getSupportedMimeType() {

        const types = [

            'video/webm;codecs=vp9',

            'video/webm;codecs=vp8',

            'video/webm'

        ];


        for (
            const type of types
        ) {

            if (
                MediaRecorder
                    .isTypeSupported(type)
            ) {

                return type;

            }

        }


        return '';

    }


    // ========================================================
    // 開始錄影
    // ========================================================

    async function startRecording() {

        console.log(
            '[Recorder] 準備錄製...'
        );


        console.log(
            `[Recorder] ${VIDEO_WIDTH} × ${VIDEO_HEIGHT}`
        );


        console.log(
            `[Recorder] ${VIDEO_FPS} FPS`
        );


        console.log(
            `[Recorder] ${VIDEO_BITRATE / 1_000_000} Mbps`
        );


        // ====================================================
        // Canvas → MediaStream
        // ====================================================

        const stream =
            canvas.captureStream(
                VIDEO_FPS
            );


        // ====================================================
        // MIME
        // ====================================================

        const mimeType =
            getSupportedMimeType();


        console.log(
            '[Recorder] Format:',
            mimeType || 'browser default'
        );


        // ====================================================
        // MediaRecorder 設定
        // ====================================================

        const options = {

            videoBitsPerSecond:
                VIDEO_BITRATE

        };


        if (mimeType) {

            options.mimeType =
                mimeType;

        }


        let recorder;


        try {

            recorder =
                new MediaRecorder(
                    stream,
                    options
                );

        }

        catch (error) {

            console.error(
                '[Recorder] MediaRecorder 建立失敗',
                error
            );

            return;

        }


        // ====================================================
        // 儲存影片資料
        // ====================================================

        const chunks = [];


        recorder.ondataavailable =
            event => {

                if (
                    event.data
                    &&
                    event.data.size > 0
                ) {

                    chunks.push(
                        event.data
                    );

                }

            };


        // ====================================================
        // 錄影完成
        // ====================================================

        recorder.onstop =
            () => {

                console.log(
                    '[Recorder] 錄影完成'
                );


                const finalType =
                    mimeType
                    ||
                    'video/webm';


                const blob =
                    new Blob(
                        chunks,
                        {
                            type:
                                finalType
                        }
                    );


                console.log(
                    '[Recorder] File size:',
                    (
                        blob.size
                        /
                        1024
                        /
                        1024
                    ).toFixed(2),
                    'MB'
                );


                // ============================================
                // 建立下載網址
                // ============================================

                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        'a'
                    );


                link.href =
                    url;


                link.download =
                    'sand-animation-1080p60.webm';


                // ============================================
                // 自動下載
                // ============================================

                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                // ============================================
                // 延後釋放
                // ============================================

                setTimeout(
                    () => {

                        URL.revokeObjectURL(
                            url
                        );

                    },

                    5000
                );


                // ============================================
                // 停止 MediaStream
                // ============================================

                stream
                    .getTracks()
                    .forEach(
                        track => {

                            track.stop();

                        }
                    );

            };


        // ====================================================
        // 錯誤處理
        // ====================================================

        recorder.onerror =
            event => {

                console.error(
                    '[Recorder] 錄影錯誤',
                    event
                );

            };


        // ====================================================
        // ★ 先開始錄影
        // ====================================================

        recorder.start();


        console.log(
            '[Recorder] 開始錄影'
        );


        // ====================================================
        // ★ 下一個 frame 才開始沙畫
        //
        // 避免漏掉動畫第一幀。
        // ====================================================

        requestAnimationFrame(

            async () => {

                if (
                    typeof
                    window.startSandAnimation
                    ===
                    'function'
                ) {

                    await window
                        .startSandAnimation();

                }

                else {

                    console.error(
                        '[Recorder] 找不到 startSandAnimation()'
                    );

                }

            }

        );


        // ====================================================
        // 自動停止
        // ====================================================

        const stopTime =

            (
                VIDEO_DURATION
                +
                END_PADDING
            )

            *

            1000;


        setTimeout(

            () => {

                if (
                    recorder.state
                    ===
                    'recording'
                ) {

                    console.log(
                        '[Recorder] 停止錄影'
                    );


                    recorder.stop();

                }

            },

            stopTime

        );

    }


    // ========================================================
    // 網頁進入後自動開始
    // ========================================================

    window.addEventListener(

        'load',

        () => {

            /*
                稍微等瀏覽器完成初始化。

                這 300ms 不會錄進動畫，
                因為 MediaRecorder 還沒開始。
            */

            setTimeout(

                () => {

                    startRecording();

                },

                300

            );

        }

    );

})();
