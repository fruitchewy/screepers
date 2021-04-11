import { Job } from "Job";
import { getWorkersById } from "./common";

const MINERS_PER_CAN = 2;

export const SpawnMiners: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return (
        room.memory.cans != undefined &&
        room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job === Job.Miner }).length <
          MINERS_PER_CAN * room.find(FIND_SOURCES).length &&
        room.energyCapacityAvailable >= 550
      );
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const body = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
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
          body: body,
          memory: {
            job: Job.Miner,
            source: source,
            target: canPos,
            owner: can.id
          }
        });
    }
    return assignments;
  },
  priority: 3
};
