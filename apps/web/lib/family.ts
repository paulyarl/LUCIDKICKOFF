// S4.1 — family access moved behind the lib/api repository facade.
// Thin re-exports keep existing callers working; new code should import
// `repo` from '@/lib/api/repository' directly.
import { repo } from '@/lib/api/repository';

export type { FamilyChild } from '@/lib/api/repository';

export const generateChildOtp = () => repo.family.generateOtp();
export const linkChild = (otp: string) => repo.family.linkChild(otp);
export const listChildren = () => repo.family.listChildren();
export const assignPack = (childId: string, packId: string) => repo.family.assignPack(childId, packId);
export const assignTemplate = (childId: string, storageRef: string) =>
  repo.family.assignTemplate(childId, storageRef);
