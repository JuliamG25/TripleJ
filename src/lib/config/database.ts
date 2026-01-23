import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  // Si ya está conectado, no hacer nada
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  // Si está conectando, esperar
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve) => {
      mongoose.connection.once('connected', () => {
        resolve();
      });
    });
  }

  try {
    await mongoose.connect(config.mongoURI);
    isConnected = true;
  } catch (error) {
    isConnected = false;
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
});

mongoose.connection.on('error', () => {
  isConnected = false;
});
