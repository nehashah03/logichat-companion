import React, { useState } from 'react';
import {
  Box, Typography, Avatar, IconButton, Tooltip, Collapse,
  Dialog, DialogContent, Snackbar, Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TerminalIcon from '@mui/icons-material/Terminal';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, ToolOutput } from '../features/chat/chatSlice';
import EventsSourcesPanel from './EventsSourcesPanel';
import { useThemeMode } from '../contexts/ThemeModeContext';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

function formatExactTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const { palette, mode } = useThemeMode();
  const [copySnack, setCopySnack] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleCopyMessage = () => {
    const label = isUser ? 'You' : 'Assistant';
    navigator.clipboard.writeText(`${label}:\n${message.content}`);
    setCopySnack(true);
  };

  const isLongContent = message.content.length > 800 || message.content.split('\n').length > 20;
  const [contentExpanded, setContentExpanded] = useState(true);

  // ---- Inline components ----
  const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    return (
      <Box sx={{ position: 'relative', my: 1.5, borderRadius: '8px', overflow: 'hidden', border: '1px solid', borderColor: palette.border }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5, bgcolor: palette.bgCodeHeader }}>
          <Typography sx={{ fontFamily: '"SF Mono", "JetBrains Mono", monospace', color: palette.textSecondary, fontSize: 11 }}>
            {language || 'code'}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
            <IconButton size="small" onClick={handleCopy} sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}>
              <ContentCopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <SyntaxHighlighter
          language={language || 'text'}
          style={mode === 'light' ? oneLight : oneDark}
          customStyle={{ margin: 0, padding: '14px', fontSize: '0.78rem', background: palette.bgCode }}
        >
          {value}
        </SyntaxHighlighter>
      </Box>
    );
  };

  const ToolOutputBlock: React.FC<{ output: ToolOutput }> = ({ output }) => {
    const [expanded, setExpanded] = useState(false);
    return (
      <Box sx={{ my: 1, borderRadius: '8px', border: '1px solid', borderColor: palette.border, overflow: 'hidden' }}>
        <Box
          onClick={() => setExpanded(!expanded)}
          sx={{
            display: 'flex', alignItems: 'center', px: 2, py: 0.75, cursor: 'pointer',
            bgcolor: palette.bgCodeHeader, '&:hover': { bgcolor: palette.bgHover },
          }}
        >
          <TerminalIcon sx={{ fontSize: 14, color: palette.success, mr: 1 }} />
          <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: palette.success, mr: 1 }}>{output.name}</Typography>
          <Typography sx={{ flex: 1, fontSize: 11, color: palette.textMuted }}>Tool Output</Typography>
          {expanded ? <ExpandLessIcon sx={{ fontSize: 16, color: palette.textMuted }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: palette.textMuted }} />}
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ px: 2, py: 1.5, bgcolor: palette.bgCode, maxHeight: 200, overflow: 'auto' }}>
            {output.type === 'code' ? (
              <SyntaxHighlighter language="json" style={mode === 'light' ? oneLight : oneDark}
                customStyle={{ margin: 0, fontSize: '0.75rem', background: 'transparent' }}>
                {output.content}
              </SyntaxHighlighter>
            ) : (
              <Typography sx={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: palette.textSecondary }}>
                {output.content}
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const bubbleBg = isUser ? palette.bgUserBubble : palette.bgAssistantBubble;

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2,
      animation: 'fadeIn 0.2s ease-out',
      '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
      '&:hover .msg-actions': { opacity: 1 },
    }}>
      <Box sx={{
        display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 1.25,
        maxWidth: '70%', minWidth: 0,
      }}>
        {/* Avatar */}
        <Avatar sx={{
          width: 30, height: 30, mt: 0.25, flexShrink: 0,
          bgcolor: isUser ? palette.primarySoft : palette.bgCodeHeader,
          color: isUser ? palette.userAccent : palette.assistantAccent,
        }}>
          {isUser ? <PersonOutlineIcon sx={{ fontSize: 17 }} /> : <SmartToyOutlinedIcon sx={{ fontSize: 17 }} />}
        </Avatar>

        {/* Bubble + meta */}
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4, flexDirection: isUser ? 'row-reverse' : 'row' }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: isUser ? palette.userAccent : palette.textPrimary }}>
              {isUser ? 'You' : 'Assistant'}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: palette.textMuted }}>{formatExactTime(message.timestamp)}</Typography>
            {isError && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: palette.error, fontSize: 11 }}>
                <ErrorOutlineIcon sx={{ fontSize: 14 }} /> Failed
              </Box>
            )}
          </Box>

          {/* Bubble */}
          <Box sx={{
            bgcolor: bubbleBg,
            color: palette.textPrimary,
            border: '1px solid',
            borderColor: palette.border,
            borderRadius: '14px',
            px: 1.75, py: 1.25,
            width: '100%',
          }}>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mb: message.content ? 1 : 0, flexWrap: 'wrap' }}>
                {message.attachments.map((att, i) => (
                  <Box key={i} sx={{
                    borderRadius: '8px', overflow: 'hidden', border: '1px solid', borderColor: palette.border,
                    bgcolor: palette.bgChat, cursor: att.preview ? 'pointer' : 'default',
                  }} onClick={() => att.preview && setImagePreview(att.preview)}>
                    {att.preview ? (
                      <img src={att.preview} alt={att.name} style={{ maxWidth: 220, maxHeight: 160, display: 'block' }} />
                    ) : (
                      <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography sx={{ fontSize: 11, color: palette.textSecondary }}>📎 {att.name}</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Tool outputs */}
            {message.toolOutputs?.map(output => (
              <ToolOutputBlock key={output.id} output={output} />
            ))}

            {/* Long-content collapse handle */}
            {isLongContent && !isUser && (
              <Box sx={{ mb: 0.5 }}>
                <IconButton size="small" onClick={() => setContentExpanded(!contentExpanded)} sx={{ color: palette.textMuted, p: 0.25 }}>
                  {contentExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                </IconButton>
                <Typography component="span" sx={{ fontSize: 11, color: palette.textMuted, ml: 0.5 }}>
                  {contentExpanded ? 'Collapse' : 'Expand'} response
                </Typography>
              </Box>
            )}

            <Collapse in={contentExpanded} collapsedSize={isLongContent && !isUser ? 0 : undefined}>
              <Box sx={{
                ...(isLongContent && contentExpanded ? { maxHeight: 500, overflow: 'auto', pr: 1 } : {}),
                '& p': { my: 0.5, fontSize: '0.875rem', color: palette.textPrimary, lineHeight: 1.65 },
                '& table': { borderCollapse: 'collapse', width: '100%', my: 1.5, fontSize: '0.8rem', display: 'block', overflowX: 'auto' },
                '& th, & td': { border: '1px solid', borderColor: palette.border, px: 1.5, py: 0.75, textAlign: 'left' },
                '& th': { bgcolor: palette.bgCodeHeader, fontWeight: 600, color: palette.textPrimary },
                '& td': { color: palette.textSecondary },
                '& blockquote': { borderLeft: '3px solid', borderColor: palette.primary, pl: 2, my: 1, color: palette.textSecondary, bgcolor: palette.primarySoft, py: 0.5, borderRadius: '0 6px 6px 0' },
                '& a': { color: palette.primary, textDecoration: 'underline' },
                '& img': { maxWidth: '100%', borderRadius: '8px' },
                '& ul, & ol': { pl: 3, color: palette.textSecondary },
                '& li': { my: 0.25 },
                '& strong': { color: palette.textPrimary },
                '& h1,& h2,& h3,& h4,& h5,& h6': { color: palette.textPrimary, mt: 2, mb: 1 },
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const value = String(children).replace(/\n$/, '');
                      if (match) return <CodeBlock language={match[1]} value={value} />;
                      return (
                        <code style={{
                          background: palette.bgCodeHeader, padding: '2px 6px',
                          borderRadius: '4px', fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                          fontSize: '0.82em', color: palette.error,
                        }} {...props}>{children}</code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </Box>
            </Collapse>

            {/* Streaming cursor */}
            {message.status === 'streaming' && (
              <Box sx={{
                display: 'inline-block', width: 2, height: 16, bgcolor: palette.primary, ml: 0.5,
                animation: 'blink 1s infinite',
                '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
              }} />
            )}
          </Box>

          {/* Events & sources panel (assistant) */}
          {!isUser && message.status === 'complete' && (
            <Box sx={{ width: '100%', mt: 0.75 }}>
              <EventsSourcesPanel
                processingSteps={message.processingSteps}
                sources={message.sources}
                citations={message.citations}
              />
            </Box>
          )}

          {/* Action row */}
          <Box className="msg-actions" sx={{
            display: 'flex', gap: 0.5, mt: 0.5, opacity: 0, transition: 'opacity 0.15s',
            alignItems: 'center', flexDirection: isUser ? 'row-reverse' : 'row',
          }}>
            <Tooltip title="Copy message">
              <IconButton size="small" onClick={handleCopyMessage} sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            {!isUser && message.status === 'complete' && (
              <>
                <Tooltip title="Good response">
                  <IconButton size="small" sx={{ color: palette.textMuted, '&:hover': { color: palette.success } }}>
                    <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Bad response">
                  <IconButton size="small" sx={{ color: palette.textMuted, '&:hover': { color: palette.error } }}>
                    <ThumbDownOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {isError && onRetry && (
              <Tooltip title="Retry">
                <IconButton size="small" onClick={onRetry} sx={{ color: palette.error }}>
                  <ReplayIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Image preview */}
      <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
        </DialogContent>
      </Dialog>

      <Snackbar open={copySnack} autoHideDuration={2000} onClose={() => setCopySnack(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setCopySnack(false)} sx={{ fontSize: 12 }}>Copied to clipboard</Alert>
      </Snackbar>
    </Box>
  );
};

export default MessageBubble;
