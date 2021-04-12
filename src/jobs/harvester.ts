import {
  getEnergySink,
  getJuicerSource,
  isEnergySourceStructure,
  isEnergySinkStructure,
  EnergySourceStructure,
  EnergySinkStructure,
  getWorkersById
} from "goals/common";
import { Job } from "Job";

export function run(creep: Creep, room: Room): void {
  const target = Game.rooms[creep.memory.target.roomName].find(FIND_STRUCTURES, {
    filter: target =>
      target.pos.x == creep.memory.target.x &&
      target.pos.y == creep.memory.target.y &&
      target.pos.roomName == creep.memory.target.roomName &&
      (isEnergySinkStructure(target) || target.structureType == STRUCTURE_CONTROLLER)
  })[0];

  const source =
    (Game.rooms[creep.memory.source.roomName].find(FIND_STRUCTURES, {
      filter: s =>
        creep.memory.source.x == s.pos.x && creep.memory.source.y == s.pos.y && s.structureType === STRUCTURE_CONTAINER
    })[0] as StructureContainer) ?? <Source>room.find(FIND_SOURCES, {
      filter: s => creep.memory.source.x == s.pos.x && creep.memory.source.y == s.pos.y
    })[0];

  if (source == undefined) {
    console.log("why is my source undefined again");
    creep.makeIdle(true);
  }

  //Pick up dropped resources
  if (
    creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2).length > 0 &&
    creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
    creep.pos.findPathTo(creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2)[0]).length < 4
  ) {
    creep.pickup(creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2)[0]);
    if (creep.pickup(creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2)[0]) == ERR_NOT_IN_RANGE) {
      creep.travelTo(creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2)[0]);
    }
    return;
  }

  //Check for bad targets, full targets
  const drop = tryEnergyDropOff(creep, target);
  if (drop === ERR_NOT_OWNER) {
    creep.makeIdle(true);
    return;
  } else if (
    drop === ERR_FULL ||
    (isEnergySinkStructure(target) && (<EnergySinkStructure>target).store.getFreeCapacity(RESOURCE_ENERGY) === 0)
  ) {
    const newTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s =>
        isEnergySinkStructure(s) &&
        (<EnergySinkStructure>s).store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
        getWorkersById(s.id, room).length === 0
    });

    if (newTarget) {
      creep.memory.owner = newTarget.id;
      creep.memory.target = newTarget.pos;
    } else {
      creep.makeIdle(false);
    }
  }

  //Check for empty sources and alternatives periodically
  if (
    Game.time % 10 == 0 &&
    isEnergySourceStructure(source) &&
    source.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getFreeCapacity(RESOURCE_ENERGY) &&
    room.find(FIND_STRUCTURES, {
      filter: s =>
        s.id != source.id &&
        isEnergySourceStructure(s) &&
        (<EnergySourceStructure>s).store.getUsedCapacity(RESOURCE_ENERGY) >
          (creep.pos.findPathTo(s).length / 1.5) * creep.store.getCapacity(RESOURCE_ENERGY)
    }).length > 0
  ) {
    creep.memory.source =
      creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s =>
          s.id != source.id &&
          isEnergySourceStructure(s) &&
          (<EnergySourceStructure>s).store.getUsedCapacity(RESOURCE_ENERGY) >
            (creep.pos.findPathTo(s).length / 1.5) * creep.store.getCapacity(RESOURCE_ENERGY)
      })?.pos ?? creep.memory.source;
  }

  if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) < 50 ||
    (tryHarvest(creep, source) === 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
  ) {
    moveToHarvest(creep, source, room);
  } else {
    moveToDropEnergy(creep, target);
  }
}

function tryHarvest(creep: Creep, source: Source | StructureContainer): number {
  if (source instanceof Source) {
    return creep.harvest(source);
  } else if (source instanceof StructureContainer) {
    return creep.withdraw(source, RESOURCE_ENERGY, creep.store.getFreeCapacity(RESOURCE_ENERGY));
  }
  return -10;
}

function moveToHarvest(creep: Creep, source: Source | StructureContainer, room: Room): void {
  switch (tryHarvest(creep, source)) {
    case ERR_NOT_IN_RANGE:
      if (
        creep.pos.getRangeTo(source) <= 4 &&
        source instanceof StructureContainer &&
        source.store.getUsedCapacity(RESOURCE_ENERGY) <= creep.store.getFreeCapacity(RESOURCE_ENERGY)
      ) {
        creep.memory.stuckTicks > 0;
        if (creep.memory.stuckTicks > 15) {
          creep.makeIdle(false);
        }
        return;
      }
      creep.travelTo(source.pos);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.memory.stuckTicks++;
      if (creep.memory.stuckTicks > 15) {
        creep.makeIdle(false);
      }
      break;
    case ERR_INVALID_TARGET:
      creep.memory.source = room.find(FIND_SOURCES_ACTIVE)[0].pos;
      break;
    default:
  }
}

function tryEnergyDropOff(creep: Creep, target: Structure): number {
  if (target?.structureType === STRUCTURE_CONTROLLER) {
    return creep.upgradeController(<StructureController>target);
  } else {
    return creep.transfer(target, RESOURCE_ENERGY);
  }
}

function moveToDropEnergy(creep: Creep, target: Structure): void {
  if (tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    creep.travelTo(target.pos);
  } else if (tryEnergyDropOff(creep, target) === 0 && creep.pos.getRangeTo(target) == 1) {
    creep.travelTo(target.pos);
  }
}
