import CreateAccountForm from "../create-account/CreateAccountForm";
import { addReviewerUser } from "../../users/usermanager";
import { UserData } from "../../types/usertypes";
import { auth } from "../../index";

function AccountPageReviewers(): JSX.Element {
  const submit = async (userData: UserData, password: string) => {
    // addReviewerUser handles auth creation + the addReviewerRole cloud function,
    // which rejects non-whitelisted emails (surfaced via mapError below).
    await addReviewerUser(userData, password);

    // Force a token refresh so the new custom claim is active, then give
    // Firebase a moment to propagate it before we navigate to login.
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const mapError = (e: any): string => {
    const msg = String(e?.message || "").toLowerCase();
    if (msg.includes("whitelist")) {
      return "This email does not have permission to create a reviewer account. Please contact CCF if you believe this to be a mistake.";
    }
    console.error("Error creating reviewer account:", e);
    return "Something went wrong creating your account. Please try again, or contact CCF if the problem persists.";
  };

  return (
    <CreateAccountForm role="reviewer" onSubmit={submit} mapSubmitError={mapError} />
  );
}

export default AccountPageReviewers;
