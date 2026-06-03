import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

interface RegistrationConfirmationEmailProps {
  userName: string;
  eventTitle: string;
}

export const RegistrationConfirmationEmail = ({
  userName,
  eventTitle,
}: RegistrationConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Registration Received: {eventTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Registration Received</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>
          Thank you for registering for <strong>{eventTitle}</strong>. Your registration has been received and is currently being reviewed by our team.
        </Text>
        <Section style={section}>
          <Text style={text}>
            What happens next?
            <br />
            1. An admin will review your uploaded requirements.
            <br />
            2. You will receive another email once your registration is approved or if more information is needed.
          </Text>
        </Section>
        <Text style={text}>
          If you have any questions, feel free to contact us.
        </Text>
        <Text style={footer}>
          PSITE Region III - RAITE Registration Platform
        </Text>
      </Container>
    </Body>
  </Html>
);

export default RegistrationConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const section = {
  padding: "24px",
  backgroundColor: "#f4f4f4",
  margin: "24px 40px",
  borderRadius: "8px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "48px",
};
