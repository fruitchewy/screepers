import { Job } from "Job";
import { getWorkersById } from "./common";

export const JuiceExtensions: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      });
      const liveWorkers = extensions.reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
      const nonEmptyIdleExtensions = extensions.filter(ext => ext.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 && getWorkersById(ext.id, room).length === 0)
      return nonEmptyIdleExtensions.length !== 0 && liveWorkers < extensions.length/2;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const extensions = <StructureExtension[]> room.find(FIND_MY_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_EXTENSION
    });
    if (room.memory.cans) {
      //TODO: Jetcan Assignment [return]
    }
    const nonEmptyIdleExtensions = extensions.filter(ext => ext.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 && getWorkersById(ext.id, room).length === 0)

    const source = room.find(FIND_SOURCES_ACTIVE)[0];
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];
    const target = nonEmptyIdleExtensions[0];

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
