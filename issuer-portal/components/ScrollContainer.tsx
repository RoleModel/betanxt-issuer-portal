"use client";

import { Box, styled } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ScrollContainerProps {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical" | "both";
  height?: string | number;
  width?: string | number;
  className?: string;
  sx?: object;
}

const StyledScrollContainer = styled(Box, {
  shouldForwardProp: (prop) =>
    !["scrollDirection", "showStartShadow", "showEndShadow"].includes(
      prop as string
    ),
})<{
  scrollDirection: "horizontal" | "vertical" | "both";
  showStartShadow: boolean;
  onClick?: () => void;
  showEndShadow: boolean;
}>(({ theme, scrollDirection, showStartShadow, showEndShadow }) => {
  const isVertical =
    scrollDirection === "vertical" || scrollDirection === "both";
  const isHorizontal =
    scrollDirection === "horizontal" || scrollDirection === "both";

  return {
    position: "relative",
    overflow: "hidden",

    // Main scroll container
    "& .scroll-content": {
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    },

    // Vertical scroll shadows
    ...(isVertical && {
      "& .scroll-content::before, & .scroll-content::after": {
        content: '""',
        display: "block",
        position: "sticky",
        left: 0,
        right: 0,
        height: "12px",
        pointerEvents: "none",
        zIndex: 1,
        transition: "opacity 0.2s ease-in-out",
      },

      "& .scroll-content::before": {
        top: 0,
        background: `radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, 0.10), transparent)`,
        opacity: showStartShadow ? 1 : 0,
        ...theme.applyStyles("dark", {
          background: `radial-gradient(farthest-side at 50% 0, rgba(255, 255, 255, 0.10), transparent)`,
        }),
      },

      "& .scroll-content::after": {
        bottom: 0,
        background: `radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, 0.10), transparent)`,
        opacity: showEndShadow ? 1 : 0,
        ...theme.applyStyles("dark", {
          background: `radial-gradient(farthest-side at 50% 100%, rgba(255, 255, 255, 0.10), transparent)`,
        }),
      },
    }),

    // Horizontal scroll shadows
    ...(isHorizontal && {
      "&::before, &::after": {
        content: '""',
        display: "block",
        position: "absolute",
        top: "-10%",
        bottom: 0,
        width: "12px",
        pointerEvents: "none",
        zIndex: 1,
        transition: "opacity 0.2s ease-in-out",
      },

      "&::before": {
        left: 0,
        background: `radial-gradient(ellipse farthest-corner at left center, rgba(0, 0, 0, 0.10) 0%, transparent 75%)`,
        opacity: showStartShadow ? 1 : 0,
        ...theme.applyStyles("dark", {
          background: `radial-gradient(ellipse farthest-corner at left center, rgba(255, 255, 255, 0.10) 0%, transparent 75%)`,
        }),
      },

      "&::after": {
        right: 0,
        background: `radial-gradient(ellipse farthest-corner at right center, rgba(0, 0, 0, 0.10) 0%, transparent 60%)`,
        opacity: showEndShadow ? 1 : 0,
        ...theme.applyStyles("dark", {
          background: `radial-gradient(ellipse farthest-corner at right center, rgba(255, 255, 255, 0.10) 0%, transparent 60%)`,
        }),
      },
    }),
  };
});

const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  direction = "vertical",
  height = "100%",
  className,
  sx,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStartShadow, setShowStartShadow] = useState(false);
  const [showEndShadow, setShowEndShadow] = useState(false);

  const isVertical = direction === "vertical" || direction === "both";
  const isHorizontal = direction === "horizontal" || direction === "both";

  const updateShadows = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const threshold = 1; // pixels

    if (isHorizontal) {
      const canScrollLeft = element.scrollLeft > threshold;
      const canScrollRight =
        element.scrollLeft <
        element.scrollWidth - element.clientWidth - threshold;

      setShowStartShadow(canScrollLeft);
      setShowEndShadow(canScrollRight);
    }

    if (isVertical) {
      const canScrollUp = element.scrollTop > threshold;
      const canScrollDown =
        element.scrollTop <
        element.scrollHeight - element.clientHeight - threshold;
      setShowStartShadow(canScrollUp);
      setShowEndShadow(canScrollDown);
    }
  }, [isHorizontal, isVertical]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Initial check with a slight delay to ensure content is rendered
    const timer = setTimeout(() => {
      updateShadows();
    }, 100);

    // Add scroll listener
    element.addEventListener("scroll", updateShadows, { passive: true });

    // Add resize observer to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateShadows, 10);
    });
    resizeObserver.observe(element);

    return () => {
      clearTimeout(timer);
      element.removeEventListener("scroll", updateShadows);
      resizeObserver.disconnect();
    };
  }, [isVertical, isHorizontal, updateShadows]);

  // Drag-to-scroll (mouse + touch) for horizontal scrolling
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const suppressClickRef = useRef(false);

  const beginDrag = (clientX: number) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    el.classList.add("dragging");
    dragStartXRef.current = clientX - el.getBoundingClientRect().left;
    dragStartScrollLeftRef.current = el.scrollLeft;
  };

  const moveDrag = (clientX: number) => {
    const el = scrollRef.current;
    if (!el || !isDraggingRef.current) return;
    const x = clientX - el.getBoundingClientRect().left;
    const walk = (x - dragStartXRef.current) * 2; // Adjust multiplier for speed
    el.scrollLeft = dragStartScrollLeftRef.current - walk;
    // If user moved more than a few pixels, suppress the subsequent click
    if (Math.abs(x - dragStartXRef.current) > 3) {
      suppressClickRef.current = true;
    }
  };

  const endDrag = () => {
    const el = scrollRef.current;
    isDraggingRef.current = false;
    if (el) el.classList.remove("dragging");
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHorizontal) return;
    e.preventDefault();
    beginDrag(e.pageX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHorizontal || !isDraggingRef.current) return;
    e.preventDefault();
    moveDrag(e.pageX);
  };

  const handleMouseUp = () => {
    if (!isHorizontal) return;
    endDrag();
  };

  const handleMouseLeave = () => {
    if (!isHorizontal) return;
    endDrag();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isHorizontal) return;
    const touch = e.touches[0];
    if (!touch) return;
    beginDrag(touch.pageX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isHorizontal || !isDraggingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    moveDrag(touch.pageX);
  };

  const handleTouchEnd = () => {
    if (!isHorizontal) return;
    endDrag();
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent child click handlers after a drag gesture
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  return (
    <StyledScrollContainer
      scrollDirection={direction}
      showStartShadow={showStartShadow}
      showEndShadow={showEndShadow}
      className={className}
      sx={{
        ...sx,
      }}
    >
      <Box
        ref={scrollRef}
        className="scroll-content"
        sx={{
          ...(isHorizontal && {
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
            height: "auto",
            cursor: "grab",
            transition: "all 0.2s",
            transform: "scale(0.99)",
            "&.dragging": {
              cursor: "grabbing",
              userSelect: "none",
              transform: "scale(1)",
              willChange: "transform",
            },
          }),
          ...(isVertical && {
            overflowY: "auto",
            overflowX: "hidden",
            height: height === "100%" ? "100%" : height,
            width: "100%",
          }),
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
      >
        {children}
      </Box>
    </StyledScrollContainer>
  );
};

export default ScrollContainer;
