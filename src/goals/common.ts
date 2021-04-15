import { Job } from "Job";

export function getWorkersById(id: Id<any>, room: Room): Creep[] {
  return room.find(FIND_CREEPS, {
    filter: creep => creep?.memory?.owner === id && creep?.ticksToLive! > 100
  });
}

export function getJuicerBody(room: Room): BodyPartConstant[] {
  let body: BodyPartConstant[] = [WORK, CARRY, CARRY, MOVE, MOVE];
  const spawnWorkers = getWorkersById(room.find(FIND_MY_SPAWNS)[0]!.id ?? <Id<Structure>>"", room).length;
  const extWorkers = room
    .find(FIND_MY_STRUCTURES, { filter: struct => struct.structureType == STRUCTURE_EXTENSION })
    .reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
  if (room.memory.cans && room.memory.cans.length > 0 && roomHealthy(room)) {
    const cans: StructureContainer[] = <StructureContainer[]>room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_CONTAINER || struct.structureType == STRUCTURE_STORAGE
    });
    if (
      cans.some(can => getWorkersById(can.id, room).length > 0) ||
      (cans.some(can => can.store.getUsedCapacity(RESOURCE_ENERGY) > 1000) && spawnWorkers > 0 && extWorkers > 0)
    ) {
      body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
      for (let i = 0; i < _.min([3, (room.energyCapacityAvailable - 300) / 400]); i++) {
        body.push(CARRY, MOVE);
      }
    }
  }
  return body;
}

export function getBuilderBody(room: Room): BodyPartConstant[] {
  let body: BodyPartConstant[] = [WORK, CARRY, CARRY, MOVE, MOVE];
  if (room.memory.cans && room.memory.cans.length > 0) {
    const cans: StructureContainer[] = <StructureContainer[]>(
      room.find(FIND_STRUCTURES, { filter: struct => struct.structureType == STRUCTURE_CONTAINER })
    );
    console.log(room.name);
    if (getWorkersById(cans[0].id, room).length > 0) {
      body = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
      for (let i = 0; i < _.min([3, Math.floor((room.energyCapacityAvailable - 450) / 450)]); i++) {
        body.push(WORK, CARRY, MOVE);
      }
    }
  }
  return body;
}

export function getMinerBody(room: Room): BodyPartConstant[] {
  let body: BodyPartConstant[] = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
  const scalingCost = 100;
  for (let i = 0; i < Math.min(2, (room.energyCapacityAvailable - 550) / (2 * scalingCost)); i++) {
    body.push(WORK); //100ea
  }
  return body;
}

export function getJuicerSource(room: Room): RoomPosition | undefined {
  if (room.find(FIND_SOURCES).length < 1) return undefined;
  if (room.memory.cans && room.memory.cans.length > 0) {
    const cans: StructureContainer[] = <StructureContainer[]>room.find(FIND_STRUCTURES, {
      filter: struct =>
        struct.structureType == STRUCTURE_CONTAINER &&
        (getWorkersById(struct.id, room).length > 0 || struct.store.getUsedCapacity(RESOURCE_ENERGY) > 500)
    });
    if (cans.length > 0) {
      const sorted = cans.sort(
        (a, b) => a.pos.findInRange(FIND_MY_CREEPS, 3).length - b.pos.findInRange(FIND_MY_CREEPS, 3).length
      );
      return sorted[0].pos;
    }
  }
  return _.sample(room.find(FIND_SOURCES), 1)[0].pos;
}

export function findEmptyNear(pos: RoomPosition, room: Room): RoomPosition | undefined {
  const offsets: number[][] = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]
  ];
  for (const offset of offsets) {
    const x = pos.x + offset[0];
    const y = pos.y + offset[1];
    if (
      room.getTerrain().get(x, y) != TERRAIN_MASK_WALL &&
      room.lookForAt(LOOK_STRUCTURES, x, y).filter(s => s.structureType != STRUCTURE_ROAD).length == 0 &&
      room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length == 0
    ) {
      return new RoomPosition(x, y, room.name);
    }
  }
  console.log("Failed to find free site near: " + pos.x + "," + pos.y);
  return;
}

export function getEnergySink(room: Room, near?: RoomPosition): StructureSpawn | StructureExtension | undefined {
  if (near) {
    return <StructureExtension>near.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: struct =>
          struct.structureType == STRUCTURE_EXTENSION && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      }) ?? <StructureSpawn>near.findClosestByPath(FIND_MY_SPAWNS, { filter: struct => struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0 });
  }

  return <StructureExtension>room.find(FIND_MY_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_EXTENSION && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    })[0] ?? <StructureSpawn>room.find(FIND_MY_SPAWNS, { filter: struct => struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0 })[0];
}

export function hasActiveEnergy(room: Room): boolean {
  if (room.memory.cans) {
    return (
      (room.find(FIND_SOURCES_ACTIVE).length > 0 &&
        room.find(FIND_SOURCES_ACTIVE).every(
          source =>
            getWorkersById(
              room.find(FIND_STRUCTURES, {
                filter: s => isEnergySourceStructure(s) && source.pos.getRangeTo(s) < 2
              })[0]?.id,
              room
            ).length > 0
        )) ||
      room.find(FIND_STRUCTURES, {
        filter: struct =>
          (struct.structureType === STRUCTURE_CONTAINER || struct.structureType === STRUCTURE_STORAGE) &&
          (struct as EnergySourceStructure).store.getUsedCapacity(RESOURCE_ENERGY) > 1000
      }).length > 0
    );
  }
  return room.find(FIND_SOURCES_ACTIVE).length > 0;
}

export function roomHealthy(room: Room): boolean {
  const miners = room.find(FIND_MY_CREEPS, { filter: creep => creep.memory.job == Job.Miner }).length;
  const sources = room.find(FIND_SOURCES).length;
  const harvesters = room.find(FIND_MY_CREEPS, {
    filter: creep => creep.memory.job == Job.Harvester
  }).length;
  const spawns = room.find(FIND_MY_SPAWNS).length;

  if (spawns === 0) {
    return false;
  }

  if (miners < sources - 1) {
    return false;
  }

  if (harvesters == 0) {
    return false;
  }

  return true;
}

export type EnergySinkStructure = StructureSpawn | StructureExtension | StructureTower;
export function isEnergySinkStructure(target: AnyStructure): boolean {
  return (
    target.structureType == STRUCTURE_SPAWN ||
    target.structureType == STRUCTURE_EXTENSION ||
    target.structureType == STRUCTURE_TOWER
  );
}

export type EnergySourceStructure = StructureContainer | StructureStorage;
export function isEnergySourceStructure(target: AnyStructure): boolean {
  return target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE;
}
