import { Traveler } from "utils/Traveler";
import { roomHealthy } from "./common";

export const FlagNeighbors: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return room.controller != undefined && room.controller!.level > 4;
    }
  ],
  getConstructionSites(room: Room): BuildRequest[] {
    const exits = Game.map.describeExits(room.name);
    let known = room.memory.knownNeighbors ?? [];
    let unknown = room.memory.unknownNeighbors ?? [];

    for (const roomName of Object.values(exits)) {
      if (Game.rooms[roomName!] != undefined) {
        if (!known.some(s => s === roomName)) known.push(roomName!);
      }
      if (!unknown.some(s => s === roomName)) unknown.push(roomName!);
    }
    room.memory.knownNeighbors = known;
    room.memory.unknownNeighbors = unknown;
    return [];
  },
  priority: 0
};
