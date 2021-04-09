import { Job } from "Job";
import { getWorkersById } from "./common";

export const JuiceControllerSurplus: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      const freeWorkers = room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job === Job.Idle }).length;

      if (freeWorkers > 0 || room.energyAvailable / room.energyCapacityAvailable > 0.8) {
        return true;
      }
      return false;
    }
  ],
  getAssignments(room: Room): Assignment[] {
    const controller = room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType === STRUCTURE_CONTROLLER
    })[0];
    if (room.memory.cans) {
      //TODO: Jetcan Assignment [return]
    }
    const source = room.find(FIND_SOURCES_ACTIVE)[0];
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];

    const assignment: Assignment = {
      job: Job.Harvester,
      body: body,
      memory: {
        job: Job.Harvester,
        source: source.pos,
        target: controller.pos,
        owner: controller.id
      }
    };
    return [assignment];
  },
  priority: 10
};
