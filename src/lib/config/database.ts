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
    
    console.log('✅ MongoDB conectado correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    isConnected = false;
    throw error; // Lanzar error en lugar de hacer exit
  }
};

// Manejar eventos de conexión
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado');
  isConnected = false;
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Error de MongoDB:', error);
  isConnected = false;
});
