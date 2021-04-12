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
      return liveWorkers < _.ceil(extensions.length / 10) && room.energyAvailable / room.energyCapacityAvailable < 1;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_EXTENSION
    });

    const nonEmptyIdleExtensions = extensions.filter(
      ext => ext.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 && getWorkersById(ext.id, room).length === 0
    );

    const target = nonEmptyIdleExtensions[0] ? nonEmptyIdleExtensions[0] : extensions[0];

    const source = getJuicerSource(room);
    if (source) {
      const assignment: Assignment = {
        job: Job.Harvester,
        body: getJuicerBody(room),
        memory: {
          job: Job.Harvester,
          source: source,
          target: target.pos,
          owner: target.id,
          stuckTicks: 0
        }
      };
      return [assignment];
    }
    return [];
  },
  priority: 3
};
