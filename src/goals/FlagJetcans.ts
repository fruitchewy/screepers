import { Traveler } from "utils/Traveler";

export const FlagJetcans: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return (!room.memory.cans || room.memory.cans.length < 1) && jetcanReady(room);
    }
  ],
  getConstructionSites(room: Room): BuildRequest[] {
    room.memory.cans = [];
    room
      .find(FIND_STRUCTURES, { filter: struct => <StructureConstant>struct.structureType === STRUCTURE_CONTAINER })
      .map(a => a.pos)
      .forEach(p => room.memory.cans?.push(p));

    return [];
  },
  priority: 0
};

function jetcanReady(room: Room): boolean {
  return (
    room.find(FIND_STRUCTURES, { filter: struct => <StructureConstant>struct.structureType === STRUCTURE_CONTAINER })
      .length >= room.find(FIND_SOURCES).length
  );
}
