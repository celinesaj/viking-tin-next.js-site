import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaPinterestP,
  FaSnapchat,
  FaGlobe,
} from 'react-icons/fa6';

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

export function getSocialIcon(platform: string) {
  const key = normalize(platform);

  switch (key) {
    case 'facebook':
      return FaFacebookF;

    case 'instagram':
      return FaInstagram;

    case 'linkedin':
    case 'linkedinin':
      return FaLinkedinIn;

    case 'twitter':
    case 'x':
    case 'xtwitter':
      return FaXTwitter;

    case 'tiktok':
      return FaTiktok;

    case 'youtube':
      return FaYoutube;

    case 'pinterest':
      return FaPinterestP;

    case 'snapchat':
      return FaSnapchat;

    default:
      return FaGlobe; // fallback
  }
}