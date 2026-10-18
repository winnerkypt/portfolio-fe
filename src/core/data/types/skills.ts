export interface SkillGroup {
  readonly id: "frontend" | "backend";
  readonly no: string;
  readonly title: string;
  readonly sub: string;
  readonly chips: readonly string[];
}

export interface Toolbox {
  readonly title: string;
  readonly items: readonly string[];
}
