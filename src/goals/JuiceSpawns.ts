import { Job } from "Job";
import { getWorkersById } from "./common";

export const JuiceSpawns: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const extensions = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      }).length;
      const liveWorkers = room.find(FIND_MY_SPAWNS).reduce((a, b) => a + getWorkersById(b.id, room).length, 0);

      if (extensions === 0 && liveWorkers < 3) {
        return true;
      }

      if (liveWorkers < extensions / 4 + 2 && room.energyAvailable / room.energyCapacityAvailable < 0.9) {
        return true;
      }
      return false;
    }
  ],
  getAssignments(room: Room): Assignment[] {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (room.memory.cans) {
      //TODO: Jetcan Assignment [return]
    }
    const source = room.find(FIND_SOURCES_ACTIVE)[0];
    let body = [WORK, CARRY, MOVE];
    if (getWorkersById(spawn.id, room).length > 0) {
      body = [WORK, CARRY, CARRY, MOVE, MOVE];
    }

    const assignment: Assignment = {
      job: Job.Harvester,
      body: body,
      memory: {
        job: Job.Harvester,
        source: source.pos,
        target: spawn.pos,
        owner: spawn.id
      }
    };
    return [assignment];
  },
  priority: 2
};
