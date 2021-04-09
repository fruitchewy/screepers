import { CreepManagement } from "director";
import { Job } from "Job";

// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];
  let target: ConstructionSite | Structure;
  // Ensure we have either a construction site or a damaged structure
  target = room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.memory.target.x, creep.memory.target.y)[0]
    ? room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.memory.target.x, creep.memory.target.y)[0]
    : room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];
  if ((target && target instanceof Structure && target.hits === target.hitsMax) || !source) {
    creep.memory.owner = creep.id;
    creep.memory.job = Job.Idle;
    return;
  } else {
    creep.say(target.pos.x + "," + target.pos.y);
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 || tryBuild(creep, target) === 0) {
    moveToBuild(creep, target);
  } else if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 ||
    tryBuild(creep, target) === ERR_NOT_ENOUGH_ENERGY ||
    tryHarvest(creep, source) === 0
  ) {
    moveToHarvest(creep, source);
  } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    moveToBuild(creep, target);
  }
}

function tryHarvest(creep: Creep, source: Source): number {
  return creep.harvest(source);
}

function moveToHarvest(creep: Creep, source: Source): void {
  if (tryHarvest(creep, source) === ERR_NOT_IN_RANGE) {
    creep.travelTo(source.pos);
  }
}

function tryBuild(creep: Creep, target: ConstructionSite | Structure): number {
  if (target instanceof Structure) {
    return creep.repair(target);
  } else {
    return creep.build(target);
  }
}

function moveToBuild(creep: Creep, target: ConstructionSite | Structure): void {
  if (tryBuild(creep, target) === ERR_NOT_IN_RANGE) {
    creep.travelTo(target.pos);
  }
}
