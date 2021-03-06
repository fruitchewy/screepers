interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
}

interface TravelToReturnData {
  nextPos?: RoomPosition;
  pathfinderReturn?: PathfinderReturn;
  state?: TravelState;
  path?: string;
}

interface TravelToOptions {
  ignoreRoads?: boolean;
  ignoreCreeps?: boolean;
  ignoreStructures?: boolean;
  preferHighway?: boolean;
  highwayBias?: number;
  allowHostile?: boolean;
  allowSK?: boolean;
  range?: number;
  obstacles?: { pos: RoomPosition }[];
  roomCallback?: (roomName: string, matrix: CostMatrix) => CostMatrix | boolean;
  routeCallback?: (roomName: string) => number;
  returnData?: TravelToReturnData;
  restrictDistance?: number;
  useFindRoute?: boolean;
  maxOps?: number;
  movingTarget?: boolean;
  freshMatrix?: boolean;
  offRoad?: boolean;
  stuckValue?: number;
  maxRooms?: number;
  repath?: number;
  route?: { [roomName: string]: boolean };
  ensurePath?: boolean;
}

interface TravelData {
  state: any[];
  path: string;
}

interface TravelState {
  stuckCount: number;
  lastCoord: Coord;
  destination: RoomPosition;
  cpu: number;
}

interface Creep {
  travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
  makeIdle(changeOwner: boolean): void;
}

interface CreepMemory {
  _trav?: TravelData;
}

interface Structure {
  isEnergySinkStructure(): boolean;
  isEnergySourceStructure(): boolean;
}

interface RoomMemory {
  avoid: number;
}

type Coord = { x: number; y: number };
type HasPos = { pos: RoomPosition };

interface Assignment {
  job: import("../Job").Job;
  body: BodyPartConstant[];
  memory: CreepMemory;
}

interface Goal {
  preconditions: ((room: Room) => boolean)[];
  getCreepAssignments?(room: Room): Assignment[];
  getConstructionSites?(room: Room): BuildRequest[];
  priority: number;
}

interface BuildRequest {
  pos: RoomPosition;
  structureType: BuildableStructureConstant;
}
