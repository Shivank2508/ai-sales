import { WebSocket, WebSocketServer } from "ws";
import { RealtimeVoiceService } from "./realtime.voice.service";
import { RealtimeClientMessage, RealtimeServerMessage } from "./realtime.voice.types";
export class RealtimeVoiceGateway {

    private readonly voiceService = new RealtimeVoiceService();
    private readonly connections = new Map<WebSocket, {
        productId: string;
        conversationId?: string;
        languageCode: string;
        transcript: string;
    }>()

    register(wss: WebSocketServer) {

        wss.on("connection", (socket) => {
            console.log(
                "Realtime voice client connected"
            );

            socket.on("message", async (raw) => {
                try {
                    const message = JSON.parse(raw.toString()) as RealtimeClientMessage;
                    await this.handleMessage(socket, message);
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

            })
            socket.on(
                "close",
                () => {

                    console.log(
                        "Realtime voice client disconnected"
                    );

                    this.connections.delete(
                        socket
                    );
                }
            );
        })

    }
    private async handleMessage(socket: WebSocket, message: RealtimeClientMessage) {
        switch (message.type) {
            case "start":
                this.connections.set(socket, {
                    productId: message.productId,
                    conversationId:
                        message.conversationId,

                    languageCode:
                        message.languageCode ??
                        "hi-IN",

                    transcript: "",
                })
                this.send(socket, {
                    type: "ready",
                    conversationId:
                        message.conversationId ??
                        "",
                })
                break;

            case "audio":

                /*
                 * Audio forwarding will be added
                 * when we connect Sarvam STT WebSocket.
                 */

                break;

            case "stop":

                await this.processTurn(
                    socket
                );

                break;

            case "interrupt":

                /*
                 * TTS interruption will be
                 * implemented after streaming
                 * TTS is connected.
                 */

                break;
        }
    }


    private async processTurn(socket: WebSocket) {
        const state = this.connections.get(socket)
        if (!state) {
            throw new Error(
                "Voice session has not started"
            );
        }

        if (!state.transcript.trim()) {
            return;
        }

        this.send(socket, {
            type: "thinking"
        })

        const response = await this.voiceService.generateAnswer(state.productId, state.transcript, state.conversationId)

        state.conversationId = response.conversationId

        this.send(socket, {
            type: "answer",
            text: response.answer
        })

        this.send(
            socket,
            {
                type: "done",
            }
        );
    }
    private send(socket: WebSocket, message: RealtimeServerMessage) {
        if (socket.readyState !== WebSocket.OPEN) {
            return
        }

        socket.send(JSON.stringify(message))
    }

}