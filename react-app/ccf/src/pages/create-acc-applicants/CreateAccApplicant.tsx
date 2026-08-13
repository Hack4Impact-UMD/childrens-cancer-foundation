import CreateAccountForm from "../create-account/CreateAccountForm";
import { addApplicantUser } from "../../users/usermanager";
import { UserData } from "../../types/usertypes";

function AccountPageApplicants(): JSX.Element {
  const submit = (userData: UserData, password: string) =>
    addApplicantUser(userData, password);

  const mapError = (e: any): string => {
    const code = e?.code;
    const message = typeof e?.message === "string" ? e.message : "";
    if (code === "auth/email-already-in-use" || message.includes("EMAIL_EXISTS")) {
      return "An account with this email already exists. Please log in instead.";
    }
    return "Something went wrong while creating your account. Please try again.";
  };

  return (
    <CreateAccountForm role="applicant" onSubmit={submit} mapSubmitError={mapError} />
  );
}

export default AccountPageApplicants;
