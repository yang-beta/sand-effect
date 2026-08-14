// ============================================================
// recorder.js
//
// Canvas 自動錄影
//
// 1920 × 1080
// 60 FPS
// 30 Mbps
//
// 注意：
// recorder.js 不控制沙畫動畫。
// canvas.js 自己正常播放。
// ============================================================

(() => {

    'use strict';


    // ========================================================
    // 設定
    // ========================================================

    const FPS = 60;

    const BITRATE =
        30_000_000;

    // 沙畫動畫 10.5 秒
    // 多錄 0.5 秒避免尾端被切掉
    const RECORD_DURATION =
        11_000;


    // ========================================================
    // 等待網頁完成
    // ========================================================

    window.addEventListener(
        'load',
        () => {

            const canvas =
                document.getElementById(
                    'CanvasAnime'
                );


            if (!canvas) {

                console.error(
                    '找不到 CanvasAnime'
                );

                return;

            }


            // =================================================
            // 顯示目前實際解析度
            // =================================================

            console.log(
                'Canvas size:',
                canvas.width,
                'x',
                canvas.height
            );


            // =================================================
            // 檢查 captureStream
            // =================================================

            if (
                typeof canvas.captureStream
                !==
                'function'
            ) {

                console.error(
                    '此瀏覽器不支援 canvas.captureStream()'
                );

                return;

            }


            // =================================================
            // 找可用 Codec
            // =================================================

            let mimeType = '';


            const codecs = [

                'video/webm;codecs=vp9',

                'video/webm;codecs=vp8',

                'video/webm'

            ];


            for (
                const codec of codecs
            ) {

                if (
                    MediaRecorder
                        .isTypeSupported(codec)
                ) {

                    mimeType =
                        codec;

                    break;

                }

            }


            console.log(
                'Recording codec:',
                mimeType
            );


            // =================================================
            // Canvas Stream
            // =================================================

            const stream =
                canvas.captureStream(
                    FPS
                );


            // =================================================
            // Recorder
            // =================================================

            const options = {

                videoBitsPerSecond:
                    BITRATE

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
                    'MediaRecorder 建立失敗:',
                    error
                );

                return;

            }


            const chunks = [];


            // =================================================
            // 收集資料
            // =================================================

            recorder.addEventListener(
                'dataavailable',
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

                }
            );


            // =================================================
            // 完成
            // =================================================

            recorder.addEventListener(
                'stop',
                () => {

                    console.log(
                        '錄影停止'
                    );


                    const blob =
                        new Blob(
                            chunks,
                            {
                                type:
                                    mimeType
                                    ||
                                    'video/webm'
                            }
                        );


                    console.log(
                        '影片大小:',
                        (
                            blob.size
                            /
                            1024
                            /
                            1024
                        ).toFixed(2),
                        'MB'
                    );


                    // =========================================
                    // 下載
                    // =========================================

                    const url =
                        URL.createObjectURL(
                            blob
                        );


                    const a =
                        document.createElement(
                            'a'
                        );


                    a.href =
                        url;


                    a.download =
                        'sand-animation-1080p60.webm';


                    document.body
                        .appendChild(a);


                    a.click();


                    a.remove();


                    // =========================================
                    // 清理
                    // =========================================

                    setTimeout(
                        () => {

                            URL.revokeObjectURL(
                                url
                            );

                        },

                        5000
                    );


                    stream
                        .getTracks()
                        .forEach(
                            track => {

                                track.stop();

                            }
                        );

                }
            );


            recorder.addEventListener(
                'error',
                event => {

                    console.error(
                        'Recorder error:',
                        event
                    );

                }
            );


            // =================================================
            // 開始錄影
            //
            // canvas.js 此時已經自行初始化。
            // =================================================

            recorder.start(
                1000
            );


            console.log(
                '開始錄影：',
                '60 FPS / 30 Mbps'
            );


            // =================================================
            // 11 秒停止
            // =================================================

            setTimeout(
                () => {

                    if (
                        recorder.state
                        !==
                        'inactive'
                    ) {

                        recorder.stop();

                    }

                },

                RECORD_DURATION
            );

        }
    );

})();
