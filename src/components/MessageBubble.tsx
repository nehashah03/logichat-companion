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
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, ToolOutput } from '../features/chat/chatSlice';
import { formatTimestamp } from '../utils/helpers';
import EventsSourcesPanel from './EventsSourcesPanel';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: 'relative', my: 1.5, borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5, bgcolor: '#F3F4F6' }}>
        <Typography sx={{ fontFamily: '"SF Mono", "JetBrains Mono", monospace', color: '#666', fontSize: 11 }}>{language || 'code'}</Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
          <IconButton size="small" onClick={handleCopy} sx={{ color: '#888', '&:hover': { color: '#333' } }}>
            <ContentCopyIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter language={language || 'text'} style={oneLight}
        customStyle={{ margin: 0, padding: '14px', fontSize: '0.78rem', background: '#FAFAFA' }}>
        {value}
      </SyntaxHighlighter>
    </Box>
  );
};

const ToolOutputBlock: React.FC<{ output: ToolOutput }> = ({ output }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box sx={{ my: 1, borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex', alignItems: 'center', px: 2, py: 0.75, cursor: 'pointer',
          bgcolor: '#F9FAFB', '&:hover': { bgcolor: '#F3F4F6' },
        }}
      >
        <TerminalIcon sx={{ fontSize: 14, color: '#2e7d32', mr: 1 }} />
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: '#2e7d32', mr: 1 }}>{output.name}</Typography>
        <Typography sx={{ flex: 1, fontSize: 11, color: '#999' }}>Tool Output</Typography>
        {expanded ? <ExpandLessIcon sx={{ fontSize: 16, color: '#999' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#999' }} />}
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#FAFAFA', maxHeight: 200, overflow: 'auto' }}>
          {output.type === 'code' ? (
            <SyntaxHighlighter language="json" style={oneLight} customStyle={{ margin: 0, fontSize: '0.75rem', background: 'transparent' }}>
              {output.content}
            </SyntaxHighlighter>
          ) : (
            <Typography sx={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: '#555' }}>{output.content}</Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const [copySnack, setCopySnack] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleCopyMessage = () => {
    const label = isUser ? 'You' : 'Assistant';
    const text = `${label}:\n${message.content}`;
    navigator.clipboard.writeText(text);
    setCopySnack(true);
  };

  // Check if content is long
  const isLongContent = message.content.length > 800 || message.content.split('\n').length > 20;
  const [contentExpanded, setContentExpanded] = useState(true);

  return (
    <Box sx={{
      display: 'flex', gap: 1.5, px: 3, py: 1.5,
      '&:hover .msg-actions': { opacity: 1 },
      animation: 'fadeIn 0.2s ease-out',
      '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
    }}>
      <Avatar sx={{
        width: 28, height: 28, mt: 0.25,
        bgcolor: isUser ? '#F3F4F6' : '#E3F2FD',
        color: isUser ? '#666' : '#1976d2',
      }}>
        {isUser ? <PersonOutlineIcon sx={{ fontSize: 16 }} /> : <SmartToyOutlinedIcon sx={{ fontSize: 16 }} />}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: isUser ? '#333' : '#1976d2' }}>
            {isUser ? 'You' : 'Assistant'}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: '#999' }}>{formatTimestamp(message.timestamp)}</Typography>
          {isError && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#d32f2f', fontSize: 11 }}>
              <ErrorOutlineIcon sx={{ fontSize: 14 }} /> Failed
            </Box>
          )}
        </Box>

        {/* File attachment previews */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {message.attachments.map((att, i) => (
              <Box key={i} sx={{
                borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB',
                cursor: att.preview ? 'pointer' : 'default',
              }} onClick={() => att.preview && setImagePreview(att.preview)}>
                {att.preview ? (
                  <img src={att.preview} alt={att.name} style={{ maxWidth: 200, maxHeight: 150, display: 'block' }} />
                ) : (
                  <Box sx={{ px: 1.5, py: 0.75, bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ fontSize: 11, color: '#666' }}>📎 {att.name}</Typography>
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

        {/* Message content with optional expand/collapse for long content */}
        {isLongContent && !isUser && (
          <Box sx={{ mb: 0.5 }}>
            <IconButton size="small" onClick={() => setContentExpanded(!contentExpanded)} sx={{ color: '#999', p: 0.25 }}>
              {contentExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            <Typography component="span" sx={{ fontSize: 11, color: '#999', ml: 0.5 }}>
              {contentExpanded ? 'Collapse' : 'Expand'} response
            </Typography>
          </Box>
        )}

        <Collapse in={contentExpanded} collapsedSize={isLongContent && !isUser ? 0 : undefined}>
          <Box sx={{
            ...(isLongContent && contentExpanded ? { maxHeight: 500, overflow: 'auto', pr: 1 } : {}),
            '& p': { my: 0.5, fontSize: '0.875rem', color: '#333', lineHeight: 1.65 },
            '& table': { borderCollapse: 'collapse', width: '100%', my: 1.5, fontSize: '0.8rem' },
            '& th, & td': { border: '1px solid #E5E7EB', px: 1.5, py: 0.75, textAlign: 'left' },
            '& th': { bgcolor: '#F3F4F6', fontWeight: 600, color: '#333' },
            '& td': { color: '#555' },
            '& blockquote': { borderLeft: '3px solid #1976d2', pl: 2, my: 1, color: '#666', bgcolor: '#F8FAFF', py: 0.5, borderRadius: '0 6px 6px 0' },
            '& a': { color: '#1976d2', textDecoration: 'underline' },
            '& img': { maxWidth: '100%', borderRadius: '8px' },
            '& ul, & ol': { pl: 3, color: '#555' },
            '& li': { my: 0.25 },
            '& strong': { color: '#1a1a1a' },
            '& h1,& h2,& h3,& h4,& h5,& h6': { color: '#1a1a1a', mt: 2, mb: 1 },
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
                      background: '#F3F4F6', padding: '2px 6px',
                      borderRadius: '4px', fontFamily: '"SF Mono", "JetBrains Mono", monospace', fontSize: '0.82em', color: '#d32f2f',
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
          <Box sx={{ display: 'inline-block', width: 2, height: 16, bgcolor: '#1976d2', ml: 0.5, animation: 'blink 1s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
        )}

        {/* Events & Sources panel */}
        {!isUser && message.status === 'complete' && (
          <EventsSourcesPanel
            processingSteps={message.processingSteps}
            sources={message.sources}
            citations={message.citations}
          />
        )}

        {/* Actions: copy, thumbs, retry */}
        <Box className="msg-actions" sx={{ display: 'flex', gap: 0.5, mt: 0.5, opacity: 0, transition: 'opacity 0.15s', alignItems: 'center' }}>
          <Tooltip title="Copy">
            <IconButton size="small" onClick={handleCopyMessage} sx={{ color: '#999', '&:hover': { color: '#333' } }}>
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          {!isUser && message.status === 'complete' && (
            <>
              <Tooltip title="Good response">
                <IconButton size="small" sx={{ color: '#999', '&:hover': { color: '#2e7d32' } }}>
                  <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bad response">
                <IconButton size="small" sx={{ color: '#999', '&:hover': { color: '#d32f2f' } }}>
                  <ThumbDownOutlinedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
          {isError && onRetry && (
            <Tooltip title="Retry">
              <IconButton size="small" onClick={onRetry} sx={{ color: '#d32f2f' }}>
                <ReplayIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Image preview dialog */}
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
