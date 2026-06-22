// Wrapper para iniciar el servidor con las variables de entorno correctas
// Soluciona el problema de orden de carga: dotenv no debe cargar antes que las imports
// ⚠️ Las credenciales por defecto son SOLO para desarrollo local.
//    En producción/configuración real, usar el archivo .env correspondiente.
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'simuverse';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5001';

require('./dist/server.js');
