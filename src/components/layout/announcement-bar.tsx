import { cn } from "@/lib/format";

const messages = [
  "شحن مجاني للطلبات فوق 1000 ج.م",
  "الدفع عند الاستلام في كل محافظات مصر",
  "توصيل سريع ١–٤ أيام عمل",
];

export function AnnouncementBar() {
  return (
    <div className="bg-plum text-ivory">
      <div className="container-luxe flex h-9 items-center justify-between gap-4 overflow-hidden">
        <div className="hidden items-center gap-2 text-[0.68rem] font-semibold tracking-[0.12em] sm:flex">
          <span className="text-gold">✦</span>
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
          href="https://wa.me/201000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden text-[0.68rem] font-bold text-gold transition-colors hover:text-ivory sm:block"
        >
          تواصلي معنا
        </a>
      </div>
    </div>
  );
}
