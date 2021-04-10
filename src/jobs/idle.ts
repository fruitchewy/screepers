// Runs all creep actions
export function run(creep: Creep, room: Room): void {
  if (creep.pos.getRangeTo(30,20) > 5) {
    let pos = new RoomPosition(30, 20, "W3N2")
    creep.travelTo(pos);
  }
}