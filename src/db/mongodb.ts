import mongoose from "mongoose";

export async function connectToMongoDB(): Promise<void> {
    try {
        await mongoose.connect(process.env.MONGODB_URL!);

        console.log("You successfully connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

export async function disconnectFromMongoDB(): Promise<void> {
    await mongoose.disconnect();
}