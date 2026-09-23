import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

export function AuthEmail({
  heading,
  preview,
  message,
  actionLabel,
  actionUrl,
}: {
  heading: string;
  preview: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f4f1e9", fontFamily: "Arial, sans-serif", padding: "32px 12px" }}>
        <Container style={{ backgroundColor: "#fffdf8", border: "1px solid #ded7c8", borderRadius: 18, padding: 32, maxWidth: 560 }}>
          <Text style={{ color: "#9b5f3f", fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>RACANA</Text>
          <Heading style={{ color: "#17382d", fontSize: 30 }}>{heading}</Heading>
          <Text style={{ color: "#5f665f", fontSize: 16, lineHeight: 1.6 }}>{message}</Text>
          <Button href={actionUrl} style={{ backgroundColor: "#17382d", color: "#ffffff", borderRadius: 999, padding: "13px 22px", fontWeight: 700, marginTop: 16 }}>{actionLabel}</Button>
        </Container>
      </Body>
    </Html>
  );
}
