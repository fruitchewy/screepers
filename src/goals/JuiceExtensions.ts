import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceExtensions: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      });
      const liveWorkers = extensions.reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
      const nonEmptyIdleExtensions = extensions.filter(
        ext => ext.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 && getWorkersById(ext.id, room).length === 0
      );
      return nonEmptyIdleExtensions.length !== 0 && liveWorkers < extensions.length / 3;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_EXTENSION
    });

    const nonEmptyIdleExtensions = extensions.filter(
      ext => ext.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 && getWorkersById(ext.id, room).length === 0
    );

    const target = nonEmptyIdleExtensions[0];

    const assignment: Assignment = {
      job: Job.Harvester,
      body: getJuicerBody(room),
      memory: {
        job: Job.Harvester,
        source: getJuicerSource(room),
        target: target.pos,
        owner: target.id
      }
    };
    return [assignment];
  },
  priority: 3
};
