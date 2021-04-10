import * as harvester from "jobs/harvester";
import * as builder from "jobs/builder";
import * as idle from "jobs/idle";
import * as miner from "jobs/miner";
import { Job } from "Job";
import { JuiceController } from "goals/JuiceController";
import { JuiceExtensions } from "goals/JuiceExtensions";
import { JuiceSpawns } from "goals/JuiceSpawns";
import { BuilderRepair } from "goals/BuilderRepair";
import { BuilderSites } from "goals/BuilderSites";
import { JuiceControllerSurplus } from "goals/JuiceControllerSurplus";
import { ConstructRoads } from "goals/ConstructRoads";
import { ConstructJetcans } from "goals/ConstructJetcans";
import { FlagJetcans } from "goals/FlagJetcans";
import { SpawnMiners } from "goals/SpawnMiners";
import { assign } from "lodash";

export module CreepManagement {
  export class Director {
    room: Room;
    creeps: Creep[] = [];
    creepGoals: Goal[] = [
      JuiceController,
      JuiceExtensions,
      JuiceSpawns,
      BuilderRepair,
      BuilderSites,
      SpawnMiners,
      JuiceControllerSurplus
    ].sort((a, b) => a.priority - b.priority);
    buildGoals: Goal[] = [ConstructRoads, ConstructJetcans, FlagJetcans].sort((a, b) => a.priority - b.priority);

    constructor(room: Room) {
      this.room = room;
    }

    run() {
      this.loadCreeps();

      //generate construction sites
      const builds = this.buildGoals.reduce(
        (a, goal) =>
          a.concat(
            goal.getConstructionSites && goal.preconditions.every(pre => pre(this.room) == true)
              ? goal.getConstructionSites(this.room)
              : []
          ),
        <BuildRequest[]>[]
      );
      const activeSites = this.room.find(FIND_MY_CONSTRUCTION_SITES).length;
      builds.slice(0, 5 - activeSites).forEach(req => this.room.createConstructionSite(req.pos, req.structureType));

      //generate creep assignments
      const assignments = this.creepGoals.reduce(
        (a, goal) =>
          a.concat(
            goal.getCreepAssignments && goal.preconditions.every(pre => pre(this.room) == true)
              ? goal.getCreepAssignments(this.room)
              : []
          ),
        <Assignment[]>[]
      );
      const unallocated = this.allocateCreeps(assignments);
      const unsatisfied = this.spawnCreeps(unallocated);
      this.room.visual.text(assignments.length + "  assignments:\n", 10, 28);
      this.room.visual.text(unallocated.length + " unallocated assignments:\n", 10, 24);
      this.room.visual.text(unsatisfied.length + " unsatisfied assignments:\n", 10, 20);

      this.creeps.forEach(c => this.runCreep(c));
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
        let matches: Creep[] = [];
        for (const creep of this.creeps) {
          if (creep.memory.job && creep.memory.job != Job.Idle) {
            continue;
          }

          let avail: Map<BodyPartConstant, number> = new Map();
          for (const b of creep.body) {
            if (avail.has(b.type)) {
              avail.set(b.type, avail.get(b.type)! + 1);
            } else {
              avail.set(b.type, 1);
            }
          }
          for (const part of want.body) {
            if (!avail.has(part)) {
              break;
            }

            avail.set(part, avail.get(part)! - 1);
          }
          let match = true;
          for (const count of avail.values()) {
            if (count < 0) {
              match = false;
            }
          }
          if (match) {
            matches.push(creep);
          }
        }

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

    private spawnCreeps(wants: Assignment[]): Assignment[] {
      const spawn = Game.spawns["Spawn1"];
      if (spawn.spawning || wants.length < 1) {
        return wants;
      }

      const res = spawn.spawnCreep(wants[0].body, wants[0].job + Game.time);
      if (res === 0) {
        console.log(
          "Spawning " + wants[0].job + " with target " + wants[0].memory.target.x + "," + wants[0].memory.target.y
        );
        return wants.slice(1, wants.length);
      }
      return wants;
    }

    private runCreep(creep: Creep): void {
      switch (creep.memory.job) {
        case Job.Harvester:
          harvester.run(creep, this.room);
          break;
        case Job.Builder:
          builder.run(creep, this.room);
          break;
        case Job.Miner:
          miner.run(creep, this.room);
          break;
        case Job.Idle:
          idle.run(creep, this.room);
          break;
        default:
          break;
      }
    }
  }
}
