import { Job } from "Job";
import { getBuilderBody, getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceControllerSurplus: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      if (!controller || !controller.my) {
        return false;
      }
      const freeWorkers = room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job === Job.Idle }).length;

      if (room.energyCapacityAvailable >= 600 && room.energyAvailable / room.energyCapacityAvailable > 0.95) {
        return true;
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const controller = room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType === STRUCTURE_CONTROLLER
    })[0];
    const source = getJuicerSource(room);
    if (source) {
      const assignment: Assignment = {
        job: Job.Harvester,
        body: [WORK, CARRY, MOVE],
        memory: {
          job: Job.Harvester,
          source: source,
          target: controller.pos,
          owner: controller.id,
          stuckTicks: 0
        }
      };
      return [assignment];
    }
    return [];
  },
  priority: 10
};
