import { Job } from "Job";
import { getWorkersById } from "./common";

export const JuiceExtensions: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const extensions = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      });
      const liveWorkers = extensions.reduce((a, b) => a + getWorkersById(b.id, room).length, 0);

      if (extensions.length > 0 && liveWorkers < extensions.length / 2) {
        return true;
      }
      return false;
    }
  ],
  getAssignments(room: Room): Assignment[] {
    const extensions = room.find(FIND_MY_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_EXTENSION
    });
    if (room.memory.cans) {
      //TODO: Jetcan Assignment [return]
    }
    const source = _.sample(room.find(FIND_SOURCES_ACTIVE), 1)[0];
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];
    const target = extensions.filter(ext => getWorkersById(ext.id, room).length === 0)[0];

    const assignment: Assignment = {
      job: Job.Harvester,
      body: body,
      memory: {
        job: Job.Harvester,
        source: source.pos,
        target: target.pos,
        owner: target.id
      }
    };
    return [assignment];
  },
  priority: 3
};
