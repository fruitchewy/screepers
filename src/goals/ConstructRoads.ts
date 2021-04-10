import { Traveler } from "utils/Traveler";

export const ConstructRoads: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const res =
        room.controller &&
        room.controller.my &&
        room.controller.level >= 2 &&
        room.find(FIND_MY_CONSTRUCTION_SITES).length < 5;
      return res ? res : false;
    }
  ],
  getConstructionSites(room: Room): BuildRequest[] {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    const source = room.find(FIND_SOURCES)[0];
    const controller = room.controller!;

    const path1 = findRoadPath(spawn.pos, source.pos, room);
    const path2 = findRoadPath(spawn.pos, controller.pos, room);
    let sites: BuildRequest[] = [];
    for (let pos of path1.path.concat(path2.path)) {
      if (
        room.lookForAt(LOOK_STRUCTURES, pos).filter(struct => struct.structureType === STRUCTURE_ROAD).length < 1 &&
        room.lookForAt(LOOK_CONSTRUCTION_SITES, pos).filter(site => site.structureType === STRUCTURE_ROAD).length < 1
      ) {
        sites.push({ pos: pos, structureType: STRUCTURE_ROAD });
      }
    }

    return sites;
  },
  priority: 3
};

function findRoadPath(pos1: RoomPosition, pos2: RoomPosition, room: Room): PathfinderReturn {
  return Traveler.Traveler.findTravelPath(pos1, pos2, {
    roomCallback: function (roomName: string, matrix: CostMatrix): CostMatrix {
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          if (
            room.getTerrain().get(x, y) != TERRAIN_MASK_WALL &&
            room.lookForAt(LOOK_STRUCTURES, x, y).filter(struct => struct.structureType != STRUCTURE_ROAD).length === 0
          ) {
            matrix.set(x, y, 10);
          }

          if (
            room.lookForAt(LOOK_STRUCTURES, x, y).filter(struct => struct.structureType === STRUCTURE_ROAD).length ===
              1 ||
            room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).filter(site => site.structureType === STRUCTURE_ROAD)
              .length === 1
          ) {
            matrix.set(x, y, -1);
          }
        }
      }
      return matrix;
    },
    ignoreCreeps: true
  });
}
