// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];
  if (creep.store.getFreeCapacity() === 0 || tryEnergyDropOff(creep, target) === 0) {
    moveToDropEnergy(creep, target);
  } else if (creep.store.getUsedCapacity() === 0 || tryHarvest(creep, source) === -6) {
    moveToHarvest(creep, source);
  }
}

function tryHarvest(creep: Creep, source: Source): number {
  return creep.harvest(source);
}

function moveToHarvest(creep: Creep, source: Source): void {
  if (tryHarvest(creep, source) === ERR_NOT_IN_RANGE) {
    creep.moveTo(source.pos);
  }
}

function tryEnergyDropOff(creep: Creep, target: Structure): number {
  return creep.transfer(target, RESOURCE_ENERGY);
}

function moveToDropEnergy(creep: Creep, target: Structure): void {
  if (tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target.pos);
  }
}
