import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/
            CryptoTrackerBackend`)
            console.log(`\n MongoDB Connected || DB HOST: ${connectInstance.connection.host}`);
            
    } catch (error) {
        console.error('MongoDB connection error', error)
        process.exit(1)
    }
}

export default connectDB