import { Job } from "Job";

export function getWorkersById(id: Id<any>, room: Room): Creep[] {
  return room.find(FIND_CREEPS, { filter: creep => creep?.memory?.owner === id });
}

export function getJuicerBody(room: Room): BodyPartConstant[] {
  let body: BodyPartConstant[] = [WORK, CARRY, CARRY, MOVE, MOVE];
  if (room.memory.cans && room.memory.cans.length > 0) {
    const cans: StructureContainer[] = <StructureContainer[]>(
      room.find(FIND_STRUCTURES, { filter: struct => struct.structureType == STRUCTURE_CONTAINER })
    );
    if (getWorkersById(cans[0].id, room).length > 0) {
      body = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE];
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
    if (getWorkersById(cans[0].id, room).length > 0) {
      body = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
    }
  }
  return body;
}

export function getJuicerSource(room: Room): RoomPosition | undefined {
  if (room.find(FIND_SOURCES).length < 1) return undefined;
  if (room.memory.cans && room.memory.cans.length > 0) {
    const cans: StructureContainer[] = <StructureContainer[]>room.find(FIND_STRUCTURES, {
      filter: struct => struct.structureType == STRUCTURE_CONTAINER && getWorkersById(struct.id, room).length > 0
    });
    if (cans.length > 0) {
      const sorted = cans.sort(
        (a, b) => a.pos.findInRange(FIND_MY_CREEPS, 3).length - b.pos.findInRange(FIND_MY_CREEPS, 3).length
      );
      return sorted[0].pos;
    }
  }
  return room
    .find(FIND_SOURCES)
    .sort((a, b) => a.pos.findInRange(FIND_MY_CREEPS, 5).length - b.pos.findInRange(FIND_MY_CREEPS, 5).length)[0].pos;
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
    const y = pos.y + offset[0];
    if (
      room.getTerrain().get(x, y) != TERRAIN_MASK_WALL &&
      room.lookForAt(LOOK_STRUCTURES, x, y).length == 0 &&
      room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length == 0
    ) {
      return new RoomPosition(x, y, room.name);
    }
  }
  console.log("Failed to find free site near: " + pos.x + "," + pos.y);
  return;
}
