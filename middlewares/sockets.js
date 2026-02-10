const activeSockets = new Map();
global.licenseSessions = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        activeSockets.set(socket.id, socket);
        console.log(`Nuevo usuario conectado: ${socket.id}`);

        socket.join('global-room');
        console.log(`Usuario ${socket.id} unido a la sala global`);

        // Limpiar listeners previos para evitar duplicados
        socket.removeAllListeners('client-upload-complete');
        socket.removeAllListeners('client-complete');
        socket.removeAllListeners('data-delete');
        socket.removeAllListeners('join-license-room');
        socket.removeAllListeners('leave-license-room');

        socket.on('client-upload-complete', (data) => {
            console.log('Subida recibida:', data);
            io.to('global-room').emit('new-upload', data);
        });

        socket.on('client-complete', (data) => {
            console.log('Subida issue recibida:', data);
            io.to('global-room').emit('new-issue', data);
        });


        socket.on('data-delete', (data) => {
            console.log('Eliminación recibida:', data);
            io.to('global-room').emit('new-delete', data);
        });

        socket.on('join-license-room', (sessionId) => {
            socket.join(sessionId);
            console.log(`Usuario ${socket.id} unido a la sala de licencias: ${sessionId}`);
        });

        socket.on('leave-license-room', (sessionId) => {
            socket.leave(sessionId);
            console.log(`Usuario ${socket.id} salió de la sala de licencias: ${sessionId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log(`Usuario desconectado: ${socket.id} (${reason})`);

            for (const [sessionId, socketId] of global.licenseSessions.entries()) {
                if (socketId === socket.id) {
                    global.licenseSessions.delete(sessionId);
                    console.log(`Sesión de licencia ${sessionId} eliminada por desconexión`);
                }
            }

            if (activeSockets.has(socket.id)) {
                activeSockets.delete(socket.id);
                console.log(`Socket ${socket.id} removido de activeSockets`);
            }
        });
    });

    return {
        emitToLicenseRoom: (sessionId, event, data) => {
            io.to(sessionId).emit(event, data);
        }
    };
};