import { Job } from "Job";
import { getBuilderBody, getJuicerBody, getJuicerSource, getWorkersById, hasActiveEnergy, roomHealthy } from "./common";

export const JuiceController: Goal = {
  preconditions: [
    room => (roomHealthy(room) ? hasActiveEnergy(room) : true),
    function (room: Room): boolean {
      const controller = room.controller;
      if (!controller || !controller.my) {
        return false;
      }
      const liveWorkers = getWorkersById(controller?.id, room);
      if (liveWorkers.length < 1) {
        return true;
      }
      const juicerCargoAvgPct =
        liveWorkers
          .map(creep => (creep.store.getUsedCapacity(RESOURCE_ENERGY) / creep.store.getCapacity(RESOURCE_ENERGY)) * 100)
          .reduce((a, b) => a + b) / liveWorkers.length;

      if (liveWorkers.length < Math.ceil(controller.level ** 1.2)) {
        if (liveWorkers.length == 0) {
          return true;
        } else return roomHealthy(room) && juicerCargoAvgPct > 85;
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
        body: getJuicerBody(room).concat(getJuicerBody(room).find(p => p == WORK) ? [] : [WORK, WORK]),
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
  priority: 6
};
