import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceControllerSurplus: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      const freeWorkers = room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job === Job.Idle }).length;

      if (room.energyCapacityAvailable >= 600 && room.energyAvailable / room.energyCapacityAvailable > 0.9) {
        return true;
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const controller = room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType === STRUCTURE_CONTROLLER
    })[0];

    const assignment: Assignment = {
      job: Job.Harvester,
      body: getJuicerBody(room),
      memory: {
        job: Job.Harvester,
        source: getJuicerSource(room),
        target: controller.pos,
        owner: controller.id
      }
    };
    return [assignment];
  },
  priority: 10
};
