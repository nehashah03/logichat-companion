import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Avatar, IconButton, Tooltip, Collapse,
  Dialog, DialogContent, Snackbar, Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage } from '../features/chat/chatSlice';
import PipelinePanel from './PipelinePanel';
import SourcesPanel from './SourcesPanel';
import CitationChip from './CitationChip';
import InteractiveTable from './InteractiveTable';
import { useThemeMode } from '../contexts/ThemeModeContext';

interface Props {
  message: ChatMessage;
  onRetry?: () => void;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CITATION_RE = /\[(\d+)\]/g;

/** Parse "...text [1] more text [2]..." into nodes that render CitationChip in place. */
function renderWithCitations(text: string, sourceById: Map<string, any>, citations: any[]) {
  if (!citations?.length) return text;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(CITATION_RE)) {
    const idx = parseInt(m[1], 10);
    const cit = citations.find(c => c.index === idx);
    if (!cit) continue;
    parts.push(text.slice(last, m.index));
    parts.push(<CitationChip key={`cit-${m.index}-${idx}`} index={idx} source={sourceById.get(cit.sourceId)} />);
    last = (m.index || 0) + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

const MessageBubble: React.FC<Props> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const { palette, mode } = useThemeMode();
  const [copySnack, setCopySnack] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const sourceById = useMemo(() => {
    const m = new Map();
    message.sources?.forEach(s => m.set(s.id, s));
    return m;
  }, [message.sources]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopySnack(true);
  };

  const CodeBlock = ({ language, value }: { language: string; value: string }) => {
    const [copied, setCopied] = useState(false);
    return (
      <Box sx={{ position: 'relative', my: 1.5, borderRadius: '8px', overflow: 'hidden', border: '1px solid', borderColor: palette.border }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5, bgcolor: palette.bgCodeHeader }}>
          <Typography sx={{ fontFamily: '"SF Mono", "JetBrains Mono", monospace', color: palette.textSecondary, fontSize: 11 }}>
            {language || 'code'}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
            <IconButton size="small" onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}>
              <ContentCopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <SyntaxHighlighter
          language={language || 'text'} style={mode === 'light' ? oneLight : oneDark}
          customStyle={{ margin: 0, padding: 14, fontSize: '0.78rem', background: palette.bgCode }}
        >
          {value}
        </SyntaxHighlighter>
      </Box>
    );
  };

  const bubbleBg = isUser ? palette.bgUserBubble : palette.bgAssistantBubble;
  const citations = message.citations || [];

  return (
    <Box sx={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2, animation: 'fade .2s ease-out',
      '@keyframes fade': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
      '&:hover .msg-actions': { opacity: 1 },
    }}>
      <Box sx={{
        display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 1.25,
        width: '70%', maxWidth: '70%', minWidth: 0,
      }}>
        <Avatar sx={{
          width: 32, height: 32, mt: 0.25, flexShrink: 0,
          bgcolor: isUser ? palette.primarySoft : palette.primary,
          color: isUser ? palette.primary : palette.textOnPrimary,
        }}>
          {isUser ? <PersonOutlineIcon sx={{ fontSize: 18 }} /> : <AutoAwesomeIcon sx={{ fontSize: 17 }} />}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexDirection: isUser ? 'row-reverse' : 'row' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: isUser ? palette.userAccent : palette.textPrimary }}>
              {isUser ? 'You' : 'Assistant'}
            </Typography>
            <Typography sx={{ fontSize: 11, color: palette.textMuted }}>{fmtTime(message.timestamp)}</Typography>
            {isError && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: palette.error, fontSize: 11 }}>
                <ErrorOutlineIcon sx={{ fontSize: 14 }} /> Failed
              </Box>
            )}
          </Box>

          <Box sx={{
            bgcolor: bubbleBg, color: palette.textPrimary,
            border: '1px solid', borderColor: palette.border, borderRadius: '14px',
            px: 1.75, py: 1.25, width: '100%',
          }}>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mb: message.content ? 1 : 0, flexWrap: 'wrap' }}>
                {message.attachments.map((att, i) => (
                  <Box key={i}
                    onClick={() => att.preview && setImagePreview(att.preview)}
                    sx={{
                      borderRadius: '8px', overflow: 'hidden', border: '1px solid', borderColor: palette.border,
                      bgcolor: palette.bgChat, cursor: att.preview ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {att.preview ? (
                      <img src={att.preview} alt={att.name} style={{ maxWidth: 220, maxHeight: 160, display: 'block' }} />
                    ) : (
                      <Box sx={{ px: 1.25, py: 0.85, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <InsertDriveFileIcon sx={{ fontSize: 16, color: palette.textMuted }} />
                        <Typography sx={{ fontSize: 11.5, color: palette.textPrimary }}>{att.name}</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Pasted snippets shown in user messages */}
            {message.pasteSnippets?.map(s => (
              <Box key={s.id} sx={{ my: 0.75, borderRadius: '8px', overflow: 'hidden', border: '1px solid', borderColor: palette.border }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1.25, py: 0.5, bgcolor: palette.bgCodeHeader }}>
                  <Typography sx={{ fontSize: 11, color: palette.textMuted, fontFamily: 'monospace' }}>
                    📋 pasted snippet · {s.lines} lines
                  </Typography>
                </Box>
                <SyntaxHighlighter language={s.language} style={mode === 'light' ? oneLight : oneDark}
                  customStyle={{ margin: 0, padding: 12, fontSize: '0.75rem', background: palette.bgCode, maxHeight: 200, overflow: 'auto' }}>
                  {s.content}
                </SyntaxHighlighter>
              </Box>
            ))}

            {/* Markdown body */}
            <Box sx={{
              '& p': { my: 0.5, fontSize: '0.9rem', color: palette.textPrimary, lineHeight: 1.65 },
              '& table': { borderCollapse: 'collapse', width: '100%', my: 1.5, fontSize: '0.82rem', display: 'block', overflowX: 'auto' },
              '& th, & td': { border: '1px solid', borderColor: palette.border, px: 1.5, py: 0.75, textAlign: 'left' },
              '& th': { bgcolor: palette.bgCodeHeader, fontWeight: 600, color: palette.textPrimary },
              '& td': { color: palette.textSecondary },
              '& blockquote': { borderLeft: '3px solid', borderColor: palette.primary, pl: 2, my: 1, color: palette.textSecondary, bgcolor: palette.primarySoft, py: 0.5, borderRadius: '0 6px 6px 0' },
              '& a': { color: palette.primary, textDecoration: 'underline' },
              '& ul, & ol': { pl: 3, color: palette.textSecondary },
              '& li': { my: 0.25 },
              '& strong': { color: palette.textPrimary },
              '& h1,& h2,& h3,& h4': { color: palette.textPrimary, mt: 2, mb: 1 },
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
                        background: palette.bgCodeHeader, padding: '2px 6px', borderRadius: 4,
                        fontFamily: '"SF Mono", "JetBrains Mono", monospace', fontSize: '0.82em',
                        color: palette.primary,
                      }} {...props}>{children}</code>
                    );
                  },
                  table({ children }) {
                    return <InteractiveTable>{children}</InteractiveTable>;
                  },
                  // Replace inline citations [N] inside text with hover chips
                  p({ children }) {
                    const transformed = React.Children.map(children, child => {
                      if (typeof child === 'string') return renderWithCitations(child, sourceById, citations);
                      return child;
                    });
                    return <p>{transformed}</p>;
                  },
                  li({ children }) {
                    const transformed = React.Children.map(children, child => {
                      if (typeof child === 'string') return renderWithCitations(child, sourceById, citations);
                      return child;
                    });
                    return <li>{transformed}</li>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </Box>

            {message.status === 'streaming' && (
              <Box sx={{
                display: 'inline-block', width: 6, height: 14, bgcolor: palette.primary, ml: 0.5,
                animation: 'blk 1s infinite',
                '@keyframes blk': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
              }} />
            )}
          </Box>

          {/* Persisted Events + Sources after completion */}
          {!isUser && message.status === 'complete' && (
            <Box sx={{ width: '100%', mt: 0.85, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {message.pipeline && message.pipeline.length > 0 && (
                <PipelinePanel phases={message.pipeline} compact defaultOpen={false} />
              )}
              {message.sources && message.sources.length > 0 && (
                <SourcesPanel sources={message.sources} citations={message.citations} />
              )}
            </Box>
          )}

          {/* Action row */}
          <Box className="msg-actions" sx={{
            display: 'flex', gap: 0.25, mt: 0.5, opacity: 0, transition: 'opacity .15s',
            alignItems: 'center', flexDirection: isUser ? 'row-reverse' : 'row',
          }}>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={handleCopy} sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}>
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

      <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="md">
        <DialogContent sx={{ p: 1, bgcolor: palette.bgChat }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
        </DialogContent>
      </Dialog>

      <Snackbar open={copySnack} autoHideDuration={1500} onClose={() => setCopySnack(false)}>
        <Alert severity="success" onClose={() => setCopySnack(false)} sx={{ fontSize: 12 }}>Copied</Alert>
      </Snackbar>
    </Box>
  );
};

export default MessageBubble;
