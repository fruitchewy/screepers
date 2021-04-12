import { Traveler } from "utils/Traveler";

export const ConstructRoads: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const res =
        room.controller &&
        room.controller.my &&
        room.controller.level >= 2 &&
        room.find(FIND_MY_CONSTRUCTION_SITES).length < 5 &&
        room.find(FIND_MY_SPAWNS).length > 0;
      return res ? res : false;
    }
  ],
  getConstructionSites(room: Room): BuildRequest[] {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    const sources = room
      .find(FIND_SOURCES)
      .map(a => a.pos)
      .sort((a, b) => a.getRangeTo(spawn) - b.getRangeTo(spawn));
    const extensions = room
      .find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_EXTENSION
      })
      .map(a => a.pos)
      .sort((a, b) => a.getRangeTo(spawn) - b.getRangeTo(spawn));
    const cans = room
      .find(FIND_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_CONTAINER
      })
      .map(a => a.pos)
      .sort((a, b) => a.getRangeTo(spawn) - b.getRangeTo(spawn));
    const controller = room.controller!;

    let path: RoomPosition[] = [];

    for (const source of sources.concat(cans)) {
      path = path.concat(findRoadPath(spawn.pos, source, room).path);
    }
    path = path.concat(findRoadPath(path[0], controller.pos, room).path);

    if (extensions) {
      path = path.concat(findRoadPath(path[0], extensions[0], room).path);
    }

    let sites: BuildRequest[] = [];
    for (let pos of path) {
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
