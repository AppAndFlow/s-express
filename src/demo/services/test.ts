import { MM } from "./tesa";

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
  const b: MM = {
    a: {
      ho: "da",
    },
    hihi: "d",
    nono: 4,
  };
  return b;
}
