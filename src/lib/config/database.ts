import mongoose from 'mongoose';

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
    const mongoURI = 
      (typeof import.meta !== 'undefined' && import.meta.env?.MONGODB_URI) ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/fesc-proyectos';
    
    await mongoose.connect(mongoURI);
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
