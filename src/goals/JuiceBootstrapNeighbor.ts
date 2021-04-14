import { Job } from "Job";
import {
  getJuicerBody,
  getJuicerSource,
  getWorkersById,
  hasActiveEnergy,
  roomHealthy
} from "./common";

export const JuiceBootstrapNeighbor: Goal = {
  preconditions: [
    hasActiveEnergy,
    room => {
      if (!room.memory.knownNeighbors) {
        return false;
      }
      for (const neighbor of room.memory.knownNeighbors) {
        const room2 = Game.rooms[neighbor];
        if (
          room2 &&
          room2.controller &&
          room2.controller.my &&
          room2.controller.level < 3 &&
          room2.find(FIND_MY_SPAWNS).length > 0
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
      if (room2 == undefined || room2.controller == undefined) {
        continue;
      }
      const controllerWorkers =
        getWorkersById(room2.controller!.id, room2).length +
        getWorkersById(room2.controller!.id, room).length;
      const body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
      for (let i = 0; i < 2 - controllerWorkers; i++) {
        assignments.push({
          job: Job.Harvester,
          body: getJuicerBody(room).concat([WORK, WORK]),
          memory: {
            job: Job.Harvester,
            source: getJuicerSource(room)!,
            target: room2.controller!.pos,
            owner: room2.controller!.id,
            stuckTicks: 0
          }
        });
      }
    }

    return assignments;
  },
  priority: 6
};
