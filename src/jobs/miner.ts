import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = <StructureContainer>(
    room
      .lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)
      .filter(struct => struct.structureType === STRUCTURE_CONTAINER)[0]
  );
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];

  if (target && target.hitsMax - target.hits > 1000) {
    creep.repair(target);
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < 5) {
    moveToDropEnergy(creep, target);
  }
  if (tryHarvest(creep, source) === ERR_NOT_IN_RANGE) {
    moveToHarvest(creep, source, room);
  }
}

function tryHarvest(creep: Creep, source: Source): number {
  return creep.harvest(source);
}

function moveToHarvest(creep: Creep, source: Source, room: Room): void {
  if (tryHarvest(creep, source) === ERR_NOT_IN_RANGE && source.pos) {
    creep.travelTo(source.pos);
  }
}

function tryEnergyDropOff(creep: Creep, target: Structure): number {
  return creep.transfer(target, RESOURCE_ENERGY);
}

function moveToDropEnergy(creep: Creep, target: Structure): void {
  if (tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    creep.travelTo(target);
  } else if (tryEnergyDropOff(creep, target) === 0 && creep.pos.getRangeTo(target) > 0) {
    creep.travelTo(target);
  }
}
