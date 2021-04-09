import { Job } from "Job";
import { getWorkersById } from "./common";

export const BuildRepair: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return room.find(FIND_MY_STRUCTURES, { filter: struct => struct.hitsMax - struct.hits > 0 }).length > 0;
    }
  ],
  getAssignments(room: Room): Assignment[] {
    const structures = room.find(FIND_MY_STRUCTURES, { filter: struct => struct.hitsMax - struct.hits > 0 });
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];
    let assignments: Assignment[] = [];

    _.sample(structures, 4).forEach(struct =>
      assignments.push({
        job: Job.Builder,
        body: body,
        memory: {
          job: Job.Builder,
          source: _.sample(room.find(FIND_SOURCES_ACTIVE), 1)[0].pos,
          target: struct.pos,
          owner: struct.id
        }
      })
    );

    return assignments;
  },
  priority: 4
};
