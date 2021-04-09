import * as harvester from "jobs/harvester";
import * as builder from "jobs/builder";

export module CreepManagement {
  export class Director {
    room: Room;
    creeps: Creep[] = [];
    bodyTypes: Map<Job, BodyPartConstant[]> = new Map([
      [Job.Harvester, [WORK, CARRY, CARRY, MOVE, MOVE]],
      [Job.Builder, [WORK, CARRY, CARRY, MOVE, MOVE]]
    ]);

    constructor(room: Room) {
      this.room = room;
    }

    run() {
      this.loadCreeps();
      const wants = this.scheduleHarvesters().concat(this.scheduleBuilders());
      const unsatisfied = this.allocateCreeps(wants);
      const spawned = this.spawnCreeps(unsatisfied);
      if (spawned) console.log(spawned + " spawning");

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

    //TODO: generalize this to a loop scheduling many needs
    private scheduleHarvesters(): Assignment[] {
      const spawn = Game.spawns["Spawn1"];
      let wants: Assignment[] = [];

      //schedule spawner fueling
      if (this.getWorkersById(spawn.id).length < 3 && spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 100) {
        wants.push(this.newHarvesterAssignment(spawn.id, this.room.find(FIND_SOURCES)[0].pos, spawn.pos, 9999));
      }

      //schedule controller upgrading
      if (this.room.controller && this.getWorkersById(this.room.controller.id).length < 1) {
        for (let i = 0; i < 3 - this.getWorkersById(this.room.controller.id).length; i++) {
          wants.push(
            this.newHarvesterAssignment(
              this.room.controller.id,
              this.room.find(FIND_SOURCES)[0].pos,
              this.room.controller.pos,
              9999
            )
          );
        }
      }

      //schedule extension juicers
      for (const name in Game.structures) {
        const structure = Game.structures[name];
        let extension: StructureExtension;
        if (structure.structureType === STRUCTURE_EXTENSION) {
          extension = Game.getObjectById(<Id<StructureExtension>>structure.id)!;
        } else break;
        if (extension.store.getFreeCapacity(RESOURCE_ENERGY)! > 0 && this.getWorkersById(extension.id).length === 0) {
          wants.push(this.newHarvesterAssignment(extension.id, this.room.find(FIND_SOURCES)[0].pos, extension.pos));
        }
      }
      return wants;
    }

    private scheduleBuilders(): Assignment[] {
      let wants: Assignment[] = [];

      this.room.find(FIND_STRUCTURES, { filter: c => c.hitsMax - c.hits > 100 }).forEach(s =>
        wants.push({
          job: Job.Builder,
          memory: {
            job: Job.Builder,
            source: this.room.find(FIND_SOURCES)[0].pos,
            target: s.pos,
            owner: s.id
          }
        })
      );

      const sites = this.room.find(FIND_CONSTRUCTION_SITES).sort((a, b) => b.progress - a.progress);
      for (let i = 0; i <= sites.length / 6; i++) {
        if (sites[i] && this.getWorkersById(sites[i].id).length < 4) {
          for (let j = 0; j < 4 - this.getWorkersById(sites[i].id).length; j++) {
            wants.push({
              job: Job.Builder,
              memory: {
                job: Job.Builder,
                source: this.room.find(FIND_SOURCES)[0].pos,
                target: sites[i].pos,
                owner: sites[i].id
              }
            });
          }
        }
      }

      return wants;
    }

    private newHarvesterAssignment(
      owner: Id<StructureController> | Id<StructureSpawn> | Id<StructureExtension>,
      source: RoomPosition,
      target: RoomPosition,
      quantity: number = 0
    ): Assignment {
      const assignmentMemory = {
        job: Job.Harvester,
        source: source,
        target: target,
        remaining: quantity,
        owner: owner
      };
      return { job: assignmentMemory.job, memory: assignmentMemory };
    }

    private allocateCreeps(wants: Assignment[]): Assignment[] {
      let unsatisfied: Assignment[] = [];
      for (const want of wants) {
        const matches = _.filter(
          this.creeps,
          (creep: Creep) =>
            (!creep.memory.job || creep.memory.job == Job.Idle) &&
            creep.body.every((partDef: BodyPartDefinition) => this.bodyTypes.get(want.job)?.includes(partDef.type))
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
        const body = this.bodyTypes.get(want.job);
        if (body) {
          const res = spawn.spawnCreep(body, want.job + Game.time);
          if (res === 0) {
            console.log("Spawning " + want.job + " with target " + want.memory.target.x + "," + want.memory.target.y);
            return 1;
          }
        }
      }

      return 0;
    }

    private getWorkersById(
      id: Id<StructureController> | Id<StructureSpawn> | Id<ConstructionSite> | Id<StructureExtension>
    ): Creep[] {
      let workers: Creep[] = [];
      for (const creep of this.creeps) {
        if (creep.memory.owner === id && creep.ticksToLive! > 300) {
          workers.push(creep);
        }
      }
      return workers;
    }
  }

  interface Assignment {
    job: Job;
    memory: CreepMemory;
  }

  export enum Job {
    Idle = "Idle",
    Harvester = "Harvester",
    Builder = "Builder"
  }
}
