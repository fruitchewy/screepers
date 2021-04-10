import { Job } from "Job";
import { getBuilderBody, getJuicerSource, getWorkersById } from "./common";

export const BuilderSites: Goal = {
  preconditions: [
    function (room: Room): boolean {
      const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
      const builders = sites.reduce((a, b) => a + getWorkersById(b.id, room).length, 0);
      return sites.length > 0 && (builders < 4 || room.energyAvailable / room.energyCapacityAvailable > 0.7);
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    const sites = room
      .find(FIND_MY_CONSTRUCTION_SITES)
      .sort((a, b) => b.progress / b.progressTotal - a.progress / a.progressTotal);
    const body = [WORK, CARRY, CARRY, MOVE, MOVE];
    let assignments: Assignment[] = [];

    for (const site of sites) {
      if (getWorkersById(site.id, room).length === 4) continue;
      return [
        {
          job: Job.Builder,
          body: getBuilderBody(room),
          memory: {
            job: Job.Builder,
            source: getJuicerSource(room),
            target: site.pos,
            owner: site.id
          }
        }
      ];
    }

    return [];
  },
  priority: 5
};
