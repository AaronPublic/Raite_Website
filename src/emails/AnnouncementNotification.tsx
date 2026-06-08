import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface AnnouncementNotificationProps {
  title: string;
  content: string;
  url?: string;
}

export const AnnouncementNotification = ({
  title,
  content,
  url,
}: AnnouncementNotificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Announcement from RAITE 2026: {title}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              <strong>RAITE 2026</strong>
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              We have a new announcement:
            </Text>
            <Heading className="text-black text-[20px] font-bold text-center p-0 my-[20px] mx-0">
              {title}
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              {content}
            </Text>
            {url && (
              <Section className="text-center mt-[32px] mb-[32px]">
                <Link
                  href={url}
                  className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                >
                  View on Facebook
                </Link>
              </Section>
            )}
            <Text className="text-black text-[14px] leading-[24px]">
              Best regards,<br />
              The RAITE 2026 Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AnnouncementNotification;
