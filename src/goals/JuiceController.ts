import { Job } from "Job";
import { getWorkersById } from "./common";

export const JuiceController: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTROLLER
      })[0];
      const liveWorkers = controller?getWorkersById(controller?.id, room).length:999;

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
  priority: 4
};
