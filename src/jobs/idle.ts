// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  if (creep.pos.getRangeTo(8, 13) > 5) {
    let pos = new RoomPosition(8, 13, creep.memory.source.roomName);
    creep.travelTo(pos);
  }
}
