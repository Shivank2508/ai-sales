import { createServer } from "node:http";
import app from "./app";
import "dotenv/config"
import { connectToMongoDB } from "./db/mongodb";

const server = createServer(app)
const port = process.env.PORT

connectToMongoDB().then(
    () => server.listen(port, () => {
        console.log(`server is running on ${port}`)
    })
)
