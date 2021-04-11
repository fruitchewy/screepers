import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceTowers: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const towers = <StructureTower[]>(
        room.find(FIND_MY_STRUCTURES, { filter: struct => struct.structureType === STRUCTURE_TOWER })
      );
      for (const tower of towers) {
        if (tower.store.getFreeCapacity(RESOURCE_ENERGY) > 200 && getWorkersById(tower.id, room).length < 2) {
          console.log("juicetowers");
          return true;
        }
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const towers = <StructureTower[]>(
      room.find(FIND_MY_STRUCTURES, { filter: struct => struct.structureType === STRUCTURE_TOWER })
    );
    let assignments: Assignment[] = [];
    for (const tower of towers) {
      if (tower.store.getFreeCapacity(RESOURCE_ENERGY) > 200 && getWorkersById(tower.id, room).length < 2) {
        assignments.push({
          job: Job.Harvester,
          body: getJuicerBody(room),
          memory: { job: Job.Harvester, source: getJuicerSource(room)!, target: tower.pos, owner: tower.id }
        });
      }
    }

    return assignments;
  },
  priority: 2
};
