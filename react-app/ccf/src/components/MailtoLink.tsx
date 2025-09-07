import React from 'react';
import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material';

interface MailtoLinkProps extends MuiLinkProps {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    body?: string;
    children: React.ReactNode;
}

const MailtoLink: React.FC<MailtoLinkProps> = ({
    to,
    cc,
    bcc,
    subject,
    body,
    children,
    ...rest
}) => {
    const formatList = (list: string | string[] | undefined) =>
        Array.isArray(list) ? list.join(',') : list;

    let link = `mailto:${formatList(to)}`;

    const queryParts: string[] = [];

    if (cc) queryParts.push(`cc=${encodeURIComponent(formatList(cc) || '')}`);
    if (bcc) queryParts.push(`bcc=${encodeURIComponent(formatList(bcc) || '')}`);
    if (subject) queryParts.push(`subject=${encodeURIComponent(subject)}`);
    if (body) queryParts.push(`body=${encodeURIComponent(body)}`);

    if (queryParts.length > 0) {
        link += `?${queryParts.join('&')}`;
    }

    return <MuiLink href={link} {...rest}>{children}</MuiLink>;
};

export default MailtoLink;
