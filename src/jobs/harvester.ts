import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];
  if (room.name != creep.memory.target.roomName) {
    console.log(room.name + "+" + creep.memory.target.roomName);
    creep.travelTo(creep.memory.target);
    return;
  }
  let source: Source | StructureContainer;
  source =
    room.memory.cans && room.lookForAt(LOOK_STRUCTURES, creep.memory.source.x, creep.memory.source.y).length === 1
      ? <StructureContainer>room.lookForAt(LOOK_STRUCTURES, creep.memory.source.x, creep.memory.source.y)[0]
      : room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];
  const can = room.lookForAt(LOOK_STRUCTURES, creep.memory.source.x, creep.memory.source.y)[0];

  if (creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1).length > 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    creep.pickup(creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0]);
    return;
  }

  if (tryEnergyDropOff(creep, target) == ERR_FULL || !target || !source) {
    console.log("Deassigning " + creep.name);
    creep.memory.owner = creep.id;
    creep.memory.job = Job.Idle;
    return;
  }
  if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 ||
    (tryHarvest(creep, source) === 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 50)
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
      creep.travelTo(source);
      break;
    case ERR_INVALID_TARGET:
      creep.memory.source = room.find(FIND_SOURCES_ACTIVE)[0].pos;
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
  }
}
