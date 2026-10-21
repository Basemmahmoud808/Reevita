"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `accordion-panel-${index}`;
        const buttonId = `accordion-button-${index}`;
        return (
          <div key={item.title}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-5 text-start transition-colors hover:text-gold-deep"
              >
                <span className="display-md text-[1.05rem] md:text-[1.15rem]">{item.title}</span>
                <ChevronDown
                  className={cn("size-5 shrink-0 text-gold-deep transition-transform duration-300", open && "rotate-180")}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="pb-6 text-sm leading-8 text-muted"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
