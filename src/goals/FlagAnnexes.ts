import { Traveler } from "utils/Traveler";

export const FlagAnnexes: Goal = {
  preconditions: [
    function (room: Room): boolean {
      return room.controller?.my!;
    }
  ],
  getConstructionSites(room: Room): BuildRequest[] {
    return [];
  },
  priority: 0
};
