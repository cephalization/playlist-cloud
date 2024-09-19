import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
          <Button>Login with Spotify</Button>
        </CardContent>
      </Card>
    </section>
  );
}
