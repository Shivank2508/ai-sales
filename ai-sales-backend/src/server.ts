import { createServer } from "node:http";
import app from "./app";
import "dotenv/config"
import { connectToMongoDB } from "./db/mongodb";
import { WebSocketServer } from "ws";
import { RealtimeVoiceGateway } from "./modules/voice/realtime/realtime.voice.gateway";

const server = createServer(app)
const port = process.env.PORT

const wss = new WebSocketServer({
    server,
    path: "/api/voice/realtime"
})

const realtimeVoiceGateway = new RealtimeVoiceGateway()

realtimeVoiceGateway.register(wss)


connectToMongoDB().then(
    () => server.listen(port, () => {
        console.log(`server is running on ${port}`)
        console.log(
            `WebSocket server is running on ws://localhost:${port}/api/voice/realtime`
        );
    })
)
