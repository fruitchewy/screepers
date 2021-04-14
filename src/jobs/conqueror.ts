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

  if (room.find(FIND_FLAGS, { filter: flag => flag.name == "CONQUER" }).length > 0) {
    console.log("conquering " + room.name);
    switch (creep.claimController(controller)) {
      case ERR_NOT_IN_RANGE:
        creep.moveTo(controller);
        break;
      case ERR_INVALID_TARGET:
      default:
        creep.suicide();
        break;
    }
    return;
  }

  if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
}
