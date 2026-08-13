// Leaving the form while editing an already-submitted application throws the
// edits away: unlike a draft, a submitted application is only written by the
// updateApplication callable on "Save Changes", so there is nothing saved to
// come back to. Shared by ApplicationForm and NRApplicationForm so the wording
// and the guard stay identical across grant types.

export const EXIT_EDIT_BUTTON_LABEL = 'Exit Without Saving';

export const EXIT_EDIT_HINT =
    'Editing a submitted application: your changes are only saved when you reach the Review page and select "Save Changes". Leaving before then discards them.';

const EXIT_EDIT_CONFIRM =
    'Leave without saving?\n\nYour changes to this submitted application will be lost. ' +
    'To keep them, cancel and continue to the Review page, then select "Save Changes".';

// Returns true when the user confirmed they want to discard their edits.
export const confirmDiscardEdits = (): boolean => window.confirm(EXIT_EDIT_CONFIRM);
