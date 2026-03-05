import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msm-fepei';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✓ MongoDB conectado exitosamente');
    return mongoose.connection;
  } catch (error) {
    console.error('✗ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  console.log('✓ MongoDB desconectado');
};
