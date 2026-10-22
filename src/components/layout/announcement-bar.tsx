import { cn } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { brand } from "@/lib/catalog";

export function AnnouncementBar() {
  const { t } = useI18n();
  const messages = [t("freeShipping"), t("cashOnDelivery"), t("delivery")];
  return (
    <div className="bg-plum text-ivory">
      <div className="container-luxe flex h-9 items-center justify-between gap-4 overflow-hidden">
        <div className="hidden items-center gap-2 text-[0.68rem] font-semibold tracking-[0.12em] sm:flex">
          <span className="h-px w-5 bg-gold" aria-hidden />
          <span>BEAUTY · CARE · RENEW</span>
        </div>
        <div className="flex flex-1 items-center justify-center gap-4 text-[0.66rem] font-medium sm:gap-6 sm:text-[0.7rem]">
          {messages.map((message, index) => (
            <span
              key={message}
              className={cn("flex items-center gap-2 whitespace-nowrap", index > 0 && "hidden md:flex")}
            >
              {index > 0 && <span className="text-gold/60">·</span>}
              {message}
            </span>
          ))}
        </div>
        <a
          href={`https://wa.me/${brand.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-[0.68rem] font-bold text-gold transition-colors hover:text-ivory sm:block"
        >
          {t("contact")}
        </a>
      </div>
    </div>
  );
}
