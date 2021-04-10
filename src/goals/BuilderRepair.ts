import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const BuilderRepair: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return room.find(FIND_STRUCTURES, { filter: struct => struct.hitsMax - struct.hits > 50 }).length > 0;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const structures = room.find(FIND_MY_STRUCTURES, { filter: struct => struct.hitsMax - struct.hits > 50 });
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];
    let assignments: Assignment[] = [];

    structures.slice(0, 5).forEach(struct =>
      assignments.push({
        job: Job.Builder,
        body: getJuicerBody(room),
        memory: {
          job: Job.Builder,
          source: getJuicerSource(room),
          target: struct.pos,
          owner: struct.id
        }
      })
    );
    return assignments;
  },
  priority: 4
};
