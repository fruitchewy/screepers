import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  if (room.name != creep.memory.target.roomName) {
    creep.moveTo(new RoomPosition(25, 25, creep.memory.source.roomName));
    return;
  }
  const controller = Game.rooms[creep.memory.target.roomName].controller!;

  if (!controller) {
    console.log("killing myself in a desolate wasteland imo");
    creep.suicide();
  }

  if (room.find(FIND_FLAGS, { filter: flag => flag.pos == room.controller!.pos }).length > 0) {
    switch (creep.claimController(controller)) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(controller);
        break;
      case ERR_INVALID_TARGET:
        creep.suicide();
        break;
      default:
    }
    return;
  }

  if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
}
