const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const dbMiddleware = require('./middlewares/dbMiddleware');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const socketHandler = require('./middlewares/sockets');

// ============   ======== MANEJO GLOBAL DE ERRORES ====================

// Manejo de excepciones no capturadas (errores síncronos críticos)
process.on('uncaughtException', (error) => {
    console.error('========================================');
    console.error('[FATAL] ERROR CRÍTICO - uncaughtException');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('========================================');
    // Registrar error crítico y cerrar el proceso después de 1 segundo
    setTimeout(() => process.exit(1), 1000);
});

// Manejo de promesas rechazadas no manejadas (errores asíncronos)
// Nota: Las promesas rechazadas no siempre son críticas, por lo que el proceso continúa
process.on('unhandledRejection', (reason, promise) => {
    console.error('========================================');
    console.error('[ERROR - unhandledRejection]');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Razón: ${reason}`);
    if (reason instanceof Error) {
        console.error(`Mensaje: ${reason.message}`);
        console.error(`Stack: ${reason.stack}`);
    } else {
        console.error(`Datos: ${JSON.stringify(reason, null, 2)}`);
    }
    console.error('========================================');
    // El proceso continúa funcionando (menos crítico que uncaughtException)
});

// Manejo de errores de advertencias no manejadas
process.on('warning', (warning) => {
    console.warn('========================================');
    console.warn('[ADVERTENCIA]');
    console.warn(`Fecha: ${new Date().toISOString()}`);
    console.warn(`Nombre: ${warning.name}`);
    console.warn(`Mensaje: ${warning.message}`);
    console.warn(`Stack: ${warning.stack}`);
    console.warn('========================================');
});

const app = express();
const server = http.createServer(app);

// Manejo de errores en el servidor HTTP
server.on('error', (error) => {
    console.error('========================================');
    if (error.code === 'EADDRINUSE') {
        console.error('[ERROR] El puerto ya está en uso');
    } else {
        console.error('[ERROR EN SERVIDOR HTTP]');
    }
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('========================================');
});

// Manejo de errores de conexiones del servidor
server.on('clientError', (error, socket) => {
    console.error('========================================');
    console.error('[ERROR EN CLIENTE HTTP]');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Mensaje: ${error.message}`);
    console.error('========================================');
    if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
});

// app.set('trust proxy', '192.168.100.100');

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
    },
});

socketHandler(io);

// Manejo de errores en Socket.IO
io.on('error', (error) => {
    console.error('========================================');
    console.error('[ERROR EN SOCKET.IO]');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('========================================');
});

// Manejo de errores en conexiones de Socket.IO
io.engine.on('connection_error', (error) => {
    console.error('========================================');
    console.error('[ERROR EN CONEXIÓN SOCKET.IO]');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('========================================');
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

const PORT = process.env.PORT;

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Demasiadas solicitudes, por favor intente más tarde'
    }
});

const cspDirectives = {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "frame-ancestors": ["'self'", ...allowedOrigins]
};

app.use(helmet({
    contentSecurityPolicy: { directives: cspDirectives },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: false,
    permissionsPolicy: {
        features: {
            fullscreen: ["'self'", ...allowedOrigins]
        }
    }
}));

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 600
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLimiter);

const folderPath = path.join(__dirname, '../../../../var/www/html');
app.use('/FILES/static', express.static(folderPath));

const login = require('./routes/routes-login');
app.use('/casa/v1/login/', dbMiddleware, login());

const users = require('./routes/routes-users');
app.use('/casa/v1/users/', dbMiddleware, users());

const admin = require('./routes/routes-admin');
app.use('/casa/v1/admin/', dbMiddleware, admin());

// Middleware catch-all para rutas no encontradas (debe ir después de todas las rutas)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});


// Middleware de manejo de errores de Express
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = process.env.NODE_ENV === 'development'
        ? 'Error interno del servidor'
        : err.message;

    console.error('========================================');
    console.error('[ERROR EN EXPRESS MIDDLEWARE]');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Método: ${req.method}`);
    console.error(`URL: ${req.originalUrl}`);
    console.error(`Mensaje: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    console.error('========================================');

    // Asegurar que la respuesta no se haya enviado ya
    if (!res.headersSent) {
        res.status(statusCode).json({
            success: false,
            status: statusCode,
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
});



// Iniciar servidor con manejo de errores
try {
    server.listen(PORT, () => {
        console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
        console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
} catch (error) {
    console.error('========================================');
    console.error('[ERROR AL CONFIGURAR SERVIDOR]');
    console.error(`Fecha: ${new Date().toISOString()}`);
    console.error(`Mensaje: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('========================================');
    // El proceso continúa, aunque el servidor no se haya iniciado
}