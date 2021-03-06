import * as harvester from "jobs/harvester";
import * as builder from "jobs/builder";
import * as idle from "jobs/idle";
import * as miner from "jobs/miner";
import * as conqueror from "jobs/conqueror";
import { Job } from "Job";
import { JuiceController } from "goals/JuiceController";
import { JuiceExtensions } from "goals/JuiceExtensions";
import { JuiceSpawns } from "goals/JuiceSpawns";
import { JuiceTowers } from "goals/JuiceTowers";
import { BuilderRepair } from "goals/BuilderRepair";
import { BuilderSites } from "goals/BuilderSites";
import { ConstructRoads } from "goals/ConstructRoads";
import { ConstructJetcans } from "goals/ConstructJetcans";
import { FlagJetcans } from "goals/FlagJetcans";
import { SpawnMiners } from "goals/SpawnMiners";
import { FlagNeighbors } from "goals/FlagNeighbors";
import { ExploreNeighbors } from "goals/ExploreNeighbors";
import { JuiceBootstrapNeighbor } from "goals/JuiceBootstrapNeighbor";
import { BuilderNeighborSpawns } from "goals/BuilderNeighborSpawns";
import { BuilderNeighborSites } from "goals/BuilderNeighborSites";
import { getWorkersById } from "goals/common";

export module RoomManagement {
  export class Director {
    room: Room;
    offset: number;
    creeps: Creep[] = [];
    creepGoals: Goal[] = [
      JuiceController,
      JuiceExtensions,
      JuiceSpawns,
      JuiceTowers,
      BuilderRepair,
      BuilderSites,
      SpawnMiners,
      ExploreNeighbors,
      BuilderNeighborSpawns,
      BuilderNeighborSites,
      JuiceBootstrapNeighbor
      //JuiceControllerSurplus
    ].sort((a, b) => a.priority - b.priority);
    buildGoals: Goal[] = [ConstructRoads, ConstructJetcans, FlagJetcans, FlagNeighbors].sort(
      (a, b) => a.priority - b.priority
    );

    constructor(room: Room, index: number) {
      this.room = room;
      this.offset = index;
    }

    run() {
      this.loadCreeps();
      if ((Game.time + this.offset) % 4 == 0) {
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

        // Generate creep assignments
        const assignments = this.creepGoals.reduce(
          (a, goal) =>
            a.concat(
              goal.getCreepAssignments && goal.preconditions.every(pre => pre(this.room) == true)
                ? goal.getCreepAssignments(this.room)
                : []
            ),
          <Assignment[]>[]
        );
        console.log(JSON.stringify(assignments));

        const unallocatedPrecull = this.allocateCreeps(assignments, this.creeps);

        // Cull upgraders if we need creeps
        let unallocated = unallocatedPrecull;
        if (unallocatedPrecull.length > 1) {
          getWorkersById(this.room.controller!.id, this.room).forEach(creep => {
            creep.makeIdle(true);
            console.log("culled");
          });
          // Generate new creep assignments
          const assignmentsNew = this.creepGoals.reduce(
            (a, goal) =>
              a.concat(
                goal.getCreepAssignments && goal.preconditions.every(pre => pre(this.room) == true)
                  ? goal.getCreepAssignments(this.room)
                  : []
              ),
            <Assignment[]>[]
          );
          unallocated = this.allocateCreeps(assignmentsNew, this.creeps);
        }

        let unsatisfied = this.spawnCreeps(unallocated);

        let idle = this.creeps.filter(creep => creep.memory.job === Job.Idle);

        if (unallocatedPrecull[0]?.memory.target != unallocated[0]?.memory.target) {
          console.log("cull successful");
        }
        this.room.visual.text(unallocated.length + " unallocated", 10, 19);
        this.room.visual.text(unsatisfied.length + " unsatisfied", 10, 20);
        this.room.visual.text("" + (this.creeps.length - idle.length) + " active creeps", 10, 21);
        this.room.visual.text(idle.length + " idle creeps", 10, 22);
        if (unsatisfied.length > 0) {
          this.room.visual.text(unsatisfied[0]?.job + " => " + JSON.stringify(unsatisfied[0]?.memory.target), 10, 23);
        }
      }
      this.creeps.forEach(c => this.runCreep(c));

      const cannons = <StructureTower[]>this.room.find(FIND_MY_STRUCTURES, {
        filter: struct => struct.structureType === STRUCTURE_TOWER
      });
      const enemies = this.room.find(FIND_HOSTILE_CREEPS);
      for (const cannon of cannons) {
        if (cannon && enemies) {
          cannon.attack(enemies[0]);
        }
      }
    }

    private loadCreeps() {
      for (const name in Memory.creeps) {
        const creep = Game.creeps[name];
        if (creep.room === this.room) {
          this.creeps.push(creep);
        }
      }
    }

    private allocateCreeps(wants: Assignment[], creeps: Creep[]): Assignment[] {
      let unsatisfied: Assignment[] = [];
      for (const want of wants) {
        let matches: Creep[] = [];
        for (const creep of creeps) {
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
          let match = true;
          for (const part of want.body) {
            if (!avail.has(part)) {
              match = false;
              break;
            } else if (avail.get(part)! <= 0) {
              match = false;
              break;
            }
            avail.set(part, avail.get(part)! - 1);
          }
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
          const bodyFit = matches.sort(
            (a, b) =>
              a.body.filter(part => !want.body.includes(part.type)).length -
              b.body.filter(part => !want.body.includes(part.type)).length
          );
          const best = bodyFit.filter(
            creep =>
              creep.body.filter(part => !want.body.includes(part.type)).length <=
              bodyFit[0].body.filter(part => !want.body.includes(part.type)).length
          );
          const chosen = best.sort(
            (a, b) => a.pos.getRangeTo(want.memory.target) - b.pos.getRangeTo(want.memory.target)
          )[0];
          const trav = chosen.memory._trav!;
          chosen.memory = want.memory;
          chosen.memory._trav = trav;
          console.log("Reassigned " + chosen.name);
        } else {
          unsatisfied.push(want);
        }
      }
      return unsatisfied;
    }

    private spawnCreeps(wants: Assignment[]): Assignment[] {
      const spawns = this.room.find(FIND_MY_SPAWNS).filter(spawn => !spawn.spawning);
      if (spawns.length < 1) {
        return wants;
      }

      for (const spawn of spawns) {
        if (wants.length < 1) {
          return [];
        }

        const res = spawn.spawnCreep(wants[0].body, wants[0].job + Game.time);
        if (res === 0) {
          console.log(
            "Spawning " + wants[0].job + " with target " + wants[0].memory.target.x + "," + wants[0].memory.target.y
          );
          wants = wants.slice(1, wants.length);
        }
      }
      return wants;
    }

    private runCreep(creep: Creep): void {
      if (creep.memory == undefined || !creep.memory || !creep.memory.job) {
        creep.memory = {
          job: Job.Idle,
          source: creep.pos,
          target: creep.pos,
          owner: creep.id,
          stuckTicks: 0
        };
      }
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
        case Job.Conqueror:
          conqueror.run(creep, this.room);
        default:
          break;
      }
    }
  }
}
