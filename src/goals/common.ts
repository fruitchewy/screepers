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

export function getJuicerSource(room: Room): RoomPosition {
  if (room.memory.cans && room.memory.cans.length > 0) {
    const cans: StructureContainer[] = <StructureContainer[]>(
      room.find(FIND_STRUCTURES, { filter: struct => struct.structureType == STRUCTURE_CONTAINER })
    );
    if (getWorkersById(cans[0].id, room).length > 0) {
      return cans[0].pos;
    }
  }
  return room.find(FIND_SOURCES)[0].pos;
}
