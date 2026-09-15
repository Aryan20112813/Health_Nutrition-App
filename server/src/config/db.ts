import mongoose from 'mongoose';

let isConnected = false;
let lastConnectionError: string | null = null;

/**
 * Automatically escapes special characters (like @, #, $, %, etc.) in the MongoDB URI
 * password to prevent "MongoParseError: Password contains unescaped characters".
 */
export function sanitizeMongoUri(rawUri: string): string {
  if (!rawUri) return rawUri;

  const prefixMatch = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)(.+)$/);
  if (!prefixMatch) return rawUri;

  const prefix = prefixMatch[1];
  const rest = prefixMatch[2];

  // The last '@' before host/database separates credentials from host
  const atIndex = rest.lastIndexOf('@');
  if (atIndex === -1) return rawUri;

  const userPass = rest.substring(0, atIndex);
  const hostAndOptions = rest.substring(atIndex + 1);

  const colonIndex = userPass.indexOf(':');
  if (colonIndex === -1) return rawUri;

  const username = userPass.substring(0, colonIndex);
  const password = userPass.substring(colonIndex + 1);

  // Decode first in case parts were already partially encoded, then encodeURIComponent
  let decodedUser = username;
  let decodedPass = password;
  try { decodedUser = decodeURIComponent(username); } catch {}
  try { decodedPass = decodeURIComponent(password); } catch {}

  const encodedUser = encodeURIComponent(decodedUser);
  const encodedPass = encodeURIComponent(decodedPass);

  return `${prefix}${encodedUser}:${encodedPass}@${hostAndOptions}`;
}

export async function connectDatabase(): Promise<boolean> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    console.warn(
      '[Database] MONGODB_URI environment variable is not defined. Running in mock/offline persistence mode.'
    );
    lastConnectionError = 'MONGODB_URI not configured';
    return false;
  }

  const uri = sanitizeMongoUri(rawUri);

  try {
    if (isConnected && mongoose.connection.readyState === 1) return true;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    lastConnectionError = null;
    console.log('[Database] Connected successfully to MongoDB.');
    return true;
  } catch (error: any) {
    isConnected = false;
    lastConnectionError = error.message || String(error);
    console.error('[Database] MongoDB connection status:', lastConnectionError);
    if (lastConnectionError?.includes('IP that isn\'t whitelisted') || lastConnectionError?.includes('Could not connect to any servers')) {
      console.warn(
        '[Database Note] MongoDB Atlas Network Access requires adding IP 0.0.0.0/0 (Allow Access from Anywhere) in your Atlas dashboard.'
      );
    }
    return false;
  }
}

export function getDatabaseStatus(): {
  connected: boolean;
  uriConfigured: boolean;
  lastError: string | null;
} {
  return {
    connected: mongoose.connection.readyState === 1,
    uriConfigured: Boolean(process.env.MONGODB_URI),
    lastError: lastConnectionError,
  };
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

