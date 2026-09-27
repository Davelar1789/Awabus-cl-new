// A bus (and the route it serves) has exactly one driver. Buses that already
// have someone else driving them are listed but can't be picked.
export const busPickerOptions = (buses = [], currentDriverId = null) =>
  buses.map((b) => {
    const holder = b.assignedDriver;
    const taken = Boolean(holder) && holder._id !== currentDriverId;
    return {
      value: b._id,
      label: `${b.name} (${b.plateNumber})`,
      disabled: taken,
      description: taken
        ? `Already driven by ${holder.firstName} ${holder.lastName}`
        : `Capacity: ${b.capacity} · no driver yet`,
    };
  });
