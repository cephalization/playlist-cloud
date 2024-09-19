import { Link } from "@remix-run/react";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

export default function Login() {
  return (
    <section className="h-full w-full flex flex-col justify-center items-center gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">
            Playlist Cloud
          </CardTitle>
          <CardDescription>
            Visualize your Spotify playlists in 3D space.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>
            Login to your Spotify account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link className={cn(buttonVariants())} to="/spotify/login">
            Login with Spotify
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
