import { Job } from "Job";
import { max, min } from "lodash";
import { getBuilderBody, getJuicerSource, getWorkersById, hasActiveEnergy } from "./common";

export const BuilderNeighborSpawns: Goal = {
  preconditions: [
    hasActiveEnergy,
    room => {
      if (!room.memory.knownNeighbors || room.energyCapacityAvailable < 600) {
        return false;
      }
      for (const neighbor of room.memory.knownNeighbors) {
        const room2 = Game.rooms[neighbor];
        if (
          room2.controller &&
          room2.controller.my &&
          room2.controller.level == 1 &&
          room2.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType == STRUCTURE_SPAWN }).length > 0 &&
          getWorkersById(
            room2.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType == STRUCTURE_SPAWN })[0].id,
            room
          ).length < 2
        ) {
          return true;
        }
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    if (!room.memory.knownNeighbors) {
      return [];
    }
    let assignments: Assignment[] = [];

    for (const neighbor of room.memory.knownNeighbors) {
      const room2 = Game.rooms[neighbor];
      const site = room2.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType == STRUCTURE_SPAWN })[0];
      if (site == undefined) return [];
      const workers = getWorkersById(site.id, room2).length;
      const body = [WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
      for (let i = 0; i < 2 - workers; i++) {
        assignments.push({
          job: Job.Builder,
          body: body,
          memory: {
            job: Job.Builder,
            source: getJuicerSource(room)!,
            target: site.pos,
            owner: site.id,
            stuckTicks: 0
          }
        });
      }
    }

    return assignments;
  },
  priority: 7
};
