export default interface MailtoLinkProps {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    body?: string;
    children: React.ReactNode; // The clickable content (link text, button, etc.)
}
