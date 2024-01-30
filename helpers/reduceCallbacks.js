export const reduceArrayToJustDifferentDates = {
  callback: (accumulator, currentDay) => {
    if (accumulator.length === 0) return [currentDay];
    if (accumulator.includes(currentDay)) return accumulator;
    return [...accumulator, currentDay];
  },
  initialValue: [],
};
