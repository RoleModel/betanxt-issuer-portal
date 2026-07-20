"use client";

import { Check } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import GearProcessIcon from "@rolemodel/betanxt-design-system/components/icons/brand/GearProcessIcon";
import StarBadgeIcon from "@rolemodel/betanxt-design-system/components/icons/brand/StarBadgeIcon";
import TeamDiscussionIcon from "@rolemodel/betanxt-design-system/components/icons/brand/TeamDiscussionIcon";
import React from "react";

import DocumentViewer from "@/components/Documents/DocumentViewer";
import FeatureTile from "@/components/FeatureTile";
import ProductsLayout from "@/components/Layout/ProductLayout";
import CTACard from "@/components/Products/CTACard";
import { SidebarCard } from "@/components/Products/SidebarCard";
import VideoPlayer from "@/components/Video/VideoPlayer";
import VideoPlayerDialog from "@/components/Video/VideoPlayerDialog";

export default function DigitalShareholderMeetingsPage() {
  const [open, setOpen] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string>("");
  const [viewerTitle, setViewerTitle] = React.useState<string>("");
  const [isVideoOpen, setIsVideoOpen] = React.useState(false);

  const benefits = [
    {
      icon: <StarBadgeIcon accentColor="#ebb322" fontSize="3xl" />,
      title: "High-touch service produces successful meetings",
      description:
        "Client service is the linchpin of all our solutions. An experienced support professional will work with you to plan, manage and execute your digital meeting - and, if you choose, join you on dry runs and prep calls. In addition, BetaNXT provides technical guidance, ensuring a flawless meeting.",
    },
    {
      icon: <GearProcessIcon accentColor="#ebb322" fontSize="3xl" />,
      title: "Customization promotes your brand",
      description:
        "Annual meetings are an opportunity to communicate the company&apos;s values and remind shareholders why they&apos;ve invested in you. Capitalize on this with a company-branded meeting website, registration page and emails.",
    },
    {
      icon: <TeamDiscussionIcon accentColor="#ebb322" fontSize="3xl" />,
      title: "Effectively respond to shareholder questions",
      description:
        "How effectively you respond to your shareholder&apos;s questions can determine the success of your meeting. DSM helps you achieve this by enabling you to group questions by topic, ensuring the right person addresses the question. You can also prioritize questions and view their status.",
    },
  ];

  const features = [
    {
      name: "Effortless registration for both registered and beneficial owners",
      essential: true,
    },
    { name: "Audio and video meetings supported", essential: true },
    {
      name: "Company-branded event website, registration page and emails",
      essential: true,
    },
    { name: "Group and prioritize shareholder questions", essential: true },
    {
      name: "View list of registered owners eligible to vote during the meeting",
      essential: true,
    },
    { name: "Online voting", essential: true },
    { name: "Identification of shareholder asking question", essential: true },
    {
      name: "Meeting recording and archive with replays on demand",
      essential: true,
    },
    { name: "Reports with meeting metrics", essential: true },
    { name: "Follow-up with shareholders", essential: true },
  ];

  const leftColumnContent = (
    <Stack gap={2}>
      <Typography variant="body1">
        <strong>MIC Digital Shareholder Meeting (DSM)</strong> enables
        shareholders to participate in annual meetings remotely with the same
        level of access as in-person attendees - they can view, vote, and ask
        questions. DSM also allows you to shape your meeting to best facilitate
        your shareholders&apos; engagement with ease of access on any device,
        real-time voting, questions, polling, and more. Combined with the
        platform&apos;s Q&A management capabilities, branding options, and
        high-touch service, DSM is the industry&apos;s most innovative and
        leading platform.
      </Typography>
      <Card>
        <CardHeader title="Benefits" />
        <CardContent
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 2,
          }}
        >
          {benefits.map((benefit, index) => (
            <FeatureTile
              key={index}
              brandFont={true}
              titleVariant="h1"
              variant="base"
              title={benefit.title}
              description={benefit.description}
              actionText={""}
              icon={benefit.icon}
            />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Features" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableBody>
                {features.map((feature, index) => (
                  <TableRow key={index}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell align="center">
                      {feature.essential ? <Check color="success" /> : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <CTACard />
    </Stack>
  );

  const rightColumnContent = (
    <Stack spacing={2}>
      <SidebarCard
        title="DSM Quickstart Guide"
        button={true}
        buttonText="Open PDF Guide"
        onClick={() => {
          setFileUrl("/documents/DSM-Quick-Start-Guide.pdf");
          setViewerTitle("DSM Quickstart Guide");
          setOpen(true);
        }}
      >
        <Typography variant="body3" component="p">
          View the DSM Quickstart Guide for a step-by-step overview of how to
          run your next virtual shareholder meeting.
        </Typography>
      </SidebarCard>

      <SidebarCard title="Want to Know More?">
        <Typography variant="body3" component="p" sx={{ mb: 2 }}>
          Our Digital Shareholder Meeting solution provides equal access for all
          shareholders, enabling seamless registration and effortless
          participation.
        </Typography>
        <Box
          aria-label="Play Digital Shareholder Meeting demo video"
          tabIndex={0}
          role="button"
          onClick={() => setIsVideoOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsVideoOpen(true);
            }
          }}
          sx={{
            "&:focusVisible": {
              outline: "2px solid",
              outlineColor: (theme) => theme.vars.palette.primary.main,
              outlineOffset: 2,
              borderRadius: 1,
            },
          }}
        >
          <VideoPlayer
            poster="/images/digital-shareholder-meeting-video-1.webp"
            title=""
            description=""
            showPlayButton={false}
          />
        </Box>
      </SidebarCard>
    </Stack>
  );

  return (
    <>
      <ProductsLayout
        leftColumnContent={leftColumnContent}
        rightColumnContent={rightColumnContent}
        documentViewer={
          <DocumentViewer
            open={open}
            onClose={() => setOpen(false)}
            fileUrl={fileUrl}
            title={viewerTitle}
          />
        }
      />
      <VideoPlayerDialog
        open={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        src="/digital-shareholder-meeting.mp4"
        title="BetaNXT Digital Shareholder Meeting"
        description="See how our platform transforms virtual shareholder meetings"
        poster="/images/digital-shareholder-meeting-video-1.webp"
      />
    </>
  );
}
