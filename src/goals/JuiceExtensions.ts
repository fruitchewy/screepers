import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById, hasActiveEnergy, roomHealthy } from "./common";

export const JuiceExtensions: Goal = {
  preconditions: [
    room => (roomHealthy(room) ? hasActiveEnergy(room) : true),
    room =>
      room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      }).length > 0,
    function (room: Room): boolean {
      const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      });
      const liveWorkers = extensions.reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
      const liveNonIdleWorkers = extensions.reduce(
        (a, b) => a + getWorkersById(b.id, room).filter(w => w.memory.job != Job.Idle).length,
        0
      );
      return (
        (room.energyCapacityAvailable -
          300 -
          room.energyAvailable -
          room.find(FIND_MY_SPAWNS)[0].store.getUsedCapacity(RESOURCE_ENERGY)) /
          getJuicerBody(room).filter(part => part == CARRY).length >
        50
        //liveNonIdleWorkers < Math.ceil((room.energyCapacityAvailable - room.energyAvailable) / 200)
      );
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_EXTENSION
    });

    const nonEmptyIdleExtensions = extensions.filter(
      ext => ext.store.getFreeCapacity(RESOURCE_ENERGY) !== 0 && getWorkersById(ext.id, room).length === 0
    );

    const target = nonEmptyIdleExtensions[0] ?? extensions[0];

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
