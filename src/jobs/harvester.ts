import { getEnergySink, getJuicerSource } from "goals/common";
import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];
  if (room.name != creep.memory.target.roomName) {
    creep.travelTo(Game.getObjectById(creep.memory.owner));
    return;
  }
  let source: Source | StructureContainer;
  source =
    room.find(FIND_STRUCTURES, {
      filter: s =>
        creep.memory.source.x == s.pos.x && creep.memory.source.y == s.pos.y && s.structureType === STRUCTURE_CONTAINER
    }).length === 1
      ? <StructureContainer>room.find(FIND_STRUCTURES, {
          filter: s =>
            creep.memory.source.x == s.pos.x &&
            creep.memory.source.y == s.pos.y &&
            s.structureType === STRUCTURE_CONTAINER
        })[0]
      : <Source>room.find(FIND_SOURCES, {
          filter: s => creep.memory.source.x == s.pos.x && creep.memory.source.y == s.pos.y
        })[0];
  const can = room.lookForAt(LOOK_STRUCTURES, creep.memory.source.x, creep.memory.source.y)[0];

  if (creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).length > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.pickup(creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0]);
    return;
  }

  const drop = tryEnergyDropOff(creep, target);
  if (drop === ERR_INVALID_TARGET || drop === ERR_NOT_OWNER) {
    console.log("Deassigning [" + drop + "]: " + creep.name + " -> " + JSON.stringify(creep.memory.target));
    creep.memory.owner = creep.id;
    creep.memory.job = Job.Idle;
    return;
  } else if (drop === ERR_FULL) {
    const target = getEnergySink(room, creep.pos);
    if (target) {
      creep.memory.owner = target.id;
      creep.memory.target = target.pos;
    } else {
      console.log("Deassigning [" + drop + "]: " + creep.name + " -> " + JSON.stringify(creep.memory.target));
      creep.memory.owner = creep.id;
      creep.memory.job = Job.Idle;
    }
  }
  if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) < 10 ||
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
        source.store.getUsedCapacity(RESOURCE_ENERGY) <= 100
      ) {
        return;
      }
      creep.travelTo(source.pos);
      break;
    case ERR_INVALID_TARGET:
      creep.memory.source = room.find(FIND_SOURCES_ACTIVE)[0].pos;
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.memory.source = getJuicerSource(room)!;
      break;
    default:
  }
}

function tryEnergyDropOff(creep: Creep, target: Structure): number {
  if (target.structureType === STRUCTURE_CONTROLLER) {
    return creep.upgradeController(<StructureController>target);
  } else {
    return creep.transfer(target, RESOURCE_ENERGY);
  }
}

function moveToDropEnergy(creep: Creep, target: Structure): void {
  if (tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    //creep.moveTo(target.pos);
    creep.travelTo(target.pos);
  } else if (tryEnergyDropOff(creep, target) === 0 && creep.pos.getRangeTo(target) == 1) {
    creep.travelTo(target.pos);
  }
}
