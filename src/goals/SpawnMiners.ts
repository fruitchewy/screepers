import { Job } from "Job";
import { getWorkersById } from "./common";

export const SpawnMiners: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return (
        room.memory.cans != undefined &&
        room.memory.cans.length >
          room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job === Job.Miner && creep.ticksToLive! >= 200 })
            .length &&
        room.energyCapacityAvailable >= 550
      );
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const body = [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
    let assignments: Assignment[] = [];

    for (const canPos of room.memory.cans!) {
      const can = room.find(FIND_STRUCTURES, {
        filter: struct => struct.pos.x == canPos.x && struct.pos.y == canPos.y
      })[0];

      const source = room.find(FIND_SOURCES).sort((a, b) => a.pos.getRangeTo(canPos) - b.pos.getRangeTo(canPos))[0];
      assignments.push({
        job: Job.Miner,
        body: body,
        memory: {
          job: Job.Miner,
          source: source.pos,
          target: canPos,
          owner: can.id
        }
      });
    }
    return assignments;
  },
  priority: 4
};
