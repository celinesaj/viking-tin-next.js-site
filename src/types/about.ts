export type AboutHero = {
  title: string;
  description: string;
  backgroundImage: string;
  productImage: string;
};

export type AboutQuote = {
  first: string;
  highlighted: string;
};

export type AboutStory = {
  title: string;
  descriptionTop: string;
  descriptionMiddle: string;
  descriptionBottom: string;
  collageImage: string;
};

export type AboutValueItem = {
  id: string;
  title: string;
  description: string;
  icon: 'vision' | 'mission' | 'core-value';
};

export type AboutValuesSectionData = {
  title: string;
  intro: string;
  backgroundImage: string;
  items: AboutValueItem[];
};

export type AboutPageData = {
  hero: AboutHero;
  quote: AboutQuote;
  story: AboutStory;
  values: AboutValuesSectionData;
};