import { ErrorMapper } from "utils/ErrorMapper";
import { CreepManagement } from "./director";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  for (const room in Game.rooms) {
    const roomDirector = new CreepManagement.Director(Game.rooms[room]);
    roomDirector.run();
  }
});

declare global {
  interface CreepMemory {
    job: CreepManagement.Job;
    source: RoomPosition;
    target: RoomPosition;
    remaining?: number;
    owner: Id<StructureController> | Id<StructureSpawn> | Id<ConstructionSite>;
  }
}
