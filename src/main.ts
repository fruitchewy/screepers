import { ErrorMapper } from "utils/ErrorMapper";
import { Traveler } from "utils/Traveler";
import { Job } from "Job";
import { RoomManagement } from "RoomManagement";

Traveler.init();
Creep.prototype.makeIdle = function (changeOwner: boolean) {
  this.memory.stuckTicks = 0;
  this.memory.job = Job.Idle;
  this.memory.owner = changeOwner ? this.id : this.memory.owner;
};

export const loop = ErrorMapper.wrapLoop(() => {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  let offset: number = 0;
  for (const room in Game.rooms) {
    const roomDirector = new RoomManagement.Director(Game.rooms[room], offset);
    roomDirector.run();
    offset++;
  }
});

declare global {
  interface CreepMemory {
    job: Job;
    source: RoomPosition;
    target: RoomPosition;
    owner: Id<any>;
    stuckTicks: number;
  }
  interface RoomMemory {
    cans?: RoomPosition[];
    unknownNeighbors?: string[];
    knownNeighbors?: string[];
  }
}
