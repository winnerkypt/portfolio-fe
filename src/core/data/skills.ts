import type { SkillGroup, Toolbox } from "./types/skills";

export const skillGroups: readonly SkillGroup[] = [
  {
    id: "frontend",
    no: "01",
    title: "FRONTEND",
    sub: "Interfaces people actually enjoy clicking.",
    chips: ["Next.js", "React", "VueJs", "Tailwind CSS", "JavaScript", "HTML", "CSS", "Bootstrap"],
  },
  {
    id: "backend",
    no: "02",
    title: "BACKEND",
    sub: "APIs, data and the plumbing behind the page.",
    chips: ["Golang", "Laravel", "PHP", "Java", "Spring Boot"],
  },
];

export const toolbox: Toolbox = {
  title: "Also in the toolbox",
  items: ["Docker", "RESTful APIs", "CMS platforms", "Full-cycle deploy", "QA & test cases"],
};
