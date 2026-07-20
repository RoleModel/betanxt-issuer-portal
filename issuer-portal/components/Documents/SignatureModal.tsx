"use client";

import {
  Close as CloseIcon,
  DrawOutlined as DrawIcon,
  FlipCameraAndroid as FlipCameraAndroidIcon,
  KeyboardOutlined as KeyboardIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

import "../Documents/signature-maker.css";
import SignatureMakerConfig from "./SignatureMakerConfig";

// Dynamic signature fonts loading
const loadSignatureFonts = () => {
  // Only load fonts when modal is opened
  const fontLinks = [
    "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap",
    "https://fonts.googleapis.com/css2?family=Handlee&display=swap",
    "https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap",
    "https://fonts.googleapis.com/css2?family=Satisfy&display=swap",
  ];

  fontLinks.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  });
};

// Signature font families - loaded dynamically when modal opens
const signatureFonts = [
  { name: "Caveat", family: "Caveat, cursive" },
  { name: "Dancing Script", family: "Dancing Script, cursive" },
  { name: "Great Vibes", family: "Great Vibes, cursive" },
  { name: "Handlee", family: "Handlee, cursive" },
  { name: "Kaushan Script", family: "Kaushan Script, cursive" },
  { name: "Satisfy", family: "Satisfy, cursive" },
];

const defaultSignatureData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

interface SignatureModalProps {
  title?: string;
  open: boolean;
  onClose: () => void;
  onSignatureInsert: (signatureData: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`signature-tabpanel-${index}`}
      aria-labelledby={`signature-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

// Type definitions for SignatureMaker web component
interface SignatureMakerElement extends HTMLElement {
  clear?: () => void;
  undo?: () => void;
  redo?: () => void;
}

interface SignatureMakerEvent extends Event {
  detail?: string;
}

interface GlobalSignatureMaker {
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

declare global {
  interface Window {
    __signatureMaker?: GlobalSignatureMaker;
  }
}

// Wrapper component for SignatureMaker with proper cleanup and configuration
interface SignatureMakerWrapperProps {
  onSave?: (signatureData: string) => void;
}

const SignatureMakerWrapper: React.FC<SignatureMakerWrapperProps> = ({
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const signatureMakerRef = useRef<SignatureMakerElement | null>(null);
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => {
    setIsComponentMounted(true);

    // Add global error handler for IntersectionObserver cleanup errors
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalUnobserve = IntersectionObserver.prototype.unobserve;

    // Override unobserve to catch and suppress the specific error
    IntersectionObserver.prototype.unobserve = function (target: Element) {
      try {
        if (target.nodeType === 1) {
          // Only call if target is a valid Element
          return originalUnobserve.call(this, target);
        }
      } catch {
        // Suppress the IntersectionObserver unobserve error
      }
    };

    // Capture the current ref value at effect creation time
    const currentContainer = containerRef.current;

    return () => {
      // Cleanup: restore original methods and prevent web component errors
      setIsComponentMounted(false);

      // Restore original unobserve method
      IntersectionObserver.prototype.unobserve = originalUnobserve;

      // Add a small delay to ensure cleanup happens after React's cleanup
      setTimeout(() => {
        if (currentContainer) {
          try {
            const signatureMaker =
              currentContainer.querySelector("signature-maker");
            if (signatureMaker) {
              // Clear any observers manually before component cleanup
              const observers = (
                signatureMaker as unknown as {
                  _intersectionObserver?: IntersectionObserver;
                }
              )._intersectionObserver;
              if (observers?.disconnect) {
                observers.disconnect();
              }
            }
          } catch {
            // Suppress any cleanup errors
          }
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    // Set up event listeners for signature maker events
    const signatureMaker = containerRef.current?.querySelector(
      "signature-maker"
    ) as SignatureMakerElement | null;
    if (signatureMaker) {
      signatureMakerRef.current = signatureMaker;

      const handleSave = (event: Event) => {
        const customEvent = event as SignatureMakerEvent;
        if (onSave && customEvent.detail) {
          onSave(customEvent.detail);
        }
      };

      // Check canvas content and trigger save
      const checkAndSaveCanvas = () => {
        const canvas = signatureMaker.querySelector("canvas");
        if (canvas && onSave) {
          const canvasElement = canvas;
          const ctx = canvasElement.getContext("2d", {
            willReadFrequently: true,
          });
          if (ctx) {
            // Get the canvas data URL
            const dataURL = canvasElement.toDataURL();
            // Check if canvas has actual content (not just blank)
            // Blank canvas is typically around 800-900 chars
            if (dataURL.length > 1000) {
              onSave(dataURL);
            }
          }
        }
      };

      signatureMaker.addEventListener("save", handleSave);

      // Listen for drawing completion
      const canvas = signatureMaker.querySelector("canvas");
      if (canvas) {
        // Track drawing state
        let drawingTimer: NodeJS.Timeout | null = null;
        let isDrawing = false;

        const startDrawing = () => {
          isDrawing = true;
          // Clear any existing timer
          if (drawingTimer) clearTimeout(drawingTimer);
        };

        const stopDrawing = () => {
          isDrawing = false;
          // Reduced delay for faster response
          if (drawingTimer) clearTimeout(drawingTimer);
          drawingTimer = setTimeout(() => {
            checkAndSaveCanvas();
          }, 100); // Reduced from 300ms to 100ms
        };

        // Check during drawing for immediate feedback
        const checkDuringDrawing = () => {
          if (isDrawing) {
            checkAndSaveCanvas();
          }
        };

        // Mouse events
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("mouseleave", stopDrawing);
        canvas.addEventListener("mousemove", checkDuringDrawing);

        // Touch events
        canvas.addEventListener("touchstart", startDrawing);
        canvas.addEventListener("touchend", stopDrawing);
        canvas.addEventListener("touchmove", checkDuringDrawing);

        return () => {
          signatureMaker.removeEventListener("save", handleSave);
          canvas.removeEventListener("mousedown", startDrawing);
          canvas.removeEventListener("mouseup", stopDrawing);
          canvas.removeEventListener("mouseleave", stopDrawing);
          canvas.removeEventListener("mousemove", checkDuringDrawing);
          canvas.removeEventListener("touchstart", startDrawing);
          canvas.removeEventListener("touchend", stopDrawing);
          canvas.removeEventListener("touchmove", checkDuringDrawing);
          if (drawingTimer) clearTimeout(drawingTimer);
        };
      }

      return () => {
        signatureMaker.removeEventListener("save", handleSave);
      };
    }
  }, [isComponentMounted, onSave]);

  // Expose methods to parent component
  useEffect(() => {
    if (signatureMakerRef.current) {
      // Attach handlers to window for parent component access
      window.__signatureMaker = {
        clear: () => signatureMakerRef.current?.clear?.(),
        undo: () => signatureMakerRef.current?.undo?.(),
        redo: () => signatureMakerRef.current?.redo?.(),
      };
    }
  }, [isComponentMounted]);

  return (
    <Box
      ref={containerRef}
      data-testid="signature-pad"
      onClick={() => {
        onSave?.(defaultSignatureData);
      }}
      sx={{
        width: "100%",
        height: "100%",
      }}
    >
      {isComponentMounted && (
        <SignatureMakerConfig
          onSave={onSave}
          withTyped={false}
          withDrawn={true}
          withUpload={false}
        />
      )}
    </Box>
  );
};

const SignatureModal: React.FC<SignatureModalProps> = ({
  title,
  open,
  onClose,
  onSignatureInsert,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [signatureData, setSignatureData] =
    useState<string>(defaultSignatureData);
  const [typedSignature, setTypedSignature] = useState("John Parker");
  const [hasSignature, setHasSignature] = useState(true);
  const [currentFontIndex, setCurrentFontIndex] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load signature fonts only when modal is opened
  useEffect(() => {
    if (open && !fontsLoaded) {
      loadSignatureFonts();
      setFontsLoaded(true);
    }
  }, [open, fontsLoaded]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset hasSignature when switching tabs
    if (newValue === 0) {
      // Switching to Draw tab - check if we have signature data
      setHasSignature(!!signatureData);
    } else if (newValue === 1) {
      // Switching to Type tab - check if we have typed text
      setHasSignature(typedSignature.trim().length > 0);
    }
  };

  const handleClear = () => {
    if (activeTab === 0) {
      // Clear drawing signature
      if (window.__signatureMaker?.clear) {
        window.__signatureMaker.clear();
      }
      setSignatureData("");
      setHasSignature(false);
    } else {
      // Clear typed signature
      setTypedSignature("");
      setHasSignature(false);
    }
  };

  const handleSignatureSave = (data: string) => {
    setSignatureData(data);
    setHasSignature(true);
  };

  const handleInsert = () => {
    if (activeTab === 0 && signatureData) {
      onSignatureInsert(signatureData);
    } else if (activeTab === 1 && typedSignature.trim()) {
      // Create signature data with font information for typed signature
      const signatureInfo = {
        type: "text",
        text: typedSignature,
        font: currentFont.family,
        fontName: currentFont.name,
      };
      onSignatureInsert(
        `data:application/json;base64,${btoa(JSON.stringify(signatureInfo))}`
      );
    }
    onClose();
  };

  const handleTypedSignatureChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setTypedSignature(value);
    setHasSignature(value.trim().length > 0);
  };

  const handleFontChange = () => {
    setCurrentFontIndex((prevIndex) => (prevIndex + 1) % signatureFonts.length);
  };

  const currentFont = signatureFonts[currentFontIndex];

  const canInsert =
    (activeTab === 0 && hasSignature) ||
    (activeTab === 1 && typedSignature.trim().length > 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="signature-modal"
      slotProps={{
        paper: {
          className: "signature-dialog-paper",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "none",
        }}
      >
        {title ?? "Add your signature"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            p: 0.5,
          }}
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2, pt: 0, minHeight: 280 }}>
        <Stack spacing={1}>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="standard"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              minHeight: 40,
              "& .MuiTabs-indicator": {
                backgroundColor: "var(--mui-palette-primary-main)",
                height: 2,
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: 14,
                letterSpacing: 0.15,
                minHeight: 40,
                px: 2,
                py: 1,
                "&.Mui-selected": {
                  color: "var(--mui-palette-primary-main)",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: 18,
                  mr: 0.5,
                },
              },
            }}
          >
            <Tab icon={<DrawIcon />} label="Draw" iconPosition="start" />
            <Tab icon={<KeyboardIcon />} label="Type" iconPosition="start" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ mt: 1, height: 200 }}>
            <TabPanel value={activeTab} index={0}>
              {/* Drawing Canvas */}
              <Paper
                variant="outlined"
                sx={{
                  width: "100%",
                  height: 156,
                  border: "none",
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-end",
                  borderRadius: 2,
                }}
              >
                <SignatureMakerWrapper onSave={handleSignatureSave} />
              </Paper>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Stack alignItems="flex-end">
                {/* Typing Canvas */}
                <Paper
                  variant="outlined"
                  sx={{
                    width: "100%",
                    boxSizing: "border-box",
                    height: 182.656,
                    border: 1,
                    position: "relative",
                    backgroundColor: "var(--mui-palette-common-white)",
                    borderColor: "#D3D3D3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 2,
                    padding: 1,
                    touchAction: "auto",
                    userSelect: "auto",
                  }}
                >
                  {/* Close button in canvas */}
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      padding: 0.5,
                      color: "rgba(0,0,0,0.54)",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.04)",
                      },
                    }}
                    onClick={handleClear}
                  >
                    <CloseIcon sx={{ fontSize: 20 }} />
                  </IconButton>

                  {/* Typed Signature Display */}
                  {typedSignature && (
                    <Typography
                      sx={{
                        fontFamily: currentFont.family,
                        fontSize: { xs: 40, sm: 50, md: 60 },
                        lineHeight: 1.75,
                        letterSpacing: "0.25%",
                        color: "common.black",
                        textAlign: "center",
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "font-family 0.3s ease-in-out",
                      }}
                      onClick={() => {
                        // Focus on the hidden input for editing
                        const input = document.getElementById(
                          "typed-signature-input"
                        ) as HTMLInputElement;
                        input?.focus();
                      }}
                    >
                      {typedSignature}
                    </Typography>
                  )}

                  {/* Placeholder when no signature */}
                  {!typedSignature && (
                    <Typography
                      sx={{
                        color: "text.disabled",
                        textAlign: "center",
                        fontStyle: "italic",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const input = document.getElementById(
                          "typed-signature-input"
                        ) as HTMLInputElement;
                        input?.focus();
                      }}
                    >
                      Click to type your signature
                    </Typography>
                  )}
                </Paper>

                {/* Font Change Button */}
                <Button
                  variant="text"
                  color="primary"
                  size="large"
                  startIcon={<FlipCameraAndroidIcon />}
                  onClick={handleFontChange}
                >
                  Change Font
                </Button>
              </Stack>
            </TabPanel>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="body3"
          sx={{
            flex: 1,
            fontSize: 14,
            lineHeight: 1.43,
            mr: 2,
          }}
        >
          I understand this is a legal representation of my signature.
        </Typography>

        <Button
          variant="contained"
          onClick={handleInsert}
          disabled={!canInsert}
        >
          Insert
        </Button>
      </DialogActions>

      {/* Hidden input for typed signature editing */}
      {activeTab === 1 && (
        <TextField
          id="typed-signature-input"
          value={typedSignature}
          onChange={handleTypedSignatureChange}
          placeholder="Enter your signature"
          variant="outlined"
          fullWidth
          autoFocus
          sx={{
            position: "absolute",
            top: -1000,
            left: -1000,
            opacity: 0,
            pointerEvents: "auto",
          }}
        />
      )}
    </Dialog>
  );
};

export default SignatureModal;
