import { Job } from "Job";
import { getJuicerSource, getWorkersById } from "./common";

export const JuiceControllerSurplus: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      const freeWorkers = room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job === Job.Idle }).length;

      if (room.energyCapacityAvailable >= 600 && room.energyAvailable / room.energyCapacityAvailable > 0.98) {
        return true;
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const controller = room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType === STRUCTURE_CONTROLLER
    })[0];
    let source: RoomPosition;
    let body: BodyPartConstant[];
    if (room.memory.cans && room.memory.cans.length > 0) {
      body = [CARRY, CARRY, MOVE];
    } else {
      body = [WORK, CARRY, MOVE];
    }

    const assignment: Assignment = {
      job: Job.Harvester,
      body: body,
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
