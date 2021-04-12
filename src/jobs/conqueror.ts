import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  if (room.name != creep.memory.target.roomName) {
    creep.moveTo(new RoomPosition(25, 25, creep.memory.source.roomName));
    return;
  }

  const controller = Game.rooms[creep.memory.target.roomName].controller!;

  switch (creep.claimController(controller)) {
    case ERR_NOT_IN_RANGE:
      creep.moveTo(controller);
      break;
    case ERR_GCL_NOT_ENOUGH:
      creep.reserveController(controller);
      console.log("time to end colonialism lmao");
      creep.suicide();
      break;
    case ERR_INVALID_TARGET:
      creep.suicide();
      break;
    default:
  }

  if (creep.claimController(controller) === ERR_NOT_IN_RANGE) {
    creep.travelTo(controller);
  } else if (creep.claimController(controller) === -7) {
    creep.suicide();
  }
}
