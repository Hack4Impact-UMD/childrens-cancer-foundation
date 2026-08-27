import { FaPrint } from "react-icons/fa";
import "./PrintButton.css";

type PrintButtonProps = {
    label?: string;
};

/**
 * Opens the browser's print dialog, which also offers "Save as PDF".
 * The surrounding content must be marked with `printable-instructions`
 * (see PrintButton.css) so only that section reaches the page.
 */
function PrintButton({ label = "Print / Save as PDF" }: PrintButtonProps): JSX.Element {
    return (
        <button
            type="button"
            className="print-button no-print"
            onClick={() => window.print()}
        >
            <FaPrint aria-hidden="true" /> {label}
        </button>
    );
}

export default PrintButton;
