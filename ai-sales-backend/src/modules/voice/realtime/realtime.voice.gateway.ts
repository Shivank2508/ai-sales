import {
    WebSocket,
    WebSocketServer,
} from "ws";

import {
    RealtimeVoiceService,
} from "./realtime.voice.service";

import {
    RealtimeClientMessage,
    RealtimeServerMessage,
} from "./realtime.voice.types";

import {
    SarvamTTSStreamService,
} from "./sarvam-tts-stream.service";


interface VoiceConnectionState {
    productId: string;
    conversationId?: string;
    languageCode: string;
    transcript: string;
    tts?: SarvamTTSStreamService;
}


export class RealtimeVoiceGateway {

    private readonly voiceService =
        new RealtimeVoiceService();

    private readonly connections =
        new Map<WebSocket, VoiceConnectionState>();


    register(wss: WebSocketServer) {

        wss.on(
            "connection",
            (socket) => {
                console.log(
                    "Realtime voice client connected"
                );
                socket.on(
                    "message",
                    async (raw) => {
                        try {
                            const message =
                                JSON.parse(
                                    raw.toString()
                                ) as RealtimeClientMessage;

                            await this.handleMessage(
                                socket,
                                message
                            );
                        } catch (error) {
                            console.error(
                                "Realtime voice error:",
                                error
                            );

                            this.send(
                                socket,
                                {
                                    type: "error",
                                    message:
                                        error instanceof Error
                                            ? error.message
                                            : "Realtime voice error",
                                }
                            );
                        }
                    }
                );


                socket.on(
                    "close",
                    () => {

                        console.log(
                            "Realtime voice client disconnected"
                        );

                        const state =
                            this.connections.get(
                                socket
                            );

                        /*
                         * Close TTS WebSocket
                         */
                        state?.tts?.close();

                        /*
                         * Remove connection state
                         */
                        this.connections.delete(
                            socket
                        );
                    }
                );


                socket.on(
                    "error",
                    (error) => {

                        console.error(
                            "Realtime voice socket error:",
                            error
                        );
                    }
                );
            }
        );
    }


    private async handleMessage(
        socket: WebSocket,
        message: RealtimeClientMessage
    ) {

        switch (message.type) {


            /*
             * START VOICE SESSION
             */
            case "start": {

                /*
                 * If an existing session exists,
                 * close its TTS connection first.
                 */
                const existingState =
                    this.connections.get(
                        socket
                    );

                existingState?.tts?.close();


                const languageCode =
                    message.languageCode ??
                    "hi-IN";


                const tts =
                    new SarvamTTSStreamService({

                        languageCode,

                        speaker: "shubh",


                        /*
                         * TTS audio chunk
                         */
                        onAudio: (
                            audio,
                            mimeType
                        ) => {

                            this.send(
                                socket,
                                {
                                    type: "audio",
                                    audio,
                                    mimeType,
                                }
                            );
                        },


                        /*
                         * TTS completed
                         */
                        onComplete: () => {

                            this.send(
                                socket,
                                {
                                    type: "done",
                                }
                            );
                        },


                        /*
                         * TTS error
                         */
                        onError: (error) => {

                            this.send(
                                socket,
                                {
                                    type: "error",
                                    message:
                                        error.message,
                                }
                            );
                        },
                    });


                /*
                 * Store connection state
                 */
                this.connections.set(
                    socket,
                    {
                        productId:
                            message.productId,

                        conversationId:
                            message.conversationId,

                        languageCode,

                        transcript: "",

                        tts,
                    }
                );


                /*
                 * Connect TTS
                 */
                tts.connect();

                break;
            }


            /*
             * AUDIO FROM CLIENT
             */
            case "audio": {

                const state =
                    this.connections.get(
                        socket
                    );

                if (!state) {

                    throw new Error(
                        "Voice session has not started"
                    );
                }


                /*
                 * TODO:
                 *
                 * Forward audio to Sarvam STT
                 * WebSocket here.
                 *
                 * Example:
                 *
                 * state.stt?.sendAudio(
                 *     message.audio
                 * );
                 */


                break;
            }


            /*
             * STOP CURRENT USER TURN
             */
            case "stop": {

                await this.processTurn(
                    socket
                );

                break;
            }


            /*
             * INTERRUPT TTS
             */
            case "interrupt": {

                const state =
                    this.connections.get(
                        socket
                    );

                if (!state) {
                    return;
                }


                /*
                 * Stop current TTS stream.
                 *
                 * If your TTS service later has
                 * an explicit interrupt/clear method,
                 * use that instead.
                 */
                state.tts?.close();

                break;
            }


            default: {

                throw new Error(
                    "Unknown realtime voice message type"
                );
            }
        }
    }


    private async processTurn(
        socket: WebSocket
    ) {

        const state =
            this.connections.get(
                socket
            );


        if (!state) {

            throw new Error(
                "Voice session has not started"
            );
        }


        /*
         * Don't process empty transcript
         */
        if (!state.transcript.trim()) {
            return;
        }


        /*
         * Tell client that AI is thinking
         */
        this.send(
            socket,
            {
                type: "thinking",
            }
        );


        /*
         * Generate AI response
         */
        const response =
            await this.voiceService.generateAnswer(
                state.productId,
                state.transcript,
                state.conversationId
            );


        /*
         * Save conversation ID
         */
        state.conversationId =
            response.conversationId;


        /*
         * Send text answer to client
         */
        this.send(
            socket,
            {
                type: "answer",
                text: response.answer,
            }
        );


        /*
         * Send answer to streaming TTS
         */
        if (state.tts) {

            state.tts.sendText(
                response.answer
            );

            state.tts.flush();

        } else {

            /*
             * If TTS is not available,
             * complete the turn immediately.
             */
            this.send(
                socket,
                {
                    type: "done",
                }
            );
        }


        /*
         * Clear transcript for next turn.
         */
        state.transcript = "";
    }


    private send(
        socket: WebSocket,
        message: RealtimeServerMessage
    ) {

        if (
            socket.readyState !==
            WebSocket.OPEN
        ) {
            return;
        }


        socket.send(
            JSON.stringify(message)
        );
    }
}