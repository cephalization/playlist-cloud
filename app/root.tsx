import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";

import "./tailwind.css";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TooltipProvider } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "Playlist Cloud" },
    { name: "description", content: "Visualize your Spotify playlists in 3D" },
  ];
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    as: "style",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-screen w-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
  );
}

export const ErrorBoundary = () => {
  return (
    <html>
      <head>
        <title>Playlist Cloud | Error</title>
        <Meta />
        <Links />
      </head>
      <body className="h-screen w-screen flex flex-col items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Something is broken...</CardTitle>
            <CardDescription>
              Sorry about that! Maybe try logging in again?
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link className={cn(buttonVariants())} to="/login">
              Login again
            </Link>
          </CardFooter>
        </Card>
        <Scripts />
      </body>
    </html>
  );
};
