import { RoomManagement } from "RoomManagement";
import { Job } from "Job";
import { EnergySourceStructure, getJuicerSource, isEnergySourceStructure } from "goals/common";

// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  let source: Source | StructureContainer;
  source = <StructureContainer>room.find(FIND_STRUCTURES, {
      filter: s =>
        creep.memory.source.x == s.pos.x && creep.memory.source.y == s.pos.y && s.structureType === STRUCTURE_CONTAINER
    })[0] ?? <Source>room.find(FIND_SOURCES, {
      filter: s => creep.memory.source.x == s.pos.x && creep.memory.source.y == s.pos.y
    })[0];
  let target: ConstructionSite | Structure | null;
  // Ensure we have either a construction site or a damaged structure
  target = room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.memory.target.x, creep.memory.target.y)[0]
    ? room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.memory.target.x, creep.memory.target.y)[0]
    : room.lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)[0];

  if (room.name != creep.memory.target.roomName) {
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      moveToHarvest(creep, source, room);
      return;
    }
    creep.moveTo(new RoomPosition(25, 25, creep.memory.target.roomName));
    return;
  } else if (room.name != creep.memory.source.roomName) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) != 0 && target instanceof ConstructionSite) {
      moveToBuild(creep, target);
      return;
    } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0)
      creep.moveTo(new RoomPosition(0, 0, creep.memory.source.roomName));
  }

  if (
    !target ||
    (!(Game.getObjectById(target.id) instanceof ConstructionSite) &&
      (<Structure<StructureConstant>>target).hits === (<Structure<StructureConstant>>target).hitsMax)
  ) {
    target =
      creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES) ??
      creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: struct => struct.hitsMax - struct.hits > 99 && struct.hits < 100000
      });
    if (!target) {
      console.log("failed to retarget builder " + creep.name);
      creep.memory.owner = creep.id;
      creep.memory.job = Job.Idle;
      return;
    } else {
      creep.memory.owner = target.id;
      creep.memory.target = target.pos;
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

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 || tryBuild(creep, target) === 0) {
    moveToBuild(creep, target);
  } else if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 ||
    tryBuild(creep, target) === ERR_NOT_ENOUGH_ENERGY ||
    tryHarvest(creep, source) === 0
  ) {
    moveToHarvest(creep, source, room);
  } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    moveToBuild(creep, target);
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
        creep.memory.stuckTicks++;
        if (creep.memory.stuckTicks > 15) {
          creep.makeIdle(true);
        }
        return;
      }
      creep.travelTo(source.pos);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.memory.stuckTicks++;
      if (creep.memory.stuckTicks > 15) {
        creep.makeIdle(true);
      }
      break;
    case ERR_INVALID_TARGET:
      creep.memory.source = room.find(FIND_SOURCES_ACTIVE)[0].pos;
      break;
    default:
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
