export function removeItem<T>(arr: Array<T>, value: T): Array<T> {
  const index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

export function isAny<T>(arr: Array<T>): boolean {
  return arr != null && arr.length > 0;
}
export function isEmpty<T>(arr: Array<T>): boolean {
  return !isAny(arr);
}

export function arrayEquals<T>(arr1: Array<T>, arr2: Array<T>): boolean {
  if (isEmpty(arr1) && isEmpty(arr2)) {
    return true;
  }
  if (isEmpty(arr1) || isEmpty(arr2)) {
    return false;
  }
  if (arr1.length != arr2.length) {
    return false;
  }
  for (const key in arr1) {
    if (arr1[key] != arr2[key]) {
      return false;
    }
  }
  return true;
}
