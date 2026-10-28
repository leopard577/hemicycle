import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { type Page, PAGES, pathTo } from "@/lib/pages";
import { cn } from "@/lib/utils";

/** Top bar shared by every page: navigation, then the aside pages (À propos) and the theme choice */
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
      <div className="mx-auto flex w-full max-w-5xl items-center gap-x-1 px-4 py-1 sm:gap-x-4 sm:px-6 sm:py-2">
        {/* One row everywhere: on a phone the links are tightened to fit beside the theme button, and only
            scroll on the narrowest screens */}
        <NavigationMenu
          ref={nav}
          viewport={false}
          aria-label="Pages"
          className="-ml-1 max-w-none min-w-0 flex-1 justify-start overflow-x-auto py-1 [scrollbar-width:none] sm:ml-0"
        >
          <NavigationMenuList className="justify-start">
            {PAGES.filter((p) => !p.aside).map((p) => (
              <NavigationMenuItem key={p.id}>
                <NavigationMenuLink
                  asChild
                  active={p.id === page}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "px-1 text-[14px] data-active:bg-muted data-active:text-foreground sm:px-2.5 sm:text-sm",
                  )}
                >
                  <Link to={pathTo(p.id)}>{p.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex shrink-0 items-center gap-1">
          {PAGES.filter((p) => p.aside).map((p) => (
            <Button
              key={p.id}
              asChild
              variant="ghost"
              className="hidden aria-[current=page]:bg-muted aria-[current=page]:text-foreground sm:inline-flex"
            >
              <Link to={pathTo(p.id)} aria-current={p.id === page ? "page" : undefined}>
                {p.label}
              </Link>
            </Button>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
