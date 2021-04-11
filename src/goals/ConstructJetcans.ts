import { Traveler } from "utils/Traveler";
import { findEmptyNear } from "./common";

export const ConstructJetcans: Goal = {
  preconditions: [
    function (room: Room): boolean {
      if (
        room.find(FIND_MY_STRUCTURES, { filter: struct => struct.structureType === STRUCTURE_EXTENSION }).length >= 5
      ) {
        const sources = <Source[]>room.find(FIND_SOURCES);
        for (const source of sources) {
          if (
            source.pos.findInRange(FIND_STRUCTURES, 3, {
              filter: struct => <StructureConstant>struct.structureType == STRUCTURE_CONTAINER
            }).length == 0 &&
            source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3, {
              filter: struct => struct.structureType == STRUCTURE_CONTAINER
            }).length == 0
          ) {
            return true;
          }
        }
      }
      return false;
    }
  ],
  getConstructionSites(room: Room): BuildRequest[] {
    let sites: BuildRequest[] = [];

    const locales = room.find(FIND_SOURCES).filter(
      source =>
        source.pos.findInRange(FIND_STRUCTURES, 3, {
          filter: struct => <StructureConstant>struct.structureType == STRUCTURE_CONTAINER
        }).length == 0 &&
        source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3, {
          filter: site => site.structureType == STRUCTURE_CONTAINER
        }).length == 0
    );
    for (const locale of locales) {
      const near = findEmptyNear(locale.pos, room);
      if (near) {
        sites.push({ pos: near, structureType: STRUCTURE_CONTAINER });
      }
    }

    return sites;
  },
  priority: 2
};
