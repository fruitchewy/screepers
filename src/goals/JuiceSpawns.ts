import { Job } from "Job";
import { getJuicerBody, getJuicerSource, getWorkersById, hasActiveEnergy, roomHealthy } from "./common";

export const JuiceSpawns: Goal = {
  preconditions: [
    room => room.controller != undefined && room.controller.my,
    room => (roomHealthy(room) ? hasActiveEnergy(room) : true),
    function (room: Room): boolean {
      const extensions = room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType == STRUCTURE_EXTENSION
      }).length;
      const spawns = room.find(FIND_MY_SPAWNS);
      const liveWorkers = spawns.reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
      const liveNonIdleWorkers = spawns.reduce(
        (a, b) => a + getWorkersById(b.id, room).filter(w => w.memory.job != Job.Idle).length,
        0
      );

      if (room.find(FIND_MY_SPAWNS).length < 1) {
        return false;
      }

      if (extensions === 0 && liveWorkers < 3) {
        return true;
      }

      if (liveNonIdleWorkers < 1 && spawns[0].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        return true;
      }
      if (liveWorkers < 1 && spawns[0].store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        return true;
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const spawn = room.find(FIND_MY_SPAWNS)[0];

    let source: RoomPosition;
    let body: BodyPartConstant[];

    const assignment: Assignment = {
      job: Job.Harvester,
      body: getJuicerBody(room),
      memory: {
        job: Job.Harvester,
        source: getJuicerSource(room)!,
        target: spawn.pos,
        owner: spawn.id,
        stuckTicks: 0
      }
    };
    return [assignment];
  },
  priority: 2
};
