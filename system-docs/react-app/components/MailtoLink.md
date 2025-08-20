# MailtoLink

This component creates a link that opens the user's default email client.

## Props

```typescript
interface MailtoLinkProps {
  mailTo: string;
  label: string;
}
```

## Logic

- It creates an `<a>` tag with an `href` attribute that is a `mailto:` link.
