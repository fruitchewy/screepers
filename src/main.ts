import { ErrorMapper } from "utils/ErrorMapper";
import { Traveler } from "utils/Traveler";
import { Job } from "Job";
import { RoomManagement } from "RoomManagement";

Traveler.init();
Creep.prototype.makeIdle = function () {
  this.memory.stuckTicks = 0;
  this.memory.job = Job.Idle;
  this.memory.owner = this.id;
  this.travelTo(Game.rooms[this.pos.roomName].controller!.pos);
};

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
    stuckTicks: number;
  }
  interface RoomMemory {
    cans?: RoomPosition[];
  }
}
