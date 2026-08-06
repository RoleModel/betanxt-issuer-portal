"use client";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Box, Container, Paper, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MeetingTabsScrollerProperties } from "./types";

import { MeetingTabItem } from "./MeetingTabItem";
import { ScrollButton } from "./styled";

export const MeetingTabsScroller = ({
  transformedMeetings,
  currentMeetingId,
  ticker,
  pathname,
  isMobile,
  isCSM,
}: MeetingTabsScrollerProperties) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // The active tab is a pure function of which meeting the URL points at, so it
  // is derived during render rather than held in state and reconciled by an
  // effect. The old arrangement rendered twice for every meeting change — once
  // for the incoming props, then again when the sync effect called setState —
  // and that second render is what kicked off the scroll effect below.
  const activeMeetingTab = useMemo(() => {
    if (
      currentMeetingId === undefined ||
      currentMeetingId.length === 0 ||
      transformedMeetings.length === 0
    ) {
      return 0;
    }

    const meetingIndex = transformedMeetings.findIndex(
      (m) => m.src.id === currentMeetingId
    );
    return meetingIndex === -1 ? 0 : meetingIndex;
  }, [currentMeetingId, transformedMeetings]);

  // Check scroll position and update button visibility (memoized)
  const checkScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 1); // Small tolerance for floating point precision
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // Helper function to scroll to active tab
  const scrollToActiveTab = useCallback(() => {
    if (scrollContainerRef.current && activeMeetingTab !== -1) {
      const container = scrollContainerRef.current;
      const activeTabEl = container.querySelector(
        `[data-tab-index="${activeMeetingTab}"]`
      );
      if (activeTabEl instanceof HTMLElement) {
        const tabLeft = activeTabEl.offsetLeft;
        const targetScroll =
          activeMeetingTab === 0 ? 0 : Math.max(0, tabLeft - 12);
        container.scrollTo({ left: targetScroll, behavior: "smooth" });
        checkScrollButtons();
      }
    }
  }, [activeMeetingTab, checkScrollButtons]);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeMeetingTab, scrollToActiveTab]);

  // Initial check and setup
  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => {
      checkScrollButtons();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [checkScrollButtons]);

  // Scroll functions (memoized)
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tabs = container.querySelectorAll<HTMLElement>("[data-tab-index]");

      if (tabs.length === 0) return;

      const currentScrollLeft = container.scrollLeft;

      if (currentScrollLeft <= 1) return;

      // Find the current leftmost visible tab
      let currentTabIndex = tabs.length - 1; // Default to last tab
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (tab.offsetLeft >= currentScrollLeft - 5) {
          // Small tolerance
          currentTabIndex = i;
          break;
        }
      }

      // Go to previous tab
      const targetIndex = Math.max(0, currentTabIndex - 1);
      const targetTab = tabs[targetIndex];

      // If target is the first tab, scroll to 0
      const targetScrollLeft = targetIndex === 0 ? 0 : targetTab.offsetLeft;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });

      // Recheck buttons after scroll animation
      setTimeout(() => {
        checkScrollButtons();
      }, 300);
    }
  }, [checkScrollButtons]);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const tabs = container.querySelectorAll<HTMLElement>("[data-tab-index]");

      if (tabs.length === 0) return;

      const currentScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      // If already at max scroll, don't scroll
      if (currentScrollLeft >= maxScrollLeft - 1) return;

      // Find the first tab that's completely hidden on the right
      let targetIndex = -1;

      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const tabLeft = tab.offsetLeft;

        // If this tab starts beyond the current visible area
        if (tabLeft >= currentScrollLeft + containerWidth) {
          targetIndex = i;
          break;
        }
      }

      // If no completely hidden tab found, find the first partially hidden one
      if (targetIndex === -1) {
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          const tabRight = tab.offsetLeft + tab.offsetWidth;

          // If this tab extends beyond the current view
          if (tabRight > currentScrollLeft + containerWidth) {
            targetIndex = i;
            break;
          }
        }
      }

      // If still no target found, scroll to the last tab
      if (targetIndex === -1) {
        targetIndex = tabs.length - 1;
      }

      const targetTab = tabs[targetIndex];

      // Calculate scroll position to fit the target tab in the visible area
      // We want to scroll just enough to show this tab, not necessarily position it at the left
      const targetTabRight = targetTab.offsetLeft + targetTab.offsetWidth;
      const neededScroll =
        targetTabRight - (currentScrollLeft + containerWidth);

      let targetScrollLeft;
      if (neededScroll > 0) {
        // Scroll just enough to show the tab
        targetScrollLeft = Math.min(
          currentScrollLeft + neededScroll,
          maxScrollLeft
        );
      } else {
        // Tab is already visible, scroll to its left position
        targetScrollLeft = Math.min(targetTab.offsetLeft, maxScrollLeft);
      }

      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });

      // Recheck buttons after scroll animation
      setTimeout(() => {
        checkScrollButtons();
      }, 300);
    }
  }, [checkScrollButtons]);

  return (
    <Paper
      sx={(theme) => ({
        borderBottom: "1px solid",
        borderColor: theme.vars.palette.divider,
        borderRadius: 0,
        boxShadow: "none",
        background: theme.vars.palette.tableCellRow.fill,
        position: "relative", // Add relative positioning
        "& .MuiPaper-root": {
          borderRadius: 0,
        },
      })}
    >
      <Container maxWidth="xl" sx={{ position: "relative" }}>
        {/* Left Scroll Button - Only show for active meetings with multiple tabs */}
        {canScrollLeft && transformedMeetings.length > 1 ? (
          <ScrollButton
            direction="left"
            onClick={scrollLeft}
            aria-label="Scroll meetings left"
          >
            <ArrowDropDownIcon />
          </ScrollButton>
        ) : null}

        {/* Right Scroll Button - Only show for active meetings with multiple tabs */}
        {canScrollRight && transformedMeetings.length > 1 ? (
          <ScrollButton
            direction="right"
            onClick={scrollRight}
            aria-label="Scroll meetings right"
          >
            <ArrowDropDownIcon />
          </ScrollButton>
        ) : null}

        <Box
          ref={scrollContainerRef}
          onScroll={checkScrollButtons}
          sx={{
            py: 0,
            px: { xs: 1, sm: 0 },
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "visible", // Allow vertical overflow for the covering line
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          <Stack
            direction="row"
            sx={(theme) => ({
              borderLeft: "1px solid",
              borderColor: theme.vars.palette.divider,
            })}
          >
            {transformedMeetings.map(({ tab, src }, index) => (
              <MeetingTabItem
                key={tab.id}
                meeting={tab}
                src={src}
                index={index}
                currentMeetingId={currentMeetingId}
                ticker={ticker}
                pathname={pathname}
                isMobile={isMobile}
                isCSM={isCSM}
              />
            ))}
          </Stack>
        </Box>
      </Container>
    </Paper>
  );
};
