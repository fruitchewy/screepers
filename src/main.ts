import { ErrorMapper } from "utils/ErrorMapper";
import { Traveler } from "utils/Traveler";
import { Job } from "Job";
import { RoomManagement } from "RoomManagement";

Traveler.init();

export const loop = ErrorMapper.wrapLoop(() => {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  for (const room in Game.rooms) {
    const roomDirector = new RoomManagement.Director(Game.rooms[room]);
    roomDirector.run();
  }
});

declare global {
  interface CreepMemory {
    job: Job;
    source: RoomPosition;
    target: RoomPosition;
    owner: Id<any>;
  }
  interface RoomMemory {
    cans?: RoomPosition[];
  }
}
