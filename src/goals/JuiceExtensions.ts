import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById, hasActiveEnergy, roomHealthy } from "./common";

export const JuiceExtensions: Goal = {
  preconditions: [
    hasActiveEnergy,
    room =>
      room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      }).length > 0,
    function (room: Room): boolean {
      const extensions = <StructureExtension[]>room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      });
      const liveWorkers = extensions.reduce((a, ext) => a.concat(getWorkersById(ext.id, room)), <Creep[]>[]);
      const liveNonIdleWorkers = extensions.reduce(
        (a, b) => a + getWorkersById(b.id, room).filter(w => w.memory.job != Job.Idle).length,
        0
      );
      return (
        extensions.reduce((a, ext) => a + ext.store.getFreeCapacity(RESOURCE_ENERGY), 0) >
          liveWorkers.reduce((a, creep) => a + creep.body.filter(p => p.type == CARRY).length, 0) *
            CARRY_CAPACITY *
            1.5 &&
        (liveWorkers.reduce((a, creep) => a + creep.body.filter(p => p.type == CARRY).length, 0) * CARRY_CAPACITY) /
          40 <
          (room.find(FIND_SOURCES).length * SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME / 1.6
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
