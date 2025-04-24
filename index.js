const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

let rooms = {}; // { roomId: [socket1, socket2] }

server.on("connection", (socket) => {
    let currentRoom = null;

    socket.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            console.log("Received:", data);

            if (data.type === "create") {
                const roomId = data.roomId;
                if (!rooms[roomId]) {
                    rooms[roomId] = [socket];
                    currentRoom = roomId;
                    socket.send(JSON.stringify({ type: "status", message: "Room created. Waiting for another user..." }));
                } else {
                    socket.send(JSON.stringify({ type: "error", message: "Room already exists!" }));
                }

            } else if (data.type === "join") {
                const roomId = data.roomId;
                if (rooms[roomId] && rooms[roomId].length === 1) {
                    rooms[roomId].push(socket);
                    currentRoom = roomId;
                    rooms[roomId].forEach(client => {
                        client.send(JSON.stringify({ type: "status", message: "Both users connected. You can start chatting." }));
                    });
                } else {
                    socket.send(JSON.stringify({ type: "error", message: "Room not found or already full!" }));
                }

            } else if (data.type === "message" ||  data.type === "poke") {
                if (currentRoom && rooms[currentRoom]) {
                    let response;
            
                    if (data.type === "message") {
                        response = { type: "message", name: data.name, text: data.text };
                    } else if (data.type === "poke") {
                        response = { type: "poke", name: data.name }; // Gửi tên người chọc
                    }
            
                    rooms[currentRoom].forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            // Gửi cho tất cả người trong phòng (nếu muốn chỉ gửi cho người còn lại thì lọc)
                            client.send(JSON.stringify(response));
                        }
                    });
                }
            }
            

        } catch (e) {
            console.log("Invalid JSON:", message);
        }
    });

    socket.on("close", () => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom] = rooms[currentRoom].filter(client => client !== socket);
            if (rooms[currentRoom].length === 0) {
                delete rooms[currentRoom];
            }
        }
        console.log("Client disconnected!");
    });
});

console.log("WebSocket server is running on ws://0.0.0.0:8080");