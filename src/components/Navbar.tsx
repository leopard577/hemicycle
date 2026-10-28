import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { type Page, PAGES, pathTo } from "@/lib/pages";
import { cn } from "@/lib/utils";

/** Top bar shared by every page: site name, navigation, theme choice */
export function Navbar({ page }: { page: Page | undefined }) {
  const nav = useRef<HTMLElement>(null);

  // On a phone the list scrolls: the current page's link must stay visible
  useEffect(() => {
    nav.current
      ?.querySelector("[aria-current=page]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [page]);

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 px-6 py-2">
        {/* On a phone the links take their own row and scroll horizontally when needed */}
        <NavigationMenu
          ref={nav}
          viewport={false}
          aria-label="Pages"
          className="order-last -mx-2 max-w-none basis-full justify-start overflow-x-auto py-1 [scrollbar-width:none] sm:order-none sm:mx-0 sm:basis-0"
        >
          <NavigationMenuList>
            {PAGES.map((p) => (
              <NavigationMenuItem key={p.id}>
                <NavigationMenuLink
                  asChild
                  active={p.id === page}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "data-active:bg-muted data-active:text-foreground",
                  )}
                >
                  <Link to={pathTo(p.id)}>{p.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
