import * as harvester from "jobs/harvester";

export module CreepManagement {
  export class Director {
    room: Room;
    creeps: Creep[] = [];
    freeCreeps: Creep[] = [];
    bodyTypes: Map<Job, BodyPartConstant[]> = new Map([
      [Job.Harvester, [WORK, CARRY, MOVE]],
      [Job.Upgrader, [WORK, CARRY, MOVE]]
    ]);

    constructor(room: Room) {
      this.room = room;
    }

    run() {
      this.loadCreeps();
      const wants = this.scheduleHarvesters();
      const unsatisfied = this.allocateCreeps(wants);
      console.log(unsatisfied.length + " unsatisfied assignments");
      const spawned = this.spawnCreeps(unsatisfied);
      console.log(spawned + " spawning");

      for (const creep of this.creeps) {
        switch (creep.memory.job) {
          case Job.Harvester:
            console.log("running harvester " + creep.name);
            harvester.run(creep, this.room);
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
        if (!creep.memory.job) {
          console.log("found free creep");
          this.freeCreeps.push(creep);
        }
      }
    }

    //TODO: generalize this to a loop scheduling many needs
    private scheduleHarvesters(): Assignment[] {
      const spawn = Game.spawns["Spawn1"];
      let wants: Assignment[] = [];

      //schedule spawner fueling
      if (this.getWorkersById(spawn.id).length < 2) {
        console.log("scheduling spawner fueler");
        wants.push(
          this.newHarvesterAssignment(
            spawn.id,
            this.room.find(FIND_SOURCES)[0].pos,
            spawn.pos,
            spawn.store.getFreeCapacity(RESOURCE_ENERGY)
          )
        );
      }

      //schedule controller upgrading
      if (
        this.room.controller &&
        (this.getWorkersById(this.room.controller.id).length < 3 ||
          (this.getWorkersById(this.room.controller.id).length < 8 &&
            spawn.store.getUsedCapacity(RESOURCE_ENERGY) > 300))
      ) {
        for (let i = 0; i < 3 - this.getWorkersById(this.room.controller.id).length; i++) {
          console.log("scheduling controller fueler");
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
      return wants;
    }

    private newHarvesterAssignment(
      owner: Id<StructureController> | Id<StructureSpawn>,
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
        const matches = _.filter(this.freeCreeps, (creep: Creep) =>
          creep.body.every((partDef: BodyPartDefinition) => this.bodyTypes.get(want.job)?.includes(partDef.type))
        );
        if (matches.length > 0) {
          matches[0].memory = want.memory;
          matches[0].say("Assigned new " + want.job);
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
            return 1;
          }
        }
      }

      return 0;
    }

    private getWorkersById(id: Id<StructureController> | Id<StructureSpawn>): Creep[] {
      let workers: Creep[] = [];
      for (const creep of this.creeps) {
        if (creep.memory.owner === id) {
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
    Harvester = "Harvester",
    Upgrader = "Upgrader"
  }
}
