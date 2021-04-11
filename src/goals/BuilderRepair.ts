import { Job } from "Job";
import { getBuilderBody, getJuicerSource, getWorkersById } from "./common";

export const BuilderRepair: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return (
        room.find(FIND_MY_CREEPS, {
          filter: creep => creep.memory && creep.memory.job && creep.memory.job == Job.Builder
        }).length < 1 &&
        room.find(FIND_STRUCTURES, {
          filter: struct =>
            struct.hitsMax - struct.hits > 100 &&
            getWorkersById(struct.id, room).length === 0 &&
            struct.structureType != STRUCTURE_CONTAINER &&
            struct.hits < 50000
        }).length > 0
      );
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const structures = room.find(FIND_STRUCTURES, {
      filter: struct =>
        struct.hitsMax - struct.hits > 50 &&
        getWorkersById(struct.id, room).length === 0 &&
        struct.structureType != STRUCTURE_CONTAINER &&
        struct.hits < 50000
    });
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];
    let assignments: Assignment[] = [];
    const source = getJuicerSource(room);
    if (source) {
      assignments.push({
        job: Job.Builder,
        body: getBuilderBody(room),
        memory: {
          job: Job.Builder,
          source: source,
          target: structures[0].pos,
          owner: structures[0].id
        }
      });
      return assignments;
    }
    return [];
  },
  priority: 5
};
