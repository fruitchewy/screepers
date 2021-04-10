import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById } from "./common";

export const JuiceSpawns: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const extensions = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      }).length;
      const liveWorkers = room.find(FIND_MY_SPAWNS).reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
      if (room.find(FIND_MY_SPAWNS).length < 1) {
        return false;
      }
      if (extensions === 0 && liveWorkers < 3) {
        return true;
      }

      if (liveWorkers < extensions / 5 + 2 && room.energyAvailable / room.energyCapacityAvailable < 100) {
        return true;
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const spawn = room.find(FIND_MY_SPAWNS)[0];

    let source: RoomPosition;
    let body: BodyPartConstant[];
    if (getWorkersById(spawn.id, room).length == 0) {
      return [
        {
          job: Job.Harvester,
          body: [WORK, CARRY, CARRY, MOVE, MOVE],
          memory: {
            job: Job.Harvester,
            source: room.find(FIND_SOURCES)[0].pos,
            target: spawn.pos,
            owner: spawn.id
          }
        }
      ];
    }

    const assignment: Assignment = {
      job: Job.Harvester,
      body: getJuicerBody(room),
      memory: {
        job: Job.Harvester,
        source: getJuicerSource(room),
        target: spawn.pos,
        owner: spawn.id
      }
    };
    return [assignment];
  },
  priority: 2
};
