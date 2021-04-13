import { Job } from "Job";
import { getWorkersById, hasActiveEnergy } from "./common";

export const ExploreNeighbors: Goal = {
  preconditions: [
    hasActiveEnergy,
    room =>
      room.memory.unknownNeighbors != undefined &&
      room.memory.unknownNeighbors.length > (room.memory.knownNeighbors ?? []).length &&
      room
        .find(FIND_MY_CREEPS)
        .filter(c => c.memory.job == Job.Conqueror && c.memory.target.roomName != room.name)
        .length < room.memory.unknownNeighbors.length
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const targets: RoomPosition[] = [];
    for (const roomName of room.memory.unknownNeighbors!) {
      if (
        !room.memory.knownNeighbors?.some(s => s === roomName) &&
        room.find(FIND_MY_CREEPS, {
          filter: c => c.memory.job == Job.Conqueror && c.memory.target.roomName == roomName
        }).length < 1 &&
        !(Game.rooms[roomName]?.find(FIND_MY_CREEPS).length > 0)
      ) {
        targets.push(new RoomPosition(25, 25, roomName));
      }
    }

    const body = [CLAIM, MOVE, MOVE, MOVE, MOVE];
    let assignments: Assignment[] = [];

    for (const target of targets) {
      return [
        {
          job: Job.Conqueror,
          body: body,
          memory: {
            job: Job.Conqueror,
            source: target,
            target: target,
            owner: <Id<any>>target.roomName,
            stuckTicks: 0
          }
        }
      ];
    }

    return [];
  },
  priority: 7
};
