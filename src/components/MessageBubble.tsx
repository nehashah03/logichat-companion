import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip, Collapse, Chip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TerminalIcon from '@mui/icons-material/Terminal';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage, ToolOutput } from '../features/chat/chatSlice';
import { formatTimestamp } from '../utils/helpers';

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
    <Box sx={{ position: 'relative', my: 1.5, borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5, bgcolor: '#1E1E1E' }}>
        <Typography sx={{ fontFamily: 'monospace', color: '#666', fontSize: 11 }}>{language || 'code'}</Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton size="small" onClick={handleCopy} sx={{ color: '#666', '&:hover': { color: '#999' } }}>
            <ContentCopyIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter language={language || 'text'} style={oneDark}
        customStyle={{ margin: 0, padding: '14px', fontSize: '0.78rem', background: '#1A1A1A' }}>
        {value}
      </SyntaxHighlighter>
    </Box>
  );
};

const ToolOutputBlock: React.FC<{ output: ToolOutput }> = ({ output }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box sx={{ my: 1, borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex', alignItems: 'center', px: 2, py: 0.75, cursor: 'pointer',
          bgcolor: '#252525', '&:hover': { bgcolor: '#2A2A2A' },
        }}
      >
        <TerminalIcon sx={{ fontSize: 14, color: '#00D68F', mr: 1 }} />
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11.5, color: '#00D68F', mr: 1 }}>{output.name}</Typography>
        <Typography sx={{ flex: 1, fontSize: 11, color: '#666' }}>Tool Output</Typography>
        {expanded ? <ExpandLessIcon sx={{ fontSize: 16, color: '#666' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#666' }} />}
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: '#1A1A1A' }}>
          {output.type === 'code' ? (
            <SyntaxHighlighter language="json" style={oneDark} customStyle={{ margin: 0, fontSize: '0.75rem', background: 'transparent' }}>
              {output.content}
            </SyntaxHighlighter>
          ) : (
            <Typography sx={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: '#CCC' }}>{output.content}</Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';

  return (
    <Box sx={{
      display: 'flex', gap: 1.5, px: 3, py: 1.5,
      '&:hover .msg-actions': { opacity: 1 },
      animation: 'fadeIn 0.2s ease-out',
      '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
    }}>
      <Avatar sx={{
        width: 28, height: 28, mt: 0.25,
        bgcolor: isUser ? 'transparent' : 'rgba(0,122,255,0.15)',
        color: isUser ? '#808080' : '#007AFF',
        border: isUser ? '1px solid #333' : 'none',
        fontSize: 13,
      }}>
        {isUser ? <PersonOutlineIcon sx={{ fontSize: 16 }} /> : <TerminalIcon sx={{ fontSize: 16 }} />}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: isUser ? '#CCC' : '#007AFF' }}>
            {isUser ? 'You' : 'Cursor'}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: '#555' }}>{formatTimestamp(message.timestamp)}</Typography>
          {isError && <Chip icon={<ErrorOutlineIcon />} label="Failed" size="small" sx={{ height: 18, fontSize: 10, color: '#FF6B6B', borderColor: '#FF6B6B' }} variant="outlined" />}
        </Box>

        {/* Image attachment previews */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {message.attachments.map((att, i) => (
              <Box key={i} sx={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
                {att.preview ? (
                  <img src={att.preview} alt={att.name} style={{ maxWidth: 200, maxHeight: 150, display: 'block' }} />
                ) : (
                  <Box sx={{ px: 1.5, py: 0.75, bgcolor: '#252525', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ fontSize: 11, color: '#999' }}>📎 {att.name}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {message.toolOutputs?.map(output => (
          <ToolOutputBlock key={output.id} output={output} />
        ))}

        <Box sx={{
          '& p': { my: 0.5, fontSize: '0.875rem', color: '#E8E8E8', lineHeight: 1.65 },
          '& table': { borderCollapse: 'collapse', width: '100%', my: 1.5, fontSize: '0.8rem' },
          '& th, & td': { border: '1px solid #333', px: 1.5, py: 0.75, textAlign: 'left' },
          '& th': { bgcolor: '#252525', fontWeight: 600, color: '#CCC' },
          '& td': { color: '#AAA' },
          '& blockquote': { borderLeft: '3px solid #007AFF', pl: 2, my: 1, color: '#808080' },
          '& a': { color: '#007AFF' },
          '& img': { maxWidth: '100%', borderRadius: '6px' },
          '& ul, & ol': { pl: 3, color: '#CCC' },
          '& li': { my: 0.25 },
          '& strong': { color: '#E8E8E8' },
          '& h1,& h2,& h3,& h4,& h5,& h6': { color: '#E8E8E8', mt: 2, mb: 1 },
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
                    background: '#2A2A2A', padding: '2px 6px',
                    borderRadius: '4px', fontFamily: '"SF Mono", monospace', fontSize: '0.82em', color: '#E8E8E8',
                  }} {...props}>{children}</code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </Box>

        {message.status === 'streaming' && (
          <Box sx={{ display: 'inline-block', width: 2, height: 16, bgcolor: '#007AFF', ml: 0.5, animation: 'blink 1s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
        )}

        <Box className="msg-actions" sx={{ display: 'flex', gap: 0.5, mt: 0.5, opacity: 0, transition: 'opacity 0.15s' }}>
          {!isUser && message.status === 'complete' && (
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(message.content)} sx={{ color: '#555', '&:hover': { color: '#999' } }}>
                <ContentCopyIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          )}
          {isError && onRetry && (
            <Tooltip title="Retry">
              <IconButton size="small" onClick={onRetry} sx={{ color: '#FF6B6B' }}>
                <ReplayIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;
