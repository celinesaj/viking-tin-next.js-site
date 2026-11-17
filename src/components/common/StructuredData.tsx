// import { Metadata } from 'next'

// interface StructuredDataProps {
//   type: 'Organization' | 'WebSite' | 'Product' | 'Article'
//   data: Record<string, any>
// }

// export function StructuredData({ type, data }: StructuredDataProps) {
//   const jsonLd = {
//     '@context': 'https://schema.org',
//     '@type': type,
//     ...data,
//   }

//   return (
//     <script
//       type="application/ld+json"
//       dangerouslySetInnerHTML={{
//         __html: JSON.stringify(jsonLd),
//       }}
//     />
//   )
// }

// // Organization structured data for the website
// export const organizationStructuredData = {
//   name: 'Viking Tin',
//   url: 'https://vikingtin.ae',
//   logo: 'https://vikingtin.ae/images/logo/logo.png',
//   description: 'Premium nicotine pouch e-commerce platform offering high-quality, discreet nicotine alternatives.',
//   contactPoint: {
//     '@type': 'ContactPoint',
//     telephone: '+961-000-111-222-33',
//     contactType: 'customer service',
//     availableLanguage: 'English',
//   },
//   sameAs: [
//     'https://facebook.com/vikingtin',
//     'https://instagram.com/vikingtin',
//     'https://linkedin.com/company/vikingtin',
//   ],
// }

// // Website structured data
// export const websiteStructuredData = {
//   name: 'Viking Tin',
//   url: 'https://vikingtin.ae',
//   description: 'Premium nicotine pouch e-commerce platform',
//   potentialAction: {
//     '@type': 'SearchAction',
//     target: 'https://vikingtin.ae/search?q={search_term_string}',
//     'query-input': 'required name=search_term_string',
//   },
// }