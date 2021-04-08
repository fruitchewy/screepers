import { CreepManagement } from "../director";

// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.memory.target.x, creep.memory.target.y)[0];
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];
  if (!target) {
      creep.memory.job = CreepManagement.Job.Idle;
      return;
  }
  if (creep.store.getFreeCapacity() === 0 || tryBuild(creep, target) === 0) {
    moveToBuild(creep, target);
  } else if (creep.store.getUsedCapacity() === 0 || tryHarvest(creep, source) === ERR_NOT_ENOUGH_ENERGY) {
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

function tryBuild(creep: Creep, target: ConstructionSite): number {
  return creep.build(target);
}

function moveToBuild(creep: Creep, target: ConstructionSite): void {
  if (tryBuild(creep, target) === ERR_NOT_IN_RANGE) {
    creep.moveTo(target.pos);
  }
}
