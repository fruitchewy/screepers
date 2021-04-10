import { Job } from "Job";
import { getBuilderBody, getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceController: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = <StructureController>room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      const liveWorkers = controller ? getWorkersById(controller?.id, room).length : 999;

      if (liveWorkers < 2) {
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
      body: getBuilderBody(room),
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
