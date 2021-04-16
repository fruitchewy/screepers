import { Job } from "Job";
import { max, min } from "lodash";
import { getBuilderBody, getJuicerSource, getWorkersById, hasActiveEnergy } from "./common";

export const BuilderSites: Goal = {
  preconditions: [
    hasActiveEnergy,
    function (room: Room): boolean {
      let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
      const builders = sites.reduce((a, b) => a + getWorkersById(b.id, b.room!).length, 0);
      return sites.length > 0 && builders < 3;
    }
  ],
  getCreepAssignments(room: Room): Assignment[] {
    let sites = room
      .find(FIND_MY_CONSTRUCTION_SITES)
      .sort((a, b) => b.progress / b.progressTotal - a.progress / a.progressTotal);

    if (sites.filter(site => site.structureType != STRUCTURE_ROAD).length > 0) {
      sites = sites.filter(site => site.structureType != STRUCTURE_ROAD);
    }

    let assignments: Assignment[] = [];

    for (const site of sites) {
      if (getWorkersById(site.id, room).length === 4) continue;
      return [
        {
          job: Job.Builder,
          body: getBuilderBody(room),
          memory: {
            job: Job.Builder,
            source: getJuicerSource(room)!,
            target: site.pos,
            owner: site.id,
            stuckTicks: 0
          }
        }
      ];
    }

    return [];
  },
  priority: 5
};
