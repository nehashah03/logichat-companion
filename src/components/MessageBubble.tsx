import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReplayIcon from "@mui/icons-material/Replay";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import type { ChatMessage, FileAttachment } from "../features/chat/chatSlice";

import PipelinePanel from "./PipelinePanel";
import SourcesPanel from "./SourcesPanel";
import CitationChip from "./CitationChip";
import InteractiveTable from "./InteractiveTable";
import { useThemeMode } from "../contexts/ThemeModeContext";

/* ============================================================
   PROPS
   ============================================================ */
interface Props {
  message: ChatMessage;
  onRetry?: () => void;
  /** Optional query to highlight inside message text. */
  searchQuery?: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

// Format timestamp for the small message header text
function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Regex used to replace [1], [2] style markers with citation chips
const CITATION_RE = /\[(\d+)\]/g;

/** Escape a string so it is safe to use inside a RegExp. */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps every case-insensitive match of `query` inside `text` with a
 * <mark> element using the current palette's highlight colors.
 * Returns the original string when `query` is empty.
 */
function highlightMatches(
  text: string,
  query: string | undefined,
  palette: any,
): React.ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        style={{
          backgroundColor: palette.primarySoft || "rgba(250, 204, 21, 0.45)",
          color: palette.primary || "inherit",
          borderRadius: 3,
          padding: "0 2px",
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/**
 * Replaces inline [1], [2] citation markers inside plain text
 * with interactive citation chips.
 */
function renderWithCitations(
  text: string,
  sourceById: Map<string, any>,
  citations: any[],
  searchQuery?: string,
  palette?: any,
) {
  if (!citations?.length) {
    return searchQuery ? highlightMatches(text, searchQuery, palette) : text;
  }

  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(CITATION_RE)) {
    const idx = parseInt(match[1], 10);
    const citation = citations.find((c) => c.index === idx);

    if (!citation) continue;

    const chunk = text.slice(last, match.index);
    parts.push(
      searchQuery ? highlightMatches(chunk, searchQuery, palette) : chunk,
    );
    parts.push(
      <CitationChip
        key={`cit-${match.index}-${idx}`}
        index={idx}
        source={sourceById.get(citation.sourceId)}
      />,
    );

    last = (match.index || 0) + match[0].length;
  }

  const tail = text.slice(last);
  parts.push(searchQuery ? highlightMatches(tail, searchQuery, palette) : tail);
  return parts;
}

/**
 * Decide whether the message is long enough to collapse by default.
 * This helps keep the bubble compact when the user or assistant sends
 * a very long message.
 */
function shouldCollapseMessage(content: string) {
  const lineCount = content.split("\n").length;
  const charCount = content.length;
  return lineCount > 12 || charCount > 900;
}

/**
 * Checks whether attachment should be treated like an image.
 */
function isImageAttachment(att: FileAttachment) {
  return !!att.type?.startsWith("image/") || !!att.preview;
}

/**
 * Checks whether attachment is pdf.
 */
function isPdfAttachment(att: FileAttachment) {
  return att.type === "application/pdf";
}

/**
 * Checks whether attachment is text-like.
 */
function isTextAttachment(att: FileAttachment) {
  return att.type === "text/plain" || !!att.rawText || !!att.textPreview;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const MessageBubble: React.FC<Props> = ({ message, onRetry, searchQuery }) => {
  /* ------------------------------------------------------------
     BASIC FLAGS
     ------------------------------------------------------------ */
  const isUser = message.role === "user";
  const isError = message.status === "error";

  /* ------------------------------------------------------------
     THEME
     ------------------------------------------------------------ */
  const { palette, mode } = useThemeMode();

  /* ------------------------------------------------------------
     LOCAL STATE
     ------------------------------------------------------------ */

  // Small success toast when user copies a message
  const [copySnack, setCopySnack] = useState(false);

  // Shared file preview dialog state
  const [filePreview, setFilePreview] = useState<{
    url?: string;
    type: string;
    name: string;
    rawText?: string;
  } | null>(null);

  // Whether long message content is fully expanded
  const [expanded, setExpanded] = useState(false);

  /* ------------------------------------------------------------
     SOURCE LOOKUP MAP
     ------------------------------------------------------------ */
  const sourceById = useMemo(() => {
    const map = new Map();
    message.sources?.forEach((s) => map.set(s.id, s));
    return map;
  }, [message.sources]);

  /* ------------------------------------------------------------
     COPY MESSAGE TEXT
     ------------------------------------------------------------ */
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopySnack(true);
  };

  /* ------------------------------------------------------------
     OPEN ATTACHMENT PREVIEW
     Centralized function so all attachment clicks behave the same.
     ------------------------------------------------------------ */
  const openAttachmentPreview = (
    e: React.MouseEvent,
    att: FileAttachment,
  ) => {
    // Prevent parent containers / hover rows from hijacking click
    e.stopPropagation();

    // Image preview
    if (isImageAttachment(att)) {
      setFilePreview({
        url: att.preview || att.objectUrl,
        type: att.type || "",
        name: att.name,
      });
      return;
    }

    // Text preview
    if (isTextAttachment(att)) {
      setFilePreview({
        type: "text/plain",
        name: att.name,
        rawText: att.rawText || att.textPreview || "",
      });
      return;
    }

    // PDF preview
    if (isPdfAttachment(att)) {
      setFilePreview({
        url: att.objectUrl || att.preview,
        type: att.type || "",
        name: att.name,
      });
    }
  };

  /* ------------------------------------------------------------
     CODE BLOCK RENDERER
     Used inside markdown fenced code blocks.
     ------------------------------------------------------------ */
  const CodeBlock = ({
    language,
    value,
  }: {
    language: string;
    value: string;
  }) => {
    const [copied, setCopied] = useState(false);

    return (
      <Box
        sx={{
          position: "relative",
          my: 1.5,
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: palette.border,
        }}
      >
        {/* Top strip of code block */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 0.5,
            bgcolor: palette.bgCodeHeader,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"SF Mono", "JetBrains Mono", monospace',
              color: palette.textSecondary,
              fontSize: 11,
            }}
          >
            {language || "code"}
          </Typography>

          <Tooltip title={copied ? "Copied!" : "Copy code"}>
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              sx={{
                color: palette.textMuted,
                "&:hover": {
                  color: palette.textPrimary,
                },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Syntax highlighted code */}
        <SyntaxHighlighter
          language={language || "text"}
          style={mode === "light" ? oneLight : oneDark}
          customStyle={{
            margin: 0,
            padding: 14,
            fontSize: "0.78rem",
            background: palette.bgCode,
          }}
        >
          {value}
        </SyntaxHighlighter>
      </Box>
    );
  };

  /* ------------------------------------------------------------
     STYLES / DERIVED VALUES
     ------------------------------------------------------------ */
  const bubbleBg = isUser ? palette.bgUserBubble : palette.bgAssistantBubble;
  const citations = message.citations || [];
  const hasLongContent = shouldCollapseMessage(message.content);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
        animation: "fade .2s ease-out",
        "@keyframes fade": {
          from: { opacity: 0, transform: "translateY(4px)" },
          to: { opacity: 1, transform: "none" },
        },
        "&:hover .msg-actions": { opacity: 1 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          gap: 1.25,
          width: "70%",
          maxWidth: "70%",
          minWidth: 0,
        }}
      >
        {/* Message avatar */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            mt: 0.25,
            flexShrink: 0,
            bgcolor: isUser ? palette.primarySoft : palette.primary,
            color: isUser ? palette.primary : palette.textOnPrimary,
          }}
        >
          {isUser ? (
            <PersonOutlineIcon sx={{ fontSize: 18 }} />
          ) : (
            <AutoAwesomeIcon sx={{ fontSize: 17 }} />
          )}
        </Avatar>

        {/* Main message column */}
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: isUser ? "flex-end" : "flex-start",
          }}
        >
          {/* Small header above bubble */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
              flexDirection: isUser ? "row-reverse" : "row",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: isUser ? palette.userAccent : palette.textPrimary,
              }}
            >
              {isUser ? "You" : "Assistant"}
            </Typography>

            <Typography sx={{ fontSize: 11, color: palette.textMuted }}>
              {fmtTime(message.timestamp)}
            </Typography>

            {isError && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: palette.error,
                  fontSize: 11,
                }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 14 }} />
                Failed
              </Box>
            )}
          </Box>

          {/* Message bubble body */}
          <Box
            sx={{
              bgcolor: bubbleBg,
              color: palette.textPrimary,
              border: "1px solid",
              borderColor: palette.border,
              borderRadius: "14px",
              px: 1.75,
              py: 1.25,
              width: "100%",
            }}
          >
            {/* ==================================================
                ATTACHMENTS
                These show before message text.
                Click works for image/pdf/text files.
               ================================================== */}
            {message.attachments && message.attachments.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: message.content ? 1 : 0,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  overflowY: "hidden",
                  pb: 0.5,
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
                {message.attachments.map((att, i) => {
                  const clickable =
                    isImageAttachment(att) ||
                    isPdfAttachment(att) ||
                    isTextAttachment(att);

                  return (
                    <Box
                      key={att.id || `${att.name}-${i}`}
                      onClick={(e) => clickable && openAttachmentPreview(e, att)}
                      sx={{
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: palette.border,
                        bgcolor: palette.bgChat,
                        cursor: clickable ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        pointerEvents: "auto",
                        "&:hover": clickable
                          ? {
                            boxShadow: `0 0 0 1px ${palette.primary}`,
                          }
                          : undefined,
                      }}
                    >
                      {isImageAttachment(att) ? (
                        <img
                          src={att.preview || att.objectUrl}
                          alt={att.name}
                          style={{
                            maxWidth: 220,
                            maxHeight: 160,
                            display: "block",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.85,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            minWidth: 180,
                          }}
                        >
                          <InsertDriveFileIcon
                            sx={{
                              fontSize: 16,
                              color: palette.textMuted,
                            }}
                          />

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: 11.5,
                                color: palette.textPrimary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 150,
                              }}
                            >
                              {att.name}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 10,
                                color: palette.textMuted,
                              }}
                            >
                              {att.type || "file"}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* ==================================================
                LEGACY PASTE SNIPPETS
                Kept intact so nothing breaks.
               ================================================== */}
            {message.pasteSnippets?.map((snippet) => (
              <Box
                key={snippet.id}
                sx={{
                  my: 0.75,
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: palette.border,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    px: 1.25,
                    py: 0.5,
                    bgcolor: palette.bgCodeHeader,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: palette.textMuted,
                      fontFamily: "monospace",
                    }}
                  >
                    📋 pasted snippet · {snippet.lines} lines
                  </Typography>
                </Box>

                <SyntaxHighlighter
                  language={snippet.language}
                  style={mode === "light" ? oneLight : oneDark}
                  customStyle={{
                    margin: 0,
                    padding: 12,
                    fontSize: "0.75rem",
                    background: palette.bgCode,
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {snippet.content}
                </SyntaxHighlighter>
              </Box>
            ))}

            {/* ==================================================
                MESSAGE BODY
                Preserves line breaks and supports long-content collapse.
               ================================================== */}
            <Box
              sx={{
                ...(isUser && hasLongContent && !expanded
                  ? {
                    maxHeight: 260,
                    overflow: "hidden",
                    position: "relative",
                  }
                  : {}),
                "& p": {
                  my: 0.5,
                  fontSize: "0.9rem",
                  color: palette.textPrimary,
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                },
                "& table": {
                  borderCollapse: "collapse",
                  width: "100%",
                  my: 1.5,
                  fontSize: "0.82rem",
                  display: "block",
                  overflowX: "auto",
                },
                "& th, & td": {
                  border: "1px solid",
                  borderColor: palette.border,
                  px: 1.5,
                  py: 0.75,
                  textAlign: "left",
                },
                "& th": {
                  bgcolor: palette.bgCodeHeader,
                  fontWeight: 600,
                  color: palette.textPrimary,
                },
                "& td": {
                  color: palette.textSecondary,
                },
                "& blockquote": {
                  borderLeft: "3px solid",
                  borderColor: palette.primary,
                  pl: 2,
                  my: 1,
                  color: palette.textSecondary,
                  bgcolor: palette.primarySoft,
                  py: 0.5,
                  borderRadius: "0 6px 6px 0",
                },
                "& a": {
                  color: palette.primary,
                  textDecoration: "underline",
                },
                "& ul, & ol": {
                  pl: 3,
                  color: palette.textSecondary,
                },
                "& li": {
                  my: 0.25,
                },
                "& strong": {
                  color: palette.textPrimary,
                },
                "& h1,& h2,& h3,& h4": {
                  color: palette.textPrimary,
                  mt: 2,
                  mb: 1,
                },
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const value = String(children).replace(/\n$/, "");

                    if (match) {
                      return <CodeBlock language={match[1]} value={value} />;
                    }

                    return (
                      <code
                        style={{
                          background: palette.bgCodeHeader,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                          fontSize: "0.82em",
                          color: palette.primary,
                          whiteSpace: "pre-wrap",
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },

                  // Interactive table: sortable columns + per-column filter.
                  table({ children }) {
                    return <InteractiveTable>{children}</InteractiveTable>;
                  },

                  // Clickable image preview.
                  img({ src, alt }) {
                    if (!src) return null;
                    return (
                      <Box
                        component="img"
                        src={src}
                        alt={alt || ""}
                        onClick={() =>
                          setFilePreview({
                            url: src,
                            type: "image/*",
                            name: alt || "image",
                          })
                        }
                        sx={{
                          maxWidth: "100%",
                          maxHeight: 320,
                          borderRadius: "10px",
                          border: "1px solid",
                          borderColor: palette.border,
                          my: 1,
                          cursor: "zoom-in",
                          display: "block",
                          transition: "transform .15s ease, box-shadow .15s ease",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: `0 6px 18px ${palette.bgCode || "rgba(0,0,0,0.2)"}`,
                          },
                        }}
                      />
                    );
                  },

                  p({ children }) {
                    const transformed = React.Children.map(children, (child) => {
                      if (typeof child === "string") {
                        return renderWithCitations(
                          child,
                          sourceById,
                          citations,
                          searchQuery,
                          palette,
                        );
                      }
                      return child;
                    });
                    return <p>{transformed}</p>;
                  },

                  li({ children }) {
                    const transformed = React.Children.map(children, (child) => {
                      if (typeof child === "string") {
                        return renderWithCitations(
                          child,
                          sourceById,
                          citations,
                          searchQuery,
                          palette,
                        );
                      }
                      return child;
                    });
                    return <li>{transformed}</li>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </Box>

            {/* Show more / less for long message content */}
            {/* {isUser && hasLongContent && (
              <Box sx={{ mt: 0.75 }}>
                <Button
                  size="small"
                  onClick={() => setExpanded((prev) => !prev)}
                  sx={{
                    textTransform: "none",
                    px: 0,
                    minWidth: 0,
                    color: palette.primary,
                    fontSize: 12,
                  }}
                >
                  {expanded ? "Show less" : "Show more"}
                </Button>
              </Box>
            )} */}
            {/* Show more ONLY for USER messages */}
            {isUser && hasLongContent && (
              <Box sx={{ mt: 0.75 }}>
                <Button
                  size="small"
                  onClick={() => setExpanded((prev) => !prev)}
                  sx={{
                    textTransform: "none",
                    px: 0,
                    minWidth: 0,
                    color: palette.primary,
                    fontSize: 12,
                  }}
                >
                  {expanded ? "Show less" : "Show more"}
                </Button>
              </Box>
            )}

            {/* Streaming cursor */}
            {message.status === "streaming" && (
              <Box
                sx={{
                  display: "inline-block",
                  width: 6,
                  height: 14,
                  bgcolor: palette.primary,
                  ml: 0.5,
                  animation: "blink 1s infinite",
                  "@keyframes blink": {
                    "0%,100%": { opacity: 1 },
                    "50%": { opacity: 0 },
                  },
                }}
              />
            )}
          </Box>

          {/* ==================================================
              Persisted pipeline + sources for assistant
             ================================================== */}
          {!isUser && message.status === "complete" && (
            <Box
              sx={{
                width: "100%",
                mt: 0.85,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
              }}
            >
              {message.pipeline && message.pipeline.length > 0 && (
                <PipelinePanel phases={message.pipeline} compact defaultOpen={false} />
              )}

              {message.sources && message.sources.length > 0 && (
                <SourcesPanel sources={message.sources} citations={message.citations} />
              )}
            </Box>
          )}

          {/* ==================================================
              ACTION ROW
              pointerEvents none on row so it never blocks attachments.
              Buttons themselves re-enable pointer events.
             ================================================== */}
          <Box
            className="msg-actions"
            sx={{
              display: "flex",
              gap: 0.25,
              mt: 0.5,
              opacity: 0,
              transition: "opacity .15s",
              alignItems: "center",
              flexDirection: isUser ? "row-reverse" : "row",
              pointerEvents: "none",
            }}
          >
            <Tooltip title="Copy">
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  pointerEvents: "auto",
                  color: palette.textMuted,
                  "&:hover": {
                    color: palette.textPrimary,
                  },
                }}
              >
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>

            {!isUser && message.status === "complete" && (
              <>
                <Tooltip title="Good response">
                  <IconButton
                    size="small"
                    sx={{
                      pointerEvents: "auto",
                      color: palette.textMuted,
                      "&:hover": {
                        color: palette.success,
                      },
                    }}
                  >
                    <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Bad response">
                  <IconButton
                    size="small"
                    sx={{
                      pointerEvents: "auto",
                      color: palette.textMuted,
                      "&:hover": {
                        color: palette.error,
                      },
                    }}
                  >
                    <ThumbDownOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {isError && onRetry && (
              <Tooltip title="Retry">
                <IconButton
                  size="small"
                  onClick={onRetry}
                  sx={{
                    pointerEvents: "auto",
                    color: palette.error,
                  }}
                >
                  <ReplayIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* ========================================================
          PREVIEW DIALOG
         ======================================================== */}
      <Dialog
        open={!!filePreview}
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

      {/* Copy success snackbar */}
      <Snackbar
        open={copySnack}
        autoHideDuration={1500}
        onClose={() => setCopySnack(false)}
      >
        <Alert
          severity="success"
          onClose={() => setCopySnack(false)}
          sx={{ fontSize: 12 }}
        >
          Copied
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessageBubble;