import type { Profile } from "./types/profile";

export const profile: Profile = {
  name: "Kanyapat",
  fullName: "Kanyapat Wittayamanitkul",
  role: "Full Stack Engineer",
  kicker: "Open to Full Stack Engineer roles",
  headline: { lead: "I build web platforms ", highlight: "end to end." },
  lede: "Full-stack engineer in Bangkok. Next.js front ends, Go and Laravel APIs, CMS platforms and full-cycle deployment, with test cases that keep them reliable.",
  nowBuilding: { title: "NOW BUILDING", text: "Next.js front ends with Go & Laravel APIs" },
  badge: {
    titleLines: ["SOFTWARE", "ENGINEER"],
    accent: "PORTFOLIO",
    tagline: "FULL STACK · NEXT.JS · GO · LARAVEL",
    location: "Bangkok, TH",
    status: "Open to work",
    back: {
      eyebrow: "CURRENTLY LOOKING FOR",
      headline: "FULL STACK",
      sub: "ENGINEER ROLE",
      returnTo: "IF FOUND, PLEASE RETURN TO",
      stackLabel: "STACK",
      stack: ["Next.js", "Golang", "Laravel", "Spring Boot"],
      stamp: ["THANK", "YOU!"],
    },
  },
  ribbon: [
    "FULL STACK",
    "CMS PLATFORMS",
    "RESTFUL APIS",
    "FULL-CYCLE DEPLOY",
    "NEXT.JS",
    "GOLANG",
    "LARAVEL",
    "QA & TESTS",
  ],
  about: {
    heading: { lead: "A full-stack engineer who ", mark: "ships the whole thing." },
    big: "I build web platforms from the interface down to the database: Next.js front ends, RESTful APIs in Go and Laravel, CMS platforms and full-cycle deployment.",
    small: "I write test cases to keep systems reliable, and I've recently contributed to UI design.",
    facts: [
      { term: "Based in", detail: "Bangkok, Thailand" },
      { term: "Experience", detail: "Nearly one year" },
      { term: "Focus", detail: "Frontend, APIs, CMS, deployment" },
      { term: "Looking for", detail: "Full Stack Engineer role" },
    ],
  },
  contact: {
    lede: "Open to Full Stack Engineer roles and interesting web projects. Email is the fastest way to reach me.",
    sign: "Kanyapat W.",
  },
};
