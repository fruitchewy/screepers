import { Job } from "Job";
import { CreepManagement } from "../director";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];
  if (tryEnergyDropOff(creep, target) == ERR_FULL || !target || !source) {
    console.log("Deassigning " + creep.name);
    creep.memory.owner = creep.id;
    creep.memory.job = Job.Idle;
    return;
  }
  if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 ||
    (tryHarvest(creep, source) === 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
  ) {
    moveToHarvest(creep, source, room);
  } else {
    moveToDropEnergy(creep, target);
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
    //creep.moveTo(target.pos);
    creep.travelTo(target.pos);
  }
}
