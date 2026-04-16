export const parseToNumericArray = (input: string | undefined): number[] => {
  if (!input) return [];
  const result = input
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => !isNaN(item));

  if (result.length === 0) {
    throw new Error('Invalid numeric input');
  }

  return result;
};

export const parseToStringArray = (input: string | undefined): string[] => {
  if (!input) return [];
  const result = input.split(',');

  if (result.length === 0) {
    throw new Error('Invalid input');
  }

  return result;
};
