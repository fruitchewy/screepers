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
      const liveWorkers = getWorkersById(controller?.id, room).length;

      if (liveWorkers < Math.ceil(controller.level ** 1.3)) {
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
        body: getBuilderBody(room),
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
