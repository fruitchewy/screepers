import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];

  if (target.hitsMax - target.hits > 1000) {
    creep.repair(target);
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
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
    creep.travelTo(source);
  }
}

function tryEnergyDropOff(creep: Creep, target: Structure): number {
  return creep.transfer(target, RESOURCE_ENERGY);
}

function moveToDropEnergy(creep: Creep, target: Structure): void {
  if (tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    //creep.moveTo(target.pos);
    creep.travelTo(target.pos);
  }
}
