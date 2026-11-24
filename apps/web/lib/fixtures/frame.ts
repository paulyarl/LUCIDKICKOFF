import type { ArtId } from "@/lib/art";

export type FrameLesson = {
  id: string;
  title: string;
  minutes: number;
  state: "done" | "current" | "locked";
  progress?: number;
};

export type FramePack = {
  id: string;
  title: string;
  description: string;
  artId: ArtId;
  progress: number;
  lessons: number;
  age: string;
  tags: string[];
  free: boolean;
};

export type FrameProfile = {
  id: string;
  name: string;
  age: number;
  artId: ArtId;
};

export type FrameCategory = { id: string; label: string; artId: ArtId };

/** Sprint 0A fixtures — deliberately shaped like the eventual view models. */
export const homeFixture = {
  child: { name: "Amani", avatarId: "avatar.01" as ArtId },
  packs: [
    {
      id: "amazing-animals",
      title: "Amazing Animals of Tanzania",
      description: "Explore Tanzania's unique wildlife and how we can protect them.",
      artId: "pack.amazing-animals.cover" as ArtId,
      progress: 75,
      lessons: 5,
      age: "6–12",
      tags: ["Science", "Nature"],
      free: true,
    },
    {
      id: "landforms",
      title: "Landforms of Tanzania",
      description: "Mountains, lakes and the Great Rift Valley.",
      artId: "lesson.02.habitats" as ArtId,
      progress: 25,
      lessons: 4,
      age: "6–12",
      tags: ["Geography"],
      free: true,
    },
    {
      id: "culture",
      title: "Our Culture & Traditions",
      description: "Stories, music and art from across Tanzania.",
      artId: "pack.culture-traditions.cover" as ArtId,
      progress: 0,
      lessons: 6,
      age: "6–12",
      tags: ["Culture"],
      free: false,
    },
  ] satisfies FramePack[],
  categories: [
    { id: "nature", label: "Nature & Wildlife", artId: "icon.nature" as ArtId },
    { id: "landforms", label: "Landforms", artId: "icon.landforms" as ArtId },
    { id: "culture", label: "Culture", artId: "icon.culture" as ArtId },
    { id: "school", label: "School", artId: "icon.school" as ArtId },
    { id: "science", label: "Science", artId: "icon.science" as ArtId },
    { id: "health", label: "Health", artId: "icon.health" as ArtId },
    { id: "arts", label: "Arts", artId: "icon.arts" as ArtId },
    { id: "sports", label: "Sports", artId: "icon.sports" as ArtId },
  ] satisfies FrameCategory[],
};

export const packFixture = {
  id: "amazing-animals",
  title: "Amazing Animals of Tanzania",
  description: "Explore Tanzania's unique wildlife, their habitats, and how we can protect them.",
  artId: "pack.amazing-animals.cover" as ArtId,
  progress: 75,
  age: "6–12",
  tags: ["Science", "Nature & Wildlife", "Tanzania"],
  lessons: [
    { id: "l1", title: "Meet Tanzania's Wildlife", minutes: 8, state: "done" },
    { id: "l2", title: "Homes in the Wild", minutes: 10, state: "current", progress: 50 },
    { id: "l3", title: "Life in the Serengeti", minutes: 10, state: "locked" },
    { id: "l4", title: "Protecting Our Animals", minutes: 8, state: "locked" },
    { id: "l5", title: "Be a Wildlife Hero", minutes: 6, state: "locked" },
  ] satisfies FrameLesson[],
  objectives: [
    "Name five Tanzanian animals",
    "Match animals to their habitats",
    "Explain one way to protect wildlife",
  ],
};

export const profilesFixture: FrameProfile[] = [
  { id: "amani", name: "Amani", age: 9, artId: "avatar.01" },
  { id: "neema", name: "Neema", age: 11, artId: "avatar.05" },
  { id: "baraka", name: "Baraka", age: 8, artId: "avatar.02" },
  { id: "zuri", name: "Zuri", age: 7, artId: "avatar.06" },
  { id: "kito", name: "Kito", age: 10, artId: "avatar.03" },
  { id: "asha", name: "Asha", age: 12, artId: "avatar.04" },
];
