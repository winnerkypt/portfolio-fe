export interface Fact {
  readonly term: string;
  readonly detail: string;
}

export interface BadgeCopy {
  readonly titleLines: readonly string[];
  readonly accent: string;
  readonly tagline: string;
  readonly location: string;
  readonly status: string;
  readonly back: {
    readonly eyebrow: string;
    readonly headline: string;
    readonly sub: string;
    readonly returnTo: string;
    readonly stackLabel: string;
    readonly stack: readonly string[];
    readonly stamp: readonly string[];
  };
}

export interface Profile {
  readonly name: string;
  readonly fullName: string;
  readonly role: string;
  readonly kicker: string;
  readonly headline: { readonly lead: string; readonly highlight: string };
  readonly lede: string;
  readonly nowBuilding: { readonly title: string; readonly text: string };
  readonly badge: BadgeCopy;
  readonly ribbon: readonly string[];
  readonly about: {
    readonly heading: { readonly lead: string; readonly mark: string };
    readonly big: string;
    readonly small: string;
    readonly facts: readonly Fact[];
  };
  readonly contact: { readonly lede: string; readonly sign: string };
}
