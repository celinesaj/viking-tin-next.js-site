import type { ContactPageData } from '@/types/contact';

export const contactPageData: ContactPageData = {
  hero: {
    title: 'Contact Us',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet justo dolor. Duis eu augue laoreet, suscipit tellus id.',
    backgroundImage: '/images/contact-hero-bg.jpg',
    collageImage: '/images/flavour-banner.jpg',
  },

  breadcrumbLabel: 'Contact Us',

  infoItems: [
    {
      id: 'address',
      type: 'address',
      title: 'Address',
      lines: [
        'Lorem ipsum dolor sit amet,',
        'consectetur adipiscing elit. Quisque',
        'aliquam enim vel aliquet rutrum.',
      ],
    },
    {
      id: 'phone',
      type: 'phone',
      title: 'Phone',
      lines: ['+961 000 111 222 33', '+961 000 111 222 33', '+961 000 111 222 33'],
    },
    {
      id: 'email',
      type: 'email',
      title: 'E-mail',
      lines: ['e-commerce@gmail.com', 'e-commerce@gmail.com'],
    },
  ],

  socialLinks: [
    {
      id: 'facebook',
      platform: 'facebook',
      url: '#',
    },
    {
      id: 'instagram',
      platform: 'instagram',
      url: '#',
    },
    {
      id: 'linkedin',
      platform: 'linkedin',
      url: '#',
    },
  ],

map: {
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3607.7598823403864!2d55.308322875384555!3d25.2786616776586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjXCsDE2JzQzLjIiTiA1NcKwMTgnMzkuMiJF!5e0!3m2!1sen!2slb!4v1778160126540!5m2!1sen!2slb" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade',
  pinLabel: 'Our Location',
},

  form: {
    title: 'Lorem Ipsum',
    backgroundImage: '/images/flavour-banner.jpg',
  },
};