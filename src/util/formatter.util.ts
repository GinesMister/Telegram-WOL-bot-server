export const parseNumericArray = (input: string | undefined): number[] => {
  if (!input) throw new Error('input undefined');
  const result = input
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => !isNaN(item));

  if (result.length === 0) {
    throw new Error('Invalid numeric input');
  }

  return result;
};
