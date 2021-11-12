interface MonType {
  hoho: string;
}

export async function deleteMe(a: any) {
  const hihi: MonType = { hoho: "salut" };
  return hihi;
}

export async function getActor(a: any) {
  return { bool: false };
}

export async function editActor(a: any) {
  return ({ bool: false } as any) as MonType;
}

export async function getSimpleActor(a: any) {
  return { taco: 1.55 };
}
