const ids = [0];

export function newId(prefix = ''): string {
  let lastId = ids[ids.length - 1];
  if (lastId + 1 > Number.MAX_SAFE_INTEGER) {
    ids.push(0);
    lastId = ids[ids.length - 1];
  }
  lastId += 1;
  ids[ids.length - 1] = lastId;
  return prefix + ids.join('-');
}
