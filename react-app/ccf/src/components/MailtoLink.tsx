// react-app/ccf/src/components/MailtoLink.tsx

import React from 'react';
import MailtoLinkProps from "../types/MailToLinkTypes";


const MailtoLink: React.FC<MailtoLinkProps> = ({
                                                   to,
                                                   cc,
                                                   bcc,
                                                   subject,
                                                   body,
                                                   children
                                               }) => {
    // Helper function to handle either a single string or an array of strings
    // Converts arrays into a comma-separated string
    const formatList = (list: string | string[] | undefined) =>
        Array.isArray(list) ? list.join(',') : list;

    let link = `mailto:${formatList(to)}`;

    const queryParts: string[] = [];

    if (cc) queryParts.push(`cc=${encodeURIComponent(formatList(cc) || '')}`);
    if (bcc) queryParts.push(`bcc=${encodeURIComponent(formatList(bcc) || '')}`);
    if (subject) queryParts.push(`subject=${encodeURIComponent(subject)}`);
    if (body) queryParts.push(`body=${encodeURIComponent(body)}`);

    // If any parameters were added, join them with "&" and attach to the mailto link
    if (queryParts.length > 0) {
        link += `?${queryParts.join('&')}`;
    }

    return <a href={link}>{children}</a>;
};

export default MailtoLink;
