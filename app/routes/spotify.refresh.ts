import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { authSession, refreshAuth, setAuth } from "~/lib/auth.server";

export const action = async (args: ActionFunctionArgs) => {
  try {
    const { request } = args;
    const { refreshToken } = await request.json();
    invariant(typeof refreshToken === "string", "refreshToken is required");

    const r = await refreshAuth(refreshToken);
    const session = await authSession.getSession(request.headers.get("Cookie"));

    return json(r, {
      headers: {
        "Set-Cookie": await authSession.commitSession(session),
      },
    });
  } catch (e) {
    console.error(e);
    throw redirect("/login");
  }
};
