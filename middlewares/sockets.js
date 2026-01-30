const activeSockets = new Map();
global.licenseSessions = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        activeSockets.set(socket.id, socket);
        console.log(`Nuevo usuario conectado: ${socket.id}`);

        socket.join('global-room');
        console.log(`Usuario ${socket.id} unido a la sala global`);

        socket.removeAllListeners('client-upload-complete');
        socket.removeAllListeners('client-complete');
        socket.removeAllListeners('tema-delete');
        socket.removeAllListeners('producto-new');
        socket.removeAllListeners('producto-upload');
        socket.removeAllListeners('producto-delete');
        socket.removeAllListeners('paquete-new');
        socket.removeAllListeners('paquete-upload');
        socket.removeAllListeners('paquete-delete');
        socket.removeAllListeners('certificado-new');
        socket.removeAllListeners('certificado-delete');

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

        socket.on('tema-delete', (data) => {
            console.log('nombre recibido:', data);
            io.to('global-room').emit('new-delete', data);
        });

        socket.on('producto-new', (data) => {
            console.log('producto recibido:', data);
            io.to('global-room').emit('new-producto', data);
        });

        socket.on('producto-upload', (data) => {
            console.log('Producto subido:', data);
            io.to('global-room').emit('upload-producto', data);
        });

        socket.on('producto-delete', (data) => {
            console.log('Producto eliminado:', data);
            io.to('global-room').emit('delete-producto', data);
        });

        socket.on('paquete-new', (data) => {
            console.log('Nuevo paquete recibido:', data);
            io.to('global-room').emit('new-paquete', data);
        });

        socket.on('paquete-upload', (data) => {
            console.log('Paquete subido:', data);
            io.to('global-room').emit('upload-paquete', data);
        });

        socket.on('paquete-delete', (data) => {
            console.log('Paquete eliminado:', data);
            io.to('global-room').emit('delete-paquete', data);
        });

        //nuevos

        socket.on('certificado-new', (data) => {
            console.log('certificado nuevo:', data);
            io.to('global-room').emit('new-certificados', data);
        });

        socket.on('certificado-delete', (data) => {
            console.log('certificado eliminado:', data);
            io.to('global-room').emit('delete-certificados', data);
        });

        socket.on('licencia-new', (data) => {
            console.log('licencias:', data);
            io.to('global-room').emit('new-licences', data);
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