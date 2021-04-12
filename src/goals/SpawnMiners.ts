import { Job } from "Job";
import { getMinerBody, getWorkersById } from "./common";

const MINERS_PER_CAN = 1;

export const SpawnMiners: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return (
        room.memory.cans != undefined &&
        room.memory.cans.every(
          pos =>
            getWorkersById(
              room.find(FIND_STRUCTURES, {
                filter: struct =>
                  struct.pos.x == pos.x && struct.pos.y == pos.y && struct.structureType === STRUCTURE_CONTAINER
              })[0].id,
              room
            ).length > 0
        ) &&
        room.energyCapacityAvailable >= 550
      );
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    let assignments: Assignment[] = [];
    for (const canPos of room.memory.cans!) {
      const can = room.find(FIND_STRUCTURES, {
        filter: struct =>
          struct.pos.x == canPos.x && struct.pos.y == canPos.y && struct.structureType === STRUCTURE_CONTAINER
      })[0];

      const source = can.pos.findClosestByRange(FIND_SOURCES)!.pos;

      if (getWorkersById(can.id, room).filter(worker => worker.memory.job === Job.Miner).length < MINERS_PER_CAN)
        assignments.push({
          job: Job.Miner,
          body: getMinerBody(room),
          memory: {
            job: Job.Miner,
            source: source,
            target: canPos,
            owner: can.id,
            stuckTicks: 0
          }
        });
    }
    return assignments;
  },
  priority: 3
};
