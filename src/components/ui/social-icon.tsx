import { brand } from "@/lib/catalog";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/brand/marks";

const socialLinks = [
  { label: "Instagram", href: brand.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: brand.facebook, Icon: FacebookIcon },
  { label: "TikTok", href: brand.tiktok, Icon: TikTokIcon },
  { label: "WhatsApp", href: `https://wa.me/${brand.whatsapp}`, Icon: WhatsAppIcon },
] as const;

export function SocialIconLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {socialLinks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`REEVITA on ${label}`}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-[#d9d4c9] bg-transparent text-[#405247] transition-all duration-300 hover:scale-[1.12] hover:border-[#405247] hover:bg-[#405247] hover:text-[#f7f3eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405247] focus-visible:ring-offset-2"
        >
          <Icon className="size-[17px]" />
        </a>
      ))}
    </div>
  );
}
