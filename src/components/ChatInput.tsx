import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import SendIcon from "@mui/icons-material/Send";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { useDropzone } from "react-dropzone";

import { formatFileSize } from "../utils/helpers";
import { useThemeMode } from "../contexts/ThemeModeContext";

import type { FileAttachment } from "../features/chat/chatSlice";

/* ============================================================
   COMPONENT PROPS
   ============================================================ */
interface Props {
  onSend: (content: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  variant?: "footer" | "hero";
}

/* ============================================================
   CONSTANTS
   ============================================================ */

// Max combined size for all attachments together
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

// Max words allowed inside textarea
const MAX_WORDS = 1000;

// If pasted text reaches this many words, convert it into a .txt file
const PASTE_TO_FILE_WORD_THRESHOLD = 500;

// Accepted file types for picker / drag-drop
const ACCEPTED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/json": [".json"],
  "text/plain": [".txt", ".log", ".md"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/*": [],
};

// Visible rows in footer mode
const MIN_ROWS = 1;

// Max textarea heights before internal scroll appears
const TEXTAREA_MAX_HEIGHT_FOOTER = 240;
const TEXTAREA_MAX_HEIGHT_HERO = 320;

/* ============================================================
   LOCAL ATTACHMENT TYPE
   This extends FileAttachment only for local UI state.
   _size is local-only and should not be stored in messages.
   objectUrl/rawText/preview SHOULD be preserved when sending,
   because MessageBubble uses them later for preview dialogs.
   ============================================================ */
type LocalAttachment = FileAttachment & {
  _size: number;
  objectUrl?: string;
  rawText?: string;
};

/* ============================================================
   WORD COUNT HELPER
   ============================================================ */
function countWords(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const ChatInput: React.FC<Props> = ({
  onSend,
  disabled,
  isStreaming = false,
  onStop,
  placeholder,
  variant = "footer",
}) => {
  /* ------------------------------------------------------------
     THEME + VARIANT
     ------------------------------------------------------------ */
  const { palette, mode } = useThemeMode();

  const isHero = variant === "hero";

  const resolvedPlaceholder =
    placeholder ??
    (isHero
      ? "Ask anything — paste images, logs, attach files, drop screenshots…"
      : "Ask anything — paste images, logs, attach files, drop screenshots…");

  const maxTextHeight = isHero
    ? TEXTAREA_MAX_HEIGHT_HERO
    : TEXTAREA_MAX_HEIGHT_FOOTER;

  /* ------------------------------------------------------------
     STATE
     ------------------------------------------------------------ */

  // Main text typed by user
  const [text, setText] = useState("");

  // Attachments added before send
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  // Preview dialog state for attachments before send
  const [filePreview, setFilePreview] = useState<{
    url?: string;
    type: string;
    name: string;
    rawText?: string;
  } | null>(null);

  // Toast state for warnings / success / errors
  const [toast, setToast] = useState<{
    msg: string;
    sev: "error" | "warning" | "success";
  } | null>(null);

  // Ref for auto-resizing textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Count how many large pasted blocks were converted to file
  const pastedFileCountRef = useRef(0);

  /* ------------------------------------------------------------
     DERIVED VALUES
     ------------------------------------------------------------ */
  const totalSize = attachments.reduce((sum, item) => sum + item._size, 0);
  const currentWordCount = countWords(text);
  const canSend = !!text.trim() || attachments.length > 0;

  /* ------------------------------------------------------------
     FILE NAME HELPER
     Creates:
     pasted.txt
     pasted2.txt
     pasted3.txt
     ...
     ------------------------------------------------------------ */
  const getNextPastedFileName = () => {
    pastedFileCountRef.current += 1;

    return pastedFileCountRef.current === 1
      ? "pasted.txt"
      : `pasted${pastedFileCountRef.current}.txt`;
  };

  /* ------------------------------------------------------------
     TEXTAREA RESIZE HELPER
     Makes textarea grow until max height,
     then textarea itself becomes scrollable.
     ------------------------------------------------------------ */
  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxTextHeight)}px`;
  };

  /* ------------------------------------------------------------
     FILE DROP HANDLER
     Used by drag-drop and file picker.
     ------------------------------------------------------------ */
  const onDrop = useCallback(
    (files: File[]) => {
      const acceptedFiles: LocalAttachment[] = [];

      let runningTotal = totalSize;
      let skippedCombined = 0;
      let skippedOversize = 0;

      for (const file of files) {
        // Reject very large single file
        if (file.size > MAX_TOTAL_SIZE) {
          skippedOversize++;
          continue;
        }

        // Reject if total would exceed combined limit
        if (runningTotal + file.size > MAX_TOTAL_SIZE) {
          skippedCombined++;
          continue;
        }

        runningTotal += file.size;

        const objectUrl = URL.createObjectURL(file);

        acceptedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          _size: file.size,
          objectUrl,
          preview: file.type.startsWith("image/") ? objectUrl : undefined,
        });
      }

      if (acceptedFiles.length) {
        setAttachments((prev) => [...prev, ...acceptedFiles]);
      }

      if (skippedOversize) {
        setToast({
          msg: `${skippedOversize} file(s) exceed the 10 MB limit.`,
          sev: "error",
        });
      } else if (skippedCombined) {
        setToast({
          msg: `Combined upload limit is 10 MB. Skipped ${skippedCombined} file(s).`,
          sev: "error",
        });
      }
    },
    [totalSize],
  );

  /* ------------------------------------------------------------
     DROPZONE SETUP
     ------------------------------------------------------------ */
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    noClick: true,
    noKeyboard: true,
    onDropRejected(files) {
      const types = Array.from(new Set(files.map((f) => f.file.type || "unknown")));
      setToast({
        msg: `Unsupported file type${types.length > 1 ? "s" : ""}: ${types.join(", ")}`,
        sev: "warning",
      });
    },
  });

  /* ------------------------------------------------------------
     TYPING HANDLER
     Prevents input from exceeding 1000 words.
     ------------------------------------------------------------ */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;

    if (countWords(next) > MAX_WORDS) {
      setToast({
        msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
        sev: "warning",
      });
      return;
    }

    setText(next);
    resizeTextarea(e.target);
  };

  /* ------------------------------------------------------------
     KEYBOARD HANDLER
     Enter = send
     Shift+Enter = newline
     If streaming, Enter triggers stop
     ------------------------------------------------------------ */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isStreaming && onStop) {
        onStop();
        return;
      }

      handleSend();
    }
  };

  /* ------------------------------------------------------------
     PASTE HANDLER
     1) pasted image -> attachment
     2) pasted text >= 500 words -> .txt attachment
     3) pasted text < 500 words -> inline text, if total <= 1000 words
     ------------------------------------------------------------ */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    // STEP 1: pasted image support
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();

        if (file) {
          const ext = file.type.split("/")[1] || "png";

          const namedImage = new File(
            [file],
            file.name && file.name !== "image.png"
              ? file.name
              : `pasted-${Date.now()}.${ext}`,
            { type: file.type },
          );

          imageFiles.push(namedImage);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      onDrop(imageFiles);

      setToast({
        msg: `Pasted ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} from clipboard.`,
        sev: "success",
      });

      return;
    }

    // STEP 2: pasted text support
    const pasted = e.clipboardData.getData("text");

    if (!pasted) return;

    const pastedWordCount = countWords(pasted);

    // Large pasted text becomes a .txt attachment
    if (pastedWordCount >= PASTE_TO_FILE_WORD_THRESHOLD) {
      e.preventDefault();

      const fileName = getNextPastedFileName();
      const blob = new Blob([pasted], { type: "text/plain" });

      if (totalSize + blob.size > MAX_TOTAL_SIZE) {
        setToast({
          msg: `Cannot add ${fileName}. Combined upload limit is 10 MB.`,
          sev: "error",
        });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);

      setAttachments((prev) => [
        ...prev,
        {
          name: fileName,
          size: blob.size,
          type: "text/plain",
          _size: blob.size,
          objectUrl,
          rawText: pasted,
          textPreview: pasted.slice(0, 400),
        },
      ]);

      setToast({
        msg: `${fileName} created from pasted text.`,
        sev: "success",
      });

      return;
    }

    // Small pasted text stays inline if total remains within 1000 words
    const textarea = e.currentTarget;
    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const projectedText = text.slice(0, start) + pasted + text.slice(end);

    if (countWords(projectedText) > MAX_WORDS) {
      e.preventDefault();

      setToast({
        msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
        sev: "warning",
      });
    }
  };

  /* ------------------------------------------------------------
     SEND HANDLER
     IMPORTANT FIX:
     We keep preview/objectUrl/rawText when sending.
     We only remove _size because that is local UI-only data.
     Also we DO NOT revoke object URLs immediately after send,
     because MessageBubble still needs them for preview.
     ------------------------------------------------------------ */
  const handleSend = () => {
    if (!canSend) return;

    onSend(
      text.trim(),
      attachments.map(({ _size, ...rest }) => rest),
    );

    // Reset input state after send
    setText("");
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  /* ------------------------------------------------------------
     REMOVE ATTACHMENT
     Safe to revoke object URL here because the user removed it
     before sending.
     ------------------------------------------------------------ */
  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];

      if (removed?.objectUrl) {
        URL.revokeObjectURL(removed.objectUrl);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  /* ------------------------------------------------------------
     VISUAL HELPERS
     Keeps your existing UI style.
     ------------------------------------------------------------ */
  const inputShellBg = isHero
    ? mode === "dark"
      ? alpha("#fff", 0.04)
      : "#ffffff"
    : palette.bgInput;

  const focusRing =
    mode === "dark" && isHero
      ? `0 0 0 1px ${alpha(palette.primary, 0.45)}, 0 0 0 2px ${alpha(
          palette.primary,
          0.18,
        )}, 0 1px 10px ${alpha("#000", 0.25)}`
      : `0 0 0 2px ${palette.primarySoft}`;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Box
      {...getRootProps()}
      sx={{
        px: isHero ? 0 : 3,
        py: isHero ? 0 : 2,
        borderTop: isHero ? "none" : "1px solid",
        borderColor: palette.border,
        bgcolor: isDragActive ? palette.primarySoft : isHero ? "transparent" : palette.bgChat,
        transition: "background-color 0.2s",
      }}
    >
      {/* Hidden file input */}
      <input {...getInputProps()} />

      {/* Drag-drop helper */}
      {isDragActive && (
        <Box
          sx={{
            p: 2,
            mb: 1.5,
            border: "2px dashed",
            borderColor: palette.primary,
            borderRadius: "8px",
            textAlign: "center",
            bgcolor: palette.primarySoft,
          }}
        >
          <Typography sx={{ color: palette.primary, fontSize: 13 }}>
            Drop files here…
          </Typography>
        </Box>
      )}

      {/* ========================================================
          ATTACHMENTS STRIP
          Scrolls horizontally if many attachments are present.
         ======================================================== */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 1.25 }}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "nowrap",
              overflowX: "auto",
              overflowY: "hidden",
              pb: 0.5,
              justifyContent: "flex-start",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-thumb": {
                background: palette.scrollbarThumb,
                borderRadius: 999,
              },
            }}
          >
            {attachments.map((file, index) => (
              <Box
                key={`${file.name}-${index}`}
                onClick={() => {
                  // Image preview before send
                  if (file.preview) {
                    setFilePreview({
                      url: file.preview,
                      type: file.type || "",
                      name: file.name,
                    });
                    return;
                  }

                  // Text preview before send
                  if (file.rawText) {
                    setFilePreview({
                      type: "text/plain",
                      name: file.name,
                      rawText: file.rawText,
                    });
                    return;
                  }

                  // PDF or generic file preview before send
                  if (file.objectUrl) {
                    setFilePreview({
                      url: file.objectUrl,
                      type: file.type || "",
                      name: file.name,
                    });
                  }
                }}
                sx={{
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: palette.border,
                  bgcolor: palette.bgInput,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  flexShrink: 0,
                  ...(file.preview
                    ? {
                        width: 80,
                        height: 80,
                      }
                    : {
                        px: 1.5,
                        py: 0.75,
                        minWidth: 180,
                      }),
                }}
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <>
                    <InsertDriveFileIcon
                      sx={{
                        fontSize: 16,
                        color: palette.textMuted,
                      }}
                    />

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: palette.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 140,
                        }}
                      >
                        {file.name}
                      </Typography>

                      <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Remove attachment before send */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(index);
                  }}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    bgcolor: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.75)",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Combined attachment usage */}
          <Typography
            sx={{
              fontSize: 10.5,
              color: palette.textMuted,
              mt: 0.5,
              textAlign: isHero ? "center" : "left",
            }}
          >
            {formatFileSize(totalSize)} / 10 MB used
          </Typography>
        </Box>
      )}

      {/* ========================================================
          MAIN INPUT SHELL
         ======================================================== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          bgcolor: inputShellBg,
          borderRadius: isHero ? "16px" : "14px",
          border: "1px solid",
          borderColor: palette.border,
          px: isHero ? 2 : 1.5,
          py: isHero ? 1.5 : 1,
          minHeight: isHero ? 120 : undefined,
          transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
          ...(isHero && mode === "dark"
            ? {
                boxShadow: `0 0 0 1px ${alpha(
                  palette.border,
                  0.9,
                )}, 0 1px 8px ${alpha("#000", 0.28)}, inset 0 1px 0 ${alpha(
                  palette.primary,
                  0.14,
                )}`,
              }
            : isHero && mode === "light"
              ? {
                  boxShadow: `0 1px 3px ${alpha("#000", 0.06)}, inset 0 1px 0 ${alpha(
                    palette.primary,
                    0.12,
                  )}`,
                }
              : {}),
          "&:focus-within": {
            borderColor: palette.primary,
            boxShadow: focusRing,
          },
        }}
      >
        {/* Attach file button */}
        <Tooltip title="Attach file (10 MB total max)">
          <IconButton
            size="small"
            onClick={open}
            sx={{
              color: palette.textMuted,
              "&:hover": {
                color: palette.primary,
              },
            }}
          >
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={resolvedPlaceholder}
          disabled={disabled && !isStreaming}
          rows={isHero ? 4 : MIN_ROWS}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: palette.textPrimary,
            fontSize: isHero ? "0.9375rem" : "0.9rem",
            fontFamily: '"Inter", -apple-system, sans-serif',
            lineHeight: 1.55,
            maxHeight: maxTextHeight,
            minHeight: isHero ? 88 : undefined,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        />

        {/* Send or Stop button */}
        <Tooltip title={isStreaming ? "Stop generation" : "Send (Enter)"}>
          <span>
            {isStreaming ? (
              <IconButton
                onClick={onStop}
                disabled={!onStop}
                sx={{
                  bgcolor: palette.error,
                  color: "#fff",
                  width: isHero ? 40 : 34,
                  height: isHero ? 40 : 34,
                  borderRadius: "10px",
                  "&:hover": {
                    bgcolor: palette.error,
                    opacity: 0.92,
                  },
                  "&.Mui-disabled": {
                    bgcolor: palette.border,
                    color: palette.textMuted,
                  },
                }}
              >
                <StopCircleOutlinedIcon sx={{ fontSize: isHero ? 18 : 16 }} />
              </IconButton>
            ) : (
              <IconButton
                onClick={handleSend}
                disabled={disabled || !canSend}
                sx={{
                  bgcolor: palette.primary,
                  color: palette.textOnPrimary,
                  width: isHero ? 40 : 34,
                  height: isHero ? 40 : 34,
                  borderRadius: "10px",
                  "&:hover": {
                    bgcolor: palette.primaryHover,
                  },
                  "&.Mui-disabled": {
                    bgcolor: palette.border,
                    color: palette.textMuted,
                  },
                }}
              >
                <SendIcon sx={{ fontSize: isHero ? 18 : 16 }} />
              </IconButton>
            )}
          </span>
        </Tooltip>
      </Box>

      {/* Word counter */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            color:
              currentWordCount > MAX_WORDS * 0.9
                ? palette.warning
                : palette.textMuted,
          }}
        >
          {currentWordCount} / {MAX_WORDS} words
        </Typography>
      </Box>

      {/* Hero helper text */}
      {isHero && (
        <Typography
          sx={{
            fontSize: 11,
            color: palette.textMuted,
            textAlign: "center",
            mt: 1.5,
          }}
        >
          Shift+Enter for a new line · Enter to send
        </Typography>
      )}

      {/* ========================================================
          PREVIEW DIALOG
         ======================================================== */}
      <Dialog
        open={Boolean(filePreview)}
        onClose={() => setFilePreview(null)}
        maxWidth="md"
        fullWidth
      >
        {filePreview && (
          <DialogTitle sx={{ fontSize: 15 }}>
            {filePreview.name}
          </DialogTitle>
        )}

        <DialogContent sx={{ p: 1, pt: 0, bgcolor: palette.bgChat }}>
          {filePreview?.type === "application/pdf" && filePreview.url ? (
            <Box
              component="iframe"
              title={filePreview.name}
              src={filePreview.url}
              sx={{
                width: "100%",
                height: { xs: "60vh", sm: "72vh" },
                border: "none",
                borderRadius: 1,
              }}
            />
          ) : filePreview?.type === "text/plain" && filePreview.rawText ? (
            <Box
              sx={{
                maxHeight: "72vh",
                overflow: "auto",
                border: "1px solid",
                borderColor: palette.border,
                borderRadius: 1.5,
                bgcolor: palette.bgInput,
                p: 2,
              }}
            >
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: palette.textPrimary,
                }}
              >
                {filePreview.rawText}
              </Typography>
            </Box>
          ) : filePreview?.url ? (
            <img
              src={filePreview.url}
              alt={filePreview.name}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.sev}
            onClose={() => setToast(null)}
            sx={{ fontSize: 12 }}
          >
            {toast.msg}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </Box>
  );
};

export default ChatInput;