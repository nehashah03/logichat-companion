import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, Chip, Collapse } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useDropzone } from 'react-dropzone';
import { isLargeContent, formatFileSize } from '../utils/helpers';
import type { FileAttachment } from '../features/chat/chatSlice';

interface ChatInputProps {
  onSend: (message: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'image/*': [] };

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [pastedExpanded, setPastedExpanded] = useState(false);
  const [largeContent, setLargeContent] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback((files: File[]) => {
    const valid = files.filter(f => f.size <= MAX_FILE_SIZE);
    const newAttachments: FileAttachment[] = valid.map(f => ({
      name: f.name, size: f.size, type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, noClick: true, noKeyboard: true,
    maxSize: MAX_FILE_SIZE,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (isLargeContent(pasted)) {
      e.preventDefault();
      setLargeContent(pasted);
      setPastedExpanded(false);
    }
  };

  const handleSend = () => {
    const content = largeContent ? `${text}\n\n\`\`\`\n${largeContent}\n\`\`\`` : text;
    if (!content.trim() && attachments.length === 0) return;
    onSend(content.trim(), attachments);
    setText('');
    setAttachments([]);
    setLargeContent(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  return (
    <Box {...getRootProps()} sx={{
      p: 2, borderTop: '1px solid', borderColor: 'divider',
      bgcolor: isDragActive ? 'rgba(108,142,239,0.06)' : 'background.paper',
      transition: 'background-color 0.2s',
    }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <Box sx={{
          p: 2, mb: 1, border: '2px dashed', borderColor: 'primary.main',
          borderRadius: 2, textAlign: 'center',
        }}>
          <Typography color="primary">Drop files here...</Typography>
        </Box>
      )}

      {attachments.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {attachments.map((a, i) => (
            <Chip key={i} label={`${a.name} (${formatFileSize(a.size)})`} size="small"
              onDelete={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
              sx={{ bgcolor: 'rgba(108,142,239,0.12)', color: 'text.primary' }} />
          ))}
        </Box>
      )}

      {largeContent && (
        <Box sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
              Large pasted content ({largeContent.length.toLocaleString()} chars)
            </Typography>
            <IconButton size="small" onClick={() => setPastedExpanded(!pastedExpanded)}>
              {pastedExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <IconButton size="small" onClick={() => setLargeContent(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Collapse in={pastedExpanded}>
            <Box sx={{ px: 1.5, pb: 1, maxHeight: 150, overflow: 'auto' }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                {largeContent}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}

      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2,
        border: '1px solid', borderColor: 'divider', px: 1.5, py: 1,
        '&:focus-within': { borderColor: 'primary.main' },
      }}>
        <Tooltip title="Attach file">
          <IconButton size="small" onClick={open} sx={{ color: 'text.secondary' }}>
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask about your logs, tickets, or system outputs..."
          disabled={disabled}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: '#E2E8F0', fontSize: '0.9rem',
            fontFamily: '"Inter", sans-serif', lineHeight: 1.6, maxHeight: 200,
          }}
        />
        <Tooltip title="Send (Enter)">
          <span>
            <IconButton
              onClick={handleSend}
              disabled={disabled || (!text.trim() && !largeContent && attachments.length === 0)}
              sx={{
                bgcolor: 'primary.main', color: '#fff', width: 36, height: 36,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'rgba(108,142,239,0.2)', color: 'rgba(255,255,255,0.3)' },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
        Shift+Enter for new line · Drag & drop files · Max 10MB
      </Typography>
    </Box>
  );
};

export default ChatInput;
