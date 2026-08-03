import { Pinecone } from "@pinecone-database/pinecone";



const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export const vectorIndex =
    pinecone.index("sales-ai");