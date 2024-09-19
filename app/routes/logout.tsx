import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authSession } from "~/lib/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await authSession.getSession(request.headers.get("Cookie"));
  session.unset("auth");
  return redirect("/", {
    headers: { "Set-Cookie": await authSession.commitSession(session) },
  });
};
