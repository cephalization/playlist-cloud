import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getAuth } from "~/lib/auth.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const authenticated = await getAuth(args, { redirectTo: "/login" });
  invariant(authenticated, "Not authenticated");
  return json({});
};

export default function Index() {
  return <Outlet />;
}
