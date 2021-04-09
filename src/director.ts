import * as harvester from "jobs/harvester";
import * as builder from "jobs/builder";
import { Job } from "Job";
import { JuiceController } from "goals/JuiceController";
import { JuiceExtensions } from "goals/JuiceExtensions";
import { JuiceSpawns } from "goals/JuiceSpawns";
import { BuildRepair } from "goals/BuildRepair";
import { BuildSites } from "goals/BuildSites";
import { JuiceControllerSurplus } from "goals/JuiceControllerSurplus";

export module CreepManagement {
  export class Director {
    room: Room;
    creeps: Creep[] = [];
    goals: Goal[] = [JuiceController, JuiceExtensions, JuiceSpawns, BuildRepair, BuildSites, JuiceControllerSurplus].sort(
      (a, b) => a.priority - b.priority
    );

    constructor(room: Room) {
      this.room = room;
    }

    run() {
      this.loadCreeps();
      const assignments = this.goals.reduce(
        (a, goal) =>
          a.concat(goal.preconditions.every(pre => pre(this.room) == true) ? goal.getAssignments(this.room) : []),
        <Assignment[]>[]
      );
      const unsatisfied = this.allocateCreeps(assignments);
      const spawned = this.spawnCreeps(unsatisfied);

      this.room.visual.text(unsatisfied.length + " unsatisfied assignments", 10, 20);

      for (const creep of this.creeps) {
        switch (creep.memory.job) {
          case Job.Harvester:
            harvester.run(creep, this.room);
            break;
          case Job.Builder:
            builder.run(creep, this.room);
            break;
          default:
            break;
        }
      }
    }

    private loadCreeps() {
      for (const name in Memory.creeps) {
        const creep = Game.creeps[name];
        this.creeps.push(creep);
      }
    }

    private allocateCreeps(wants: Assignment[]): Assignment[] {
      let unsatisfied: Assignment[] = [];
      for (const want of wants) {
        const matches = _.filter(
          this.creeps,
          (creep: Creep) =>
            (!creep.memory.job || creep.memory.job == Job.Idle) &&
            creep.body.every((partDef: BodyPartDefinition) => want.body?.includes(partDef.type))
        );
        if (matches.length > 0) {
          const trav = matches[0].memory._trav!;
          matches[0].memory = want.memory;
          matches[0].memory._trav = trav;
          console.log("Reassigned " + matches[0].name);
        } else {
          unsatisfied.push(want);
        }
      }
      return unsatisfied;
    }

    private spawnCreeps(wants: Assignment[]): number {
      const spawn = Game.spawns["Spawn1"];
      if (spawn.spawning) {
        return 0;
      }

      for (const want of wants) {
        const res = spawn.spawnCreep(want.body, want.job + Game.time);
        if (res === 0) {
          console.log("Spawning " + want.job + " with target " + want.memory.target.x + "," + want.memory.target.y);
          return 1;
        }
      }

      return 0;
    }

    private getWorkersById(id: Id<any>): Creep[] {
      let workers: Creep[] = [];
      for (const creep of this.creeps) {
        if (creep.memory.owner === id && creep.ticksToLive! > 300) {
          workers.push(creep);
        }
      }
      return workers;
    }
  }
}
