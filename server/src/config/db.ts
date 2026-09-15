import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '[Database] MONGODB_URI environment variable is not defined. Running in mock/offline persistence mode.'
    );
    return false;
  }

  try {
    if (isConnected) return true;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[Database] Connected successfully to MongoDB.');
    return true;
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error);
    isConnected = false;
    return false;
  }
}

export function getDatabaseStatus(): { connected: boolean; uriConfigured: boolean } {
  return {
    connected: mongoose.connection.readyState === 1,
    uriConfigured: Boolean(process.env.MONGODB_URI),
  };
}
