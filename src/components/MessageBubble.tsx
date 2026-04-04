import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip, Collapse, Chip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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
    <Box sx={{ position: 'relative', my: 1.5, borderRadius: '8px', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.5, bgcolor: 'rgba(0,0,0,0.3)' }}>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{language || 'code'}</Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton size="small" onClick={handleCopy} sx={{ color: 'text.secondary' }}>
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter language={language || 'text'} style={oneDark}
        customStyle={{ margin: 0, padding: '16px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
        {value}
      </SyntaxHighlighter>
    </Box>
  );
};

const ToolOutputBlock: React.FC<{ output: ToolOutput }> = ({ output }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Box sx={{ my: 1, borderRadius: '8px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer',
          bgcolor: 'rgba(45,212,168,0.06)', '&:hover': { bgcolor: 'rgba(45,212,168,0.1)' },
        }}
      >
        <Chip label={output.name} size="small" sx={{ bgcolor: 'rgba(45,212,168,0.15)', color: 'secondary.main', fontFamily: 'monospace', fontSize: 11, mr: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>Tool Output</Typography>
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.15)' }}>
          {output.type === 'code' ? (
            <SyntaxHighlighter language="json" style={oneDark} customStyle={{ margin: 0, fontSize: '0.75rem', background: 'transparent' }}>
              {output.content}
            </SyntaxHighlighter>
          ) : (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>{output.content}</Typography>
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
      display: 'flex', gap: 1.5, px: 3, py: 2,
      bgcolor: isUser ? 'transparent' : 'rgba(255,255,255,0.02)',
      '&:hover .msg-actions': { opacity: 1 },
      animation: 'fadeIn 0.3s ease-out',
      '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
    }}>
      <Avatar sx={{
        width: 32, height: 32, mt: 0.5,
        bgcolor: isUser ? 'rgba(108,142,239,0.2)' : 'rgba(45,212,168,0.2)',
        color: isUser ? 'primary.main' : 'secondary.main',
      }}>
        {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontSize: 13 }}>
            {isUser ? 'You' : 'DevAssist'}
          </Typography>
          <Typography variant="caption" color="text.disabled">{formatTimestamp(message.timestamp)}</Typography>
          {isError && <Chip icon={<ErrorOutlineIcon />} label="Failed" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
        </Box>

        {message.toolOutputs?.map(output => (
          <ToolOutputBlock key={output.id} output={output} />
        ))}

        <Box sx={{
          '& p': { my: 0.5 },
          '& table': { borderCollapse: 'collapse', width: '100%', my: 1.5, fontSize: '0.8rem' },
          '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1.5, py: 0.75, textAlign: 'left' },
          '& th': { bgcolor: 'rgba(255,255,255,0.04)', fontWeight: 600 },
          '& blockquote': { borderLeft: '3px solid', borderColor: 'primary.main', pl: 2, my: 1, color: 'text.secondary' },
          '& a': { color: 'primary.main' },
          '& img': { maxWidth: '100%', borderRadius: 1 },
          '& ul, & ol': { pl: 3 },
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
                    background: 'rgba(255,255,255,0.06)', padding: '1px 6px',
                    borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85em',
                  }} {...props}>{children}</code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </Box>

        {message.status === 'streaming' && (
          <Box sx={{ display: 'inline-block', width: 6, height: 18, bgcolor: 'primary.main', ml: 0.5, animation: 'blink 1s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
        )}

        <Box className="msg-actions" sx={{ display: 'flex', gap: 0.5, mt: 0.5, opacity: 0, transition: 'opacity 0.2s' }}>
          {!isUser && message.status === 'complete' && (
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(message.content)}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
          {isError && onRetry && (
            <Tooltip title="Retry">
              <IconButton size="small" onClick={onRetry} sx={{ color: 'error.main' }}>
                <ReplayIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;
