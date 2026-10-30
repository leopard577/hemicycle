import { useState } from "react";
import { Link } from "react-router";
import { MenuIcon, XIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { type Page, PAGES, pathTo } from "@/lib/pages";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const MAIN_PAGES = PAGES.filter((p) => !p.aside);
const ASIDE_PAGES = PAGES.filter((p) => p.aside);

/**
 * Top bar shared by every page. From md up, the links in one row, then the aside pages (À propos) and the theme
 * choice; on a phone, the site name, the theme choice and a menu button opening every page from the top.
 */
export function Navbar({ page }: { page: Page | undefined }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-x-4 px-4 py-2 sm:px-6">
        <Link to={pathTo(MAIN_PAGES[0].id)} className="font-heading text-lg font-semibold tracking-tight md:hidden">
          {SITE_NAME}
        </Link>

        <NavigationMenu
          viewport={false}
          aria-label="Pages"
          className="hidden max-w-none min-w-0 flex-1 justify-start md:flex"
        >
          <NavigationMenuList className="justify-start">
            {MAIN_PAGES.map((p) => (
              <NavigationMenuItem key={p.id}>
                <NavigationMenuLink
                  asChild
                  active={p.id === page}
                  className={cn(navigationMenuTriggerStyle(), "px-2.5 data-active:bg-muted data-active:text-foreground")}
                >
                  <Link to={pathTo(p.id)}>{p.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {ASIDE_PAGES.map((p) => (
            <Button
              key={p.id}
              asChild
              variant="ghost"
              className="hidden aria-[current=page]:bg-muted aria-[current=page]:text-foreground md:inline-flex"
            >
              <Link to={pathTo(p.id)} aria-current={p.id === page ? "page" : undefined}>
                {p.label}
              </Link>
            </Button>
          ))}
          <ThemeToggle />
          <MobileMenu page={page} />
        </div>
      </div>
    </header>
  );
}

/** Phone menu: every page as a large touch target, the current one marked */
function MobileMenu({ page }: { page: Page | undefined }) {
  const [open, setOpen] = useState(false);
  const item = (p: (typeof PAGES)[number]) => (
    <li key={p.id}>
      <SheetClose asChild>
        <Link
          to={pathTo(p.id)}
          aria-current={p.id === page ? "page" : undefined}
          className="flex h-12 items-center rounded-lg px-3 text-base font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-[current=page]:bg-muted aria-[current=page]:font-semibold"
        >
          {p.label}
        </Link>
      </SheetClose>
    </li>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" showCloseButton={false} className="gap-0 px-4 pt-2 pb-4 md:hidden">
        <div className="flex items-center justify-between py-1">
          <SheetTitle className="font-heading text-lg font-semibold tracking-tight">{SITE_NAME}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer le menu">
              <XIcon />
            </Button>
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">Pages du site</SheetDescription>
        <nav aria-label="Pages" className="pt-2">
          <ul className="space-y-1">{MAIN_PAGES.map(item)}</ul>
          <Separator className="my-2" />
          <ul>{ASIDE_PAGES.map(item)}</ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
