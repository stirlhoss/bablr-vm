export const isArray = Array;

export const notEmpty = (arr) => arr != null && arr.length > 0;

export const nullOr = (arr) => (arr.length === 0 ? null : arr);

export function* arraySlice(arr, start, end) {
  const increment = end > start ? 1 : -1;

  for (let i = start; i < end; i += increment) {
    yield arr[i];
  }
}

export const findRight = (arr, predicate) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    const value = arr[i];
    if (predicate(value)) return value;
  }
  return null;
};
