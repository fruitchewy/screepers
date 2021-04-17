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
    //room => (roomHealthy(room) ? hasActiveEnergy(room) : true),
    function (room: Room): boolean {
      const controller = room.controller;
      if (!controller || !controller.my || room.find(FIND_MY_SPAWNS).length == 0) {
        return false;
      }
      const liveWorkers = getWorkersById(controller?.id, room);
      if (liveWorkers.filter(creep => creep.memory.job != Job.Idle).length < 1) {
        return true;
      }

      const sources = room.find(FIND_SOURCES).length;
      const liveCreepsWithWorks = room
        .find(FIND_MY_CREEPS)
        .filter(
          creep =>
            creep.body.some(part => part.type === WORK) &&
            creep.memory.job !== Job.Miner &&
            creep.memory.job !== Job.Idle &&
            creep.memory.target != undefined &&
            new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName).getRangeTo(
              creep.pos
            ) < 6 &&
            (creep.memory.job === Job.Harvester
              ? room
                  .lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)
                  .filter(struct => struct.structureType === STRUCTURE_CONTROLLER).length > 0
              : true)
        );

      const workParts = liveCreepsWithWorks.reduce((a, b) => a + b.body.filter(p => p.type === WORK).length, 0);
      const addWorks =
        Math.min(
          (sources * SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME / HARVEST_POWER - workParts,
          1 + Math.floor((room.energyCapacityAvailable - creepBodyCost(getJuicerBody(room))) / 150)
        ) ?? 0;

      const maxparts = (sources * SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME / HARVEST_POWER;
      console.log(workParts, addWorks, maxparts);
      if (liveWorkers.length < Math.ceil(controller.level ** 1.2) && roomHealthy(room) && hasActiveEnergy(room)) {
        if (liveWorkers.length == 0) {
          return true;
        } else
          return (
            workParts + 2 <= maxparts &&
            liveWorkers.reduce((a, b) => a + b.body.filter(p => p.type === WORK).length, 0) < maxparts * 2 &&
            addWorks > 1
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
          room.findPath(creep.pos, creep.memory.target).length < 8 &&
          creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
      });
      const workParts = liveCreepsWithWorks.reduce(
        (a, b) => a + b.body.reduce((c, d) => c + (d.type === WORK ? 1 : 0), 0),
        0
      );
      const addWorks =
        Math.min(
          (room.find(FIND_SOURCES).length * SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME / HARVEST_POWER - workParts,
          Math.floor((room.energyCapacityAvailable - creepBodyCost(getJuicerBody(room))) / 150)
        ) ?? 0;
      let body = getJuicerBody(room);
      if (!body.some(p => p === WORK)) {
        if (addWorks < 2) {
          return [];
        }
        for (let i = 0; i < addWorks; i++) {
          body = body.concat([MOVE, WORK]);
        }
      }

      const assignment: Assignment = {
        job: Job.Harvester,
        body: body,
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
