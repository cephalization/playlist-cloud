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
    <section className="h-full w-full flex flex-col justify-center items-center">
      <Card>
        <CardHeader>
          <CardTitle>Login with Spotify</CardTitle>
          <CardDescription>
            Login to your Spotify account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={cn(buttonVariants())} to="/spotify/login">
            Login with Spotify
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}
