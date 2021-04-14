import { Job } from "Job";
import {
  getBuilderBody,
  getJuicerBody,
  getJuicerSource,
  getWorkersById,
  hasActiveEnergy,
  roomHealthy
} from "./common";

export const JuiceController: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const controller = room.controller;
      if (!controller || !controller.my || room.find(FIND_MY_SPAWNS).length == 0) {
        return false;
      }
      const liveWorkers = getWorkersById(controller?.id, room);
      if (liveWorkers.filter(creep => creep.memory.job != Job.Idle).length < 1) {
        return true;
      }
      const juicerCargoAvgPct =
        liveWorkers
          .map(
            creep =>
              (creep.store.getUsedCapacity(RESOURCE_ENERGY) /
                creep.store.getCapacity(RESOURCE_ENERGY)) *
              100
          )
          .reduce((a, b) => a + b) / liveWorkers.length;
      const pctEmptyJuicers =
        (liveWorkers.filter(
          creep =>
            creep.store.getUsedCapacity(RESOURCE_ENERGY) /
              creep.store.getCapacity(RESOURCE_ENERGY) <
            0.2
        ).length /
          liveWorkers.length) *
        100;
      if (
        liveWorkers.length < Math.ceil(controller.level ** 1.2) &&
        roomHealthy(room) &&
        hasActiveEnergy(room)
      ) {
        if (liveWorkers.length == 0) {
          return true;
        } else
          return (
            roomHealthy(room) &&
            pctEmptyJuicers < 10 &&
            (juicerCargoAvgPct != 0 ? juicerCargoAvgPct : 66) > 65
          );
      }
      return false;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const controller = room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType === STRUCTURE_CONTROLLER
    })[0];
    const source = getJuicerSource(room);
    if (source) {
      const assignment: Assignment = {
        job: Job.Harvester,
        body: getJuicerBody(room).concat(
          getJuicerBody(room).find(p => p == WORK)
            ? []
            : Array(Math.ceil(((room.energyCapacityAvailable - 300) / 400) * 0.75)).fill(WORK)
        ),
        memory: {
          job: Job.Harvester,
          source: source,
          target: controller.pos,
          owner: controller.id,
          stuckTicks: 0
        }
      };
      return [assignment];
    }
    return [];
  },
  priority: 6
};
