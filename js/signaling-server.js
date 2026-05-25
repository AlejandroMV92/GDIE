const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clients = [];

wss.on('connection', (ws) => {

    console.log("Cliente conectado");

    clients.push({ ws, room: null, role: null });

    ws.on('message', (message) => {

        const data = JSON.parse(message);

        console.log("Mensaje:", data.type);

        switch(data.type) {

            case 'join-room': {
                const client = clients.find(c => c.ws === ws);
                if (client) {
                    client.room = data.room;
                    client.role = data.role || null;
                    console.log(`Usuario unido a sala ${data.room} como ${client.role}`);

                    const othersInRoom = clients.filter(other => other.ws !== ws && other.room === data.room);

                    if (othersInRoom.length > 0) {
                        ws.send(JSON.stringify({
                            type: 'peer-waiting',
                            room: data.room
                        }));
                    }

                    othersInRoom.forEach(other => {
                        if (other.ws.readyState === WebSocket.OPEN) {
                            other.ws.send(JSON.stringify({
                                type: 'peer-joined',
                                room: data.room
                            }));
                        }
                    });

                    const hasController = clients.some(c => c.room === data.room && c.role === 'controlador');
                    const hasViewer = clients.some(c => c.room === data.room && c.role === 'espectador');

                    if (hasController && hasViewer) {
                        clients.forEach(clientInRoom => {
                            if (clientInRoom.room === data.room && clientInRoom.ws.readyState === WebSocket.OPEN) {
                                clientInRoom.ws.send(JSON.stringify({
                                    type: 'room-ready',
                                    room: data.room
                                }));
                            }
                        });
                    }
                }
                break;
            }

            case 'offer':
            case 'answer':
            case 'ice-candidate':
            case 'request-offer': {
                const sender = clients.find(c => c.ws === ws);
                const room = sender?.room;

                clients.forEach(client => {
                    if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN && client.room === room) {
                        client.ws.send(JSON.stringify(data));
                    }
                });
                break;
            }
        }
    });

    ws.on('close', () => {
        clients = clients.filter(c => c.ws !== ws);
        console.log("Cliente desconectado");
    });

});

console.log("Servidor WS en puerto 8080");