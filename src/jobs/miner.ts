import { Job } from "Job";
// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  const target = <StructureContainer>(
    room
      .lookForAt(LOOK_STRUCTURES, creep.memory.target.x, creep.memory.target.y)
      .filter(struct => struct.structureType === STRUCTURE_CONTAINER)[0]
  );
  const source = room.lookForAt(LOOK_SOURCES, creep.memory.source.x, creep.memory.source.y)[0];
  if (target && target.pos.getRangeTo(creep) <= 2) {
    let creeps = room.lookForAt(LOOK_CREEPS, target.pos);
    if (creeps.filter(creep => creep.memory.job != Job.Miner).length > 0) {
      const path = room.findPath(creep.pos, target.pos, { ignoreCreeps: true });
      for (const pos of path) {
        if (room.lookForAt(LOOK_CREEPS, pos.x, pos.y).length > 0) {
          const creep = room.lookForAt(LOOK_CREEPS, pos.x, pos.y)[0];
          console.log("suiciding " + creep.name + " for miner clearance");
          creep.suicide();
        }
      }
      return;
    } else if (creeps.filter(c => c.memory.job == Job.Miner).length > 0 && target.pos.getRangeTo(creep) > 1) {
      console.log("miner reposition a " + creep.moveTo(target.pos));
      return;
    } else if (target.pos.getRangeTo(creep) > 0) {
      console.log("miner reposition b " + creep.moveTo(target.pos, { range: 0 }));
      return;
    }
  }

  if (target && target.hitsMax - target.hits > 1000 && target.pos.getRangeTo(creep) < 2) {
    creep.repair(target);
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < 5) {
    moveToDropEnergy(creep, target);
    return;
  }
  if (tryHarvest(creep, source) === ERR_NOT_IN_RANGE) {
    moveToHarvest(creep, source, room);
    return;
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
