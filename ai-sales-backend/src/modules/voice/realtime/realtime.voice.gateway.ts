import { WebSocket, WebSocketServer, } from "ws";
import { RealtimeVoiceService, } from "./realtime.voice.service";
import { RealtimeClientMessage, RealtimeServerMessage, } from "./realtime.voice.types";
import { SarvamTTSStreamService, } from "./sarvam-tts-stream.service";
import { SarvamSTTStreamService, } from "./sarvam-stt-stream.service";
import { VoiceLatencyService } from "./voice-latency.service";
import { VoiceLatencyMetrics } from "./voice-latency.types";


<<<<<<< HEAD
import {
    RealtimeClientMessage,
    RealtimeServerMessage,
} from "./realtime.voice.types";

import {
    SarvamTTSStreamService,
} from "./sarvam-tts-stream.service";

import {
    SarvamSTTStreamService,
} from "./sarvam-stt-stream.service";
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a


interface VoiceConnectionState {
    productId: string;
    conversationId?: string;
    languageCode: string;
    transcript: string;
    stt?: SarvamSTTStreamService;
    tts?: SarvamTTSStreamService;
    ttsGeneration: number;
    latency: VoiceLatencyMetrics;
}


export class RealtimeVoiceGateway {
    private readonly latencyService =
        new VoiceLatencyService();
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
                         * Close STT and TTS WebSockets
                         */
                        state?.stt?.close();
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

                const stt = new SarvamSTTStreamService({
                    languageCode: message.languageCode ?? "hi-IN",
                    onTranscript: (transcript, isFinal) => {
                        const state = this.connections.get(socket)

                        if (!state) {
                            return
                        }

                        if (isFinal) {
<<<<<<< HEAD
                            state.transcript += " " + transcript
=======
                            state.transcript = this.appendTranscript(
                                state.transcript,
                                transcript
                            );


                            state.latency
                                .transcriptReceivedAt =
                                Date.now();
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                        }

                        this.send(socket, {
                            type: "transcript",
                            text: transcript,
                            final: isFinal
                        })
                    },

                    onSpeechStart: () => {
                        console.log(
                            "User started speaking"
                        );
<<<<<<< HEAD
=======
                        const state = this.connections.get(socket);
                        if (state) {
                            state.ttsGeneration += 1;
                            state.tts?.close();
                            state.tts = this.createTTS(
                                socket,
                                state.languageCode,
                                state.ttsGeneration
                            );
                            void state.tts.connect().catch((err) => {
                                console.error(
                                    "Failed to reconnect TTS on speech start interrupt:",
                                    err
                                );
                            });

                            state.latency = {
                                ...this.latencyService
                                    .createMetrics(),

                                speechStartAt:
                                    Date.now(),
                            };
                        }
                        this.send(
                            socket,
                            {
                                type: "interrupt",
                            }
                        );
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                    },
                    onSpeechEnd: async () => {

                        console.log(
                            "User stopped speaking"
                        );

<<<<<<< HEAD
                        await this.processTurn(
                            socket
                        );
=======
                        const state = this.connections.get(socket);
                        if (!state) {
                            return;
                        }

                        if (state.speechEndTimer) {
                            clearTimeout(state.speechEndTimer);
                        }
                        state.latency.speechEndAt =
                            Date.now();
                        state.speechEndAttempts = 0;
                        state.speechEndTimer = setTimeout(() => {
                            void this.processTurn(socket).catch((error) => {
                                this.handleTurnError(socket, error);
                            });
                        }, 300);
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                    },

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
                })
                /*
                 * If an existing session exists,
                 * close its STT & TTS connections first.
                 */
                const existingState =
                    this.connections.get(
                        socket
                    );

                existingState?.stt?.close();
                existingState?.tts?.close();


                const languageCode =
                    message.languageCode ??
                    "hi-IN";

                const state: VoiceConnectionState = {
                    productId:
                        message.productId,

<<<<<<< HEAD
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
=======
                    conversationId:
                        message.conversationId,
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

                    languageCode,

                    transcript: "",
                    processingTurn: false,
                    speechEndAttempts: 0,
                    ttsGeneration: 0,
                    stt,
                    tts: undefined,
                    latency: this.latencyService.createMetrics(),
                };

                this.connections.set(
                    socket,
<<<<<<< HEAD
                    {
                        productId:
                            message.productId,

                        conversationId:
                            message.conversationId,

                        languageCode,

                        transcript: "",
                        stt,

                        tts,
                    }
                );


                /*
                 * Connect STT and TTS WebSockets
                 */
                try {
                    await Promise.allSettled([
                        stt.connect().catch((err) => {
                            console.error("Sarvam STT connection warning:", err.message);
                        }),
                        tts.connect().catch((err) => {
                            console.error("Sarvam TTS connection warning:", err.message);
                        }),
                    ]);
                } catch (err: any) {
                    console.error("Voice streaming initialization error:", err);
                }

=======
                    state
                );

                state.tts =
                    this.createTTS(
                        socket,
                        state.languageCode,
                        state.ttsGeneration
                    );

                await Promise.all([
                    stt.connect(),
                    state.tts.connect(),
                ]);
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
                this.send(socket, {
                    type: "ready",
                    conversationId: message.conversationId || "",
                });

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
                state.stt?.sendAudio(
                    message.audio
                );

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
                 * Stop current TTS stream and increment generation
                 * to ignore any late audio frames from previous stream.
                 */
                state.ttsGeneration += 1;
                state.tts?.close();
<<<<<<< HEAD
=======
                state.tts =
                    this.createTTS(
                        socket,
                        state.languageCode,
                        state.ttsGeneration
                    );
                void state.tts.connect().catch((err) => {
                    console.error(
                        "Failed to reconnect TTS on interrupt:",
                        err
                    );
                });
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

                break;
            }


            default: {

                throw new Error(
                    "Unknown realtime voice message type"
                );
            }
        }
    }

<<<<<<< HEAD

=======
    private createTTS(socket: WebSocket, languageCode: string, generation: number): SarvamTTSStreamService {
        const tts = new SarvamTTSStreamService({
            languageCode,
            speaker: "shubh",
            onAudio: (audio, mimeType) => {
                const state = this.connections.get(socket);
                if (!state) { return; }
                if (state.latency.firstAudioAt === undefined) {
                    state.latency.firstAudioAt = Date.now();
                    const metrics = this.latencyService.calculate(state.latency);
                    console.log("VOICE LATENCY", metrics);
                }
                if (state.ttsGeneration !== generation) { return; }
                this.send(socket, { type: "audio", audio, mimeType });
            },
            onComplete: () => {
                const state = this.connections.get(socket);
                if (!state || state.ttsGeneration !== generation) { return; }
                state.latency.turnCompletedAt = Date.now();
                const metrics = this.latencyService.calculate(state.latency);
                console.log("VOICE TURN COMPLETE", metrics);

                this.send(socket, { type: "done", latency: metrics });
            },
            onError: (error) => {
                const state = this.connections.get(socket);
                if (!state || state.ttsGeneration !== generation) { return; }
                this.send(socket, { type: "error", message: error.message });
            }
        });
        return tts;
    }
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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

<<<<<<< HEAD

        /*
         * Tell client that AI is thinking
         */
        this.send(
            socket,
            {
                type: "thinking",
=======
        state.processingTurn = true;
        state.latency.agentStartAt =
            Date.now();
        try {
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

            state.latency.agentEndAt =
                Date.now();
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
                state.latency.ttsStartAt =
                    Date.now();
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
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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