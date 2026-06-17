import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faAmazon,
  faApple,
  faDiscord,
  faFacebook,
  faGithub,
  faGoogle,
  faInstagram,
  faLinkedin,
  faMeta,
  faMicrosoft,
  faPaypal,
  faReddit,
  faSlack,
  faSpotify,
  faSteam,
  faTwitch,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faBolt,
  faBriefcase,
  faBuilding,
  faBuildingColumns,
  faCartShopping,
  faCloud,
  faCode,
  faCoins,
  faComments,
  faEnvelope,
  faGamepad,
  faGraduationCap,
  faHeartPulse,
  faHouse,
  faKey,
  faLandmark,
  faListCheck,
  faLock,
  faMusic,
  faNewspaper,
  faPalette,
  faPhone,
  faPlane,
  faRobot,
  faShieldHalved,
  faTv,
  faUtensils,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

const BRAND_ICONS: Record<string, IconDefinition> = {
  Amazon: faAmazon,
  Apple: faApple,
  Discord: faDiscord,
  GitHub: faGithub,
  Google: faGoogle,
  Instagram: faInstagram,
  LinkedIn: faLinkedin,
  Meta: faMeta,
  Microsoft: faMicrosoft,
  PayPal: faPaypal,
  Reddit: faReddit,
  Slack: faSlack,
  Spotify: faSpotify,
  Steam: faSteam,
  Twitch: faTwitch,
};

const CATEGORY_ICONS: Record<string, IconDefinition> = {
  ai: faRobot,
  banking: faBuildingColumns,
  brand: faBuilding,
  cloud: faCloud,
  creator: faPalette,
  crypto: faCoins,
  custom: faWandMagicSparkles,
  developer: faCode,
  education: faGraduationCap,
  email: faEnvelope,
  food: faUtensils,
  gaming: faGamepad,
  government: faLandmark,
  health: faHeartPulse,
  home: faHouse,
  insurance: faShieldHalved,
  music: faMusic,
  news: faNewspaper,
  other: faKey,
  productivity: faListCheck,
  security: faLock,
  shopping: faCartShopping,
  social: faComments,
  streaming: faTv,
  telecom: faPhone,
  travel: faPlane,
  utilities: faBolt,
  work: faBriefcase,
};

const BRAND_HINT_ICONS: { keys: readonly string[]; icon: IconDefinition }[] = [
  { keys: ["youtube"], icon: faYoutube },
  { keys: ["facebook"], icon: faFacebook },
  { keys: ["meta"], icon: faMeta },
];

export default function AccountVisualIcon({
  category,
  fallback,
  name,
  url,
  brandLabel,
  className = "h-4 w-4",
}: {
  category: string;
  fallback: string;
  name?: string;
  url?: string;
  brandLabel?: string;
  className?: string;
}) {
  const haystack = `${name ?? ""} ${url ?? ""}`.toLowerCase();
  const hintedBrand = BRAND_HINT_ICONS.find((brand) =>
    brand.keys.some((key) => haystack.includes(key)),
  );
  const icon =
    hintedBrand?.icon ??
    (brandLabel ? BRAND_ICONS[brandLabel] : undefined) ??
    CATEGORY_ICONS[category];

  if (icon) {
    return <FontAwesomeIcon icon={icon} className={className} />;
  }

  return <span className="leading-none">{fallback}</span>;
}
