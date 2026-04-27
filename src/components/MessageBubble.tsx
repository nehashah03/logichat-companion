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
  Chip,
} from "@mui/material";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReplayIcon from "@mui/icons-material/Replay";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

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
  searchQuery?: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

function fmtTime(ts: number) {
  if (!ts) return "";

  const date = new Date(ts);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CITATION_RE = /\[(\d+)\]/g;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatches(
  text: string,
  query: string | undefined,
  palette: any,
): React.ReactNode {
  if (!query || !query.trim()) return text;

  const cleanQuery = query.trim();

  const parts = text.split(
    new RegExp(`(${escapeRegExp(cleanQuery)})`, "gi"),
  );

  return parts.map((part, index) =>
    part.toLowerCase() === cleanQuery.toLowerCase() ? (
      <mark
        key={index}
        style={{
          backgroundColor:
            palette.primarySoft || "rgba(250, 204, 21, 0.45)",
          color: palette.primary || "inherit",
          borderRadius: 3,
          padding: "0 2px",
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

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
  let lastIndex = 0;

  for (const match of text.matchAll(CITATION_RE)) {
    const citationIndex = Number(match[1]);
    const citation = citations.find((item) => item.index === citationIndex);

    if (!citation || match.index === undefined) continue;

    const beforeCitation = text.slice(lastIndex, match.index);

    parts.push(
      searchQuery
        ? highlightMatches(beforeCitation, searchQuery, palette)
        : beforeCitation,
    );

    parts.push(
      <CitationChip
        key={`citation-${match.index}-${citationIndex}`}
        index={citationIndex}
        source={sourceById.get(citation.sourceId)}
      />,
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.slice(lastIndex);

  parts.push(
    searchQuery
      ? highlightMatches(remainingText, searchQuery, palette)
      : remainingText,
  );

  return parts;
}

function shouldCollapseMessage(content: string) {
  const lineCount = content.split("\n").length;
  const charCount = content.length;

  return lineCount > 12 || charCount > 900;
}

function isImageAttachment(att: FileAttachment) {
  return Boolean(att.type?.startsWith("image/") || att.preview);
}

function isPdfAttachment(att: FileAttachment) {
  return att.type === "application/pdf";
}

function isTextAttachment(att: FileAttachment) {
  return att.type === "text/plain" || Boolean(att.rawText || att.textPreview);
}

function getStatusLabel(status: ChatMessage["status"]) {
  if (status === "error") return "Failed";
  if (status === "cancelled") return "Stopped";
  if (status === "streaming") return "Streaming";
  if (status === "sending") return "Sending";
  return "";
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const MessageBubble: React.FC<Props> = ({ message, onRetry, searchQuery }) => {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isCancelled = message.status === "cancelled";
  const isStreaming = message.status === "streaming";

  const { palette, mode } = useThemeMode();

  const [copySnack, setCopySnack] = useState(false);

  const [filePreview, setFilePreview] = useState<{
    url?: string;
    type: string;
    name: string;
    rawText?: string;
  } | null>(null);

  const [expanded, setExpanded] = useState(false);

  const sourceById = useMemo(() => {
    const map = new Map();
    message.sources?.forEach((source) => map.set(source.id, source));
    return map;
  }, [message.sources]);

  const bubbleBg = isUser ? palette.bgUserBubble : palette.bgAssistantBubble;
  const citations = message.citations || [];
  const hasLongContent = shouldCollapseMessage(message.content || "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopySnack(true);
    } catch {
      // Clipboard can fail on non-secure origins.
      // Keep UI stable; no hard failure needed.
    }
  };

  const openAttachmentPreview = (
    event: React.MouseEvent,
    attachment: FileAttachment,
  ) => {
    event.stopPropagation();

    if (isImageAttachment(attachment)) {
      setFilePreview({
        url: attachment.preview || attachment.objectUrl,
        type: attachment.type || "image/*",
        name: attachment.name,
      });
      return;
    }

    if (isTextAttachment(attachment)) {
      setFilePreview({
        type: "text/plain",
        name: attachment.name,
        rawText: attachment.rawText || attachment.textPreview || "",
      });
      return;
    }

    if (isPdfAttachment(attachment)) {
      setFilePreview({
        url: attachment.objectUrl || attachment.preview,
        type: attachment.type || "",
        name: attachment.name,
      });
    }
  };

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
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(value);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  setCopied(false);
                }
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

        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: isUser ? "flex-end" : "flex-start",
          }}
        >
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

            {(isError || isCancelled || isStreaming || message.status === "sending") && (
              <Chip
                size="small"
                icon={
                  isError ? (
                    <ErrorOutlineIcon sx={{ fontSize: 14 }} />
                  ) : isCancelled ? (
                    <StopCircleOutlinedIcon sx={{ fontSize: 14 }} />
                  ) : undefined
                }
                label={getStatusLabel(message.status)}
                sx={{
                  height: 20,
                  fontSize: 10.5,
                  color: isError
                    ? palette.error
                    : isCancelled
                      ? palette.textMuted
                      : palette.primary,
                  bgcolor: isError
                    ? "transparent"
                    : isCancelled
                      ? palette.bgInput
                      : palette.primarySoft,
                  border: "1px solid",
                  borderColor: isError
                    ? palette.error
                    : isCancelled
                      ? palette.border
                      : palette.primarySoft,
                  "& .MuiChip-icon": {
                    color: "inherit",
                    ml: 0.5,
                  },
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              bgcolor: bubbleBg,
              color: palette.textPrimary,
              border: "1px solid",
              borderColor: isError ? palette.error : palette.border,
              borderRadius: "14px",
              px: 1.75,
              py: 1.25,
              width: "100%",
            }}
          >
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
                  "&::-webkit-scrollbar": { height: 8 },
                  "&::-webkit-scrollbar-thumb": {
                    background: palette.scrollbarThumb,
                    borderRadius: 999,
                  },
                }}
              >
                {message.attachments.map((attachment, index) => {
                  const clickable =
                    isImageAttachment(attachment) ||
                    isPdfAttachment(attachment) ||
                    isTextAttachment(attachment);

                  return (
                    <Box
                      key={attachment.id || `${attachment.name}-${index}`}
                      onClick={(event) =>
                        clickable && openAttachmentPreview(event, attachment)
                      }
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
                          ? { boxShadow: `0 0 0 1px ${palette.primary}` }
                          : undefined,
                      }}
                    >
                      {isImageAttachment(attachment) ? (
                        <img
                          src={attachment.preview || attachment.objectUrl}
                          alt={attachment.name}
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
                              {attachment.name}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 10,
                                color: palette.textMuted,
                              }}
                            >
                              {attachment.type || "file"}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}

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

            {message.content ? (
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
                        return (
                          <CodeBlock language={match[1]} value={value} />
                        );
                      }

                      return (
                        <code
                          style={{
                            background: palette.bgCodeHeader,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontFamily:
                              '"SF Mono", "JetBrains Mono", monospace',
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

                    table({ children }) {
                      return <InteractiveTable>{children}</InteractiveTable>;
                    },

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
                            transition:
                              "transform .15s ease, box-shadow .15s ease",
                            "&:hover": {
                              transform: "translateY(-1px)",
                              boxShadow: `0 6px 18px ${
                                palette.bgCode || "rgba(0,0,0,0.2)"
                              }`,
                            },
                          }}
                        />
                      );
                    },

                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      );
                    },

                    p({ children }) {
                      const transformed = React.Children.map(
                        children,
                        (child) => {
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
                        },
                      );

                      return <p>{transformed}</p>;
                    },

                    li({ children }) {
                      const transformed = React.Children.map(
                        children,
                        (child) => {
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
                        },
                      );

                      return <li>{transformed}</li>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </Box>
            ) : isStreaming ? (
              <Typography
                sx={{
                  fontSize: 13,
                  color: palette.textMuted,
                  fontStyle: "italic",
                }}
              >
                Waiting for backend stream…
              </Typography>
            ) : null}

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

            {isError && message.error && (
              <Alert
                severity="error"
                sx={{
                  mt: message.content ? 1 : 0,
                  fontSize: 12,
                  borderRadius: 2,
                }}
              >
                {message.error}
              </Alert>
            )}

            {isCancelled && (
              <Alert
                severity="info"
                sx={{
                  mt: message.content ? 1 : 0,
                  fontSize: 12,
                  borderRadius: 2,
                }}
              >
                Stream stopped. Partial response is saved.
              </Alert>
            )}

            {isStreaming && (
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

          {!isUser &&
            (message.status === "complete" ||
              message.status === "cancelled" ||
              message.status === "error") && (
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
                  <PipelinePanel
                    phases={message.pipeline}
                    compact
                    defaultOpen={false}
                  />
                )}

                {message.sources && message.sources.length > 0 && (
                  <SourcesPanel
                    sources={message.sources}
                    citations={message.citations}
                  />
                )}
              </Box>
            )}

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
          ) : filePreview?.type === "text/plain" &&
            filePreview.rawText ? (
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
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
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