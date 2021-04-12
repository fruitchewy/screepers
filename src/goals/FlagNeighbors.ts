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
    let known: string[] = [] as string[];
    let unknown: string[] = [] as string[];

    for (const roomName of Object.values(exits)) {
      if (Game.rooms[roomName!] != undefined) {
        known.push(roomName!);
      } else {
        unknown.push(roomName!);
      }
    }
    room.memory.knownNeighbors = known;
    room.memory.unknownNeighbors = unknown;
    return [];
  },
  priority: 0
};
