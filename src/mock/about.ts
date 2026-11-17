import type { AboutPageData } from '@/types/about';

export const aboutPageData: AboutPageData = {
  hero: {
    title: 'About Viking Tin: \n A New Standard for Nicotine in the UAE',
    description:
      "Viking Tin brings together the world's premium nicotine pouch brands in one trusted place. We are focused on quality, consistency, and delivering a superior, smoke-free user experience from start to finish.",
    backgroundImage: '/images/about/about-hero-bg.png',
    productImage: '/images/about/about-hero-product.png',
  },

  quote: {
    first: 'Smooth hit.',
    highlighted: 'Clean feel',
  },

 story: {
  title: 'The Story Behind Our Products',
  descriptionTop:
    'Every product we offer has a reason to be here. It goes back to a simple idea, choosing what truly works, and leaving everything else behind. The same mindset that shaped the journey from where it all began still guides our selection process today.',
  descriptionMiddle:
    'We don\'t chase quantity; we focus strictly on quality. Each brand in our store is carefully tested and selected for its consistency, flavor profile, and overall experience.',
  descriptionBottom:
    'From smooth mint to bold flavors, every option is made to deliver a clean, reliable performance you can trust every day as a modern alternative to traditional products. Simple choices. Better experience.',
  collageImage: '/images/about/about-collage.png',
},

  values: {
    title: 'Our Purpose',
    intro: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    backgroundImage: '/images/flavour-banner.jpg',
    items: [
      {
        id: 'vision',
        title: 'Vision',
        description:
          'To shape a cleaner, more refined way to experience nicotine, built specifically for modern lifestyles.',
        icon: 'vision',
      },
          {
        id: 'core-value',
        title: 'Core Value',
        description:
          'Less noise. Better quality. Consistent experience. We focus on what matters — no smoke, no ash, nothing extra, just a clean nicotine experience. Every pouch and every brand meets our strict, premium standards before it reaches you. The same smooth taste and reliable experience, every single time, designed to fit seamlessly into your lifestyle, not disrupt it.',
        icon: 'core-value',
      },
      {
        id: 'mission',
        title: 'Mission',
        description:
          'To offer our customers in the UAE carefully selected nicotine pouch brands that deliver uncompromising quality, absolute consistency, and a better everyday experience.',
        icon: 'mission',
      },
  
    ],
  },
};