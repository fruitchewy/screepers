import { Job } from "Job";
import { has } from "lodash";
import {
  creepBodyCost,
  getBuilderBody,
  getJuicerBody,
  getJuicerSource,
  getWorkersById,
  hasActiveEnergy,
  roomHealthy
} from "./common";

export const JuiceController: Goal = {
  preconditions: [
    room => (roomHealthy(room) ? hasActiveEnergy(room) : true),
    function (room: Room): boolean {
      const controller = room.controller;
      if (!controller || !controller.my || room.find(FIND_MY_SPAWNS).length == 0) {
        return false;
      }
      const liveWorkers = getWorkersById(controller?.id, room);
      if (liveWorkers.filter(creep => creep.memory.job != Job.Idle).length < 1) {
        return true;
      }
      /*const juicerCargoAvgPct =
        liveWorkers
          .map(creep => (creep.store.getUsedCapacity(RESOURCE_ENERGY) / creep.store.getCapacity(RESOURCE_ENERGY)) * 100)
          .reduce((a, b) => a + b) / liveWorkers.length;
      const pctEmptyJuicers =
        (liveWorkers.filter(
          creep => creep.store.getUsedCapacity(RESOURCE_ENERGY) / creep.store.getCapacity(RESOURCE_ENERGY) < 0.2
        ).length /
          liveWorkers.length) *
        100;*/
      const sources = room.find(FIND_SOURCES).length;
      const liveCreepsWithWorks = room.find(FIND_MY_CREEPS, {
        filter: creep =>
          creep.body.some(part => part.type == WORK) &&
          creep.memory.job != Job.Miner &&
          creep.memory.job != Job.Idle &&
          room.findPath(creep.pos, creep.memory.target).length < 12
      });
      const workParts = liveCreepsWithWorks.reduce((a, b) => a + b.body.filter(p => p.type === WORK).length, 0);

      console.log(room.name, workParts);

      const maxparts = (sources * SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME / HARVEST_POWER;

      if (liveWorkers.length < Math.ceil(controller.level ** 1.2) && roomHealthy(room) && hasActiveEnergy(room)) {
        if (liveWorkers.length == 0) {
          return true;
        }
        //return roomHealthy(room) && pctEmptyJuicers < 10 && (juicerCargoAvgPct != 0 ? juicerCargoAvgPct : 66) > 65;
        else
          return (
            roomHealthy(room) &&
            workParts + 1 <= maxparts &&
            liveWorkers.reduce((a, b) => a + b.body.filter(p => p.type === WORK).length, 0) < maxparts * 1.5
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
      const liveCreepsWithWorks = room.find(FIND_MY_CREEPS, {
        filter: creep =>
          creep.body.some(part => part.type == WORK) &&
          creep.memory.job != Job.Miner &&
          creep.memory.job != Job.Idle &&
          room.findPath(creep.pos, creep.memory.target).length < 5
      });
      const workParts = liveCreepsWithWorks.reduce(
        (a, b) => a + b.body.reduce((c, d) => c + (d.type === WORK ? 1 : 0), 0),
        0
      );
      const assignment: Assignment = {
        job: Job.Harvester,
        body: getJuicerBody(room).concat(
          getJuicerBody(room).find(p => p == WORK)
            ? []
            : Array(
                Math.min(
                  (room.find(FIND_SOURCES).length * SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME / HARVEST_POWER -
                    workParts,
                  (room.energyCapacityAvailable - creepBodyCost(getJuicerBody(room))) / 100
                )
              ).fill(WORK) ?? []
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
