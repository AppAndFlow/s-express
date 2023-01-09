export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function replaceAllWhole(str: string, find: string, replace: string) {
  return str.replace(
    new RegExp("\\b" + escapeRegExp(find) + "\\b", "g"),
    replace
  );
}

export function replaceAllWholeButOnlyCheckPrefix(
  str: string,
  find: string,
  replace: string
) {
  return str.replace(new RegExp("\\b" + escapeRegExp(find), "g"), replace);
}
