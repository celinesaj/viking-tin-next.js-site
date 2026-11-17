import { IMAGES } from "@/constants/images";

export type WhyChooseUsItem = {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
};

export const whyChooseUsData: WhyChooseUsItem[] = [
  {
    id: 1,
    title: 'Premium Quality',
    subtitle: 'Carefully selected nicotine pouch brands with consistent performance. We bring only the best to the UAE market.',
    icon: IMAGES.whyChooseUs.premiumQuality,
  },
  {
    id: 2,
    title: 'Rich Flavor Selection',
    subtitle: 'From smooth mint to fruity blends, find your perfect match for any all-day experience.',
    icon: IMAGES.whyChooseUs.healthy,
  },
  {
    id: 3,
    title: 'Designed for Modern Lifestyle',
    subtitle: 'Discreet, clean, and made for everyday use, wherever you are.',
    icon: IMAGES.whyChooseUs.lifeStyle,
  },
  {
    id: 4,
    title: 'Smoke-Free Experience',
    subtitle: 'Enjoy a clean nicotine hit without smoke, ash, or odor. The perfect modern alternative to traditional smoking or snus.',
    icon: IMAGES.whyChooseUs.smokeFreeExperience,
  },
];