import { createAuthClient } from "better-auth/client";
import { phoneNumberClient } from "better-auth/client/plugins";
import { useStore } from "@tanstack/react-store";
import { useNavigate } from "@tanstack/react-router";

export const authClient = createAuthClient({
  plugins: [phoneNumberClient()],
});

export function useAuth() {
  const navigate = useNavigate();
  const _session = useStore(authClient.useSession);

  const session = _session as {
    data?: {
      user: { id: string; name: string; email: string; image?: string | null } | null;
    } | null;
  } | null;

  const user = session?.data?.user
    ? {
        name: session.data.user.name ?? session.data.user.email ?? "User",
        email: session.data.user.email ?? "",
        district: "",
        avatar: session.data.user.image ?? undefined,
      }
    : null;

  return {
    user,
    isSignedIn: !!session?.data?.user,
    signIn: {
      google: () => authClient.signIn.social({ provider: "google" }),
      phone: (phoneNumber: string) => authClient.phoneNumber.sendOtp({ phoneNumber }),
    },
    signOut: async () => {
      await authClient.signOut();
      navigate({ to: "/" });
    },
  };
}
