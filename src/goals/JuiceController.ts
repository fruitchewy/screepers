import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceController: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = <StructureController>room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      const liveWorkers = controller ? getWorkersById(controller?.id, room).length : 999;

      if ((controller.level < 3 || controller.ticksToDowngrade < 5000) && liveWorkers < 2) {
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
  priority: 4
};
