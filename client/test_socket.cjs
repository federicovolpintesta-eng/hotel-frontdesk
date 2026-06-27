const { io } = require("socket.io-client");
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected");
  socket.emit("join_room", { roomCode: "TEST12", gameMode: "Grupal", character: { name: "Test", role: "Recepcionista", avatar: "" } });
});

socket.on("room_state_update", (state) => {
  console.log("State updated:", state.gameState.phase);
  if (state.gameState.phase === 'lobby') {
    socket.emit("start_game", "TEST12");
  } else {
    console.log("Check in state received. Departments:", Object.keys(state.gameState.departments));
    process.exit(0);
  }
});
