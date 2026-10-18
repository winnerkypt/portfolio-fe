export interface Project {
  readonly id: string;
  readonly tab: string;
  readonly name: string;
  readonly desc: string;
  readonly image: string;
  readonly link: string;
  readonly year: number;
  readonly tags: readonly string[];
}
