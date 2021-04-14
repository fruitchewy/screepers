import { Job } from "Job";
import { max, min } from "lodash";
import {
  getBuilderBody,
  getJuicerBody,
  getJuicerSource,
  getWorkersById,
  hasActiveEnergy
} from "./common";

export const BuilderNeighborSites: Goal = {
  preconditions: [
    hasActiveEnergy,
    room => {
      if (!room.memory.knownNeighbors || room.energyCapacityAvailable < 600) {
        return false;
      }
      for (const neighbor of room.memory.knownNeighbors) {
        const room2 = Game.rooms[neighbor];
        if (
          room2 &&
          room2.controller &&
          room2.controller.my &&
          room2.controller.level == 1 &&
          room2.find(FIND_MY_CONSTRUCTION_SITES).length > 0 &&
          getWorkersById(room2.find(FIND_MY_CONSTRUCTION_SITES)[0].id, room).length +
            getWorkersById(room2.find(FIND_MY_CONSTRUCTION_SITES)[0].id, room2).length <
            2
        ) {
          return true;
        }
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    console.log(room.name);
    if (!room.memory.knownNeighbors) {
      return [];
    }
    let assignments: Assignment[] = [];

    for (const neighbor of room.memory.knownNeighbors) {
      const room2 = Game.rooms[neighbor];
      const site = room2?.find(FIND_MY_CONSTRUCTION_SITES)[0];
      if (site == undefined || room2 == undefined) continue;
      const workers = getWorkersById(site.id, room2).length + getWorkersById(site.id, room).length;
      const body = getJuicerBody(room).concat([MOVE, CARRY, WORK]);
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
