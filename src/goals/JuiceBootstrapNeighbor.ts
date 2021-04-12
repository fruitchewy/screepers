import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById, hasActiveEnergy, roomHealthy } from "./common";

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
          room2.controller &&
          room2.controller.my &&
          getWorkersById(room2.controller!.id, room).length < 2 &&
          room.energyCapacityAvailable >= 700 &&
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
        return []
      }
      const workers = getWorkersById(room2.controller!.id, room).length;
      const body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
      for (let i = 0; i < 2 - workers; i++) {
        assignments.push({
          job: Job.Harvester,
          body: getJuicerBody(room),
          memory: {
            job: Job.Harvester,
            source: getJuicerSource(room)!,
            target: room2.find(FIND_MY_SPAWNS)[0].pos,
            owner: room2.find(FIND_MY_SPAWNS)[0].id,
            stuckTicks: 0
          }
        });
      }
    }

    return assignments;
  },
  priority: 7
};
