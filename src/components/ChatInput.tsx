import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, Chip, Collapse } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useDropzone } from 'react-dropzone';
import { isLargeContent, formatFileSize } from '../utils/helpers';
import type { FileAttachment } from '../features/chat/chatSlice';

interface ChatInputProps {
  onSend: (message: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'image/*': [] };
const MIN_ROWS = 1;
const EXPAND_THRESHOLD_LINES = 4;

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [pastedExpanded, setPastedExpanded] = useState(false);
  const [largeContent, setLargeContent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
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
    setIsExpanded(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const el = e.target;
    el.style.height = 'auto';

    const lines = val.split('\n').length;
    if (lines > EXPAND_THRESHOLD_LINES && !isExpanded) {
      setIsExpanded(true);
    }

    const maxH = isExpanded ? 300 : 120;
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      const maxH = !isExpanded ? 300 : 120;
      el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
    }
  };

  return (
    <Box {...getRootProps()} sx={{
      px: 3, py: 2, borderTop: '1px solid', borderColor: '#2D2D2D',
      bgcolor: isDragActive ? 'rgba(0,122,255,0.04)' : '#1A1A1A',
      transition: 'background-color 0.2s',
    }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <Box sx={{
          p: 2, mb: 1.5, border: '2px dashed', borderColor: '#007AFF',
          borderRadius: '8px', textAlign: 'center', bgcolor: 'rgba(0,122,255,0.06)',
        }}>
          <Typography sx={{ color: '#007AFF', fontSize: 13 }}>Drop files here...</Typography>
        </Box>
      )}

      {/* Image previews */}
      {attachments.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          {attachments.map((a, i) => (
            <Box key={i} sx={{
              position: 'relative', borderRadius: '8px', overflow: 'hidden',
              border: '1px solid #333', bgcolor: '#252525',
              display: 'flex', alignItems: 'center', gap: 1,
              ...(a.preview ? { width: 80, height: 80 } : { px: 1.5, py: 0.75 }),
            }}>
              {a.preview ? (
                <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: '#666' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, color: '#CCC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{a.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: '#666' }}>{formatFileSize(a.size)}</Typography>
                  </Box>
                </>
              )}
              <IconButton
                size="small"
                onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                sx={{
                  position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                  bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {largeContent && (
        <Box sx={{ mb: 1.5, bgcolor: '#252525', borderRadius: '6px', border: '1px solid #333' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5 }}>
            <Typography sx={{ flex: 1, fontSize: 11, color: '#808080' }}>
              Large pasted content ({largeContent.length.toLocaleString()} chars)
            </Typography>
            <IconButton size="small" onClick={() => setPastedExpanded(!pastedExpanded)} sx={{ color: '#666' }}>
              {pastedExpanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            <IconButton size="small" onClick={() => setLargeContent(null)} sx={{ color: '#666' }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Collapse in={pastedExpanded}>
            <Box sx={{ px: 1.5, pb: 1, maxHeight: 150, overflow: 'auto' }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap', color: '#808080' }}>
                {largeContent}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}

      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        bgcolor: '#252525', borderRadius: '10px',
        border: '1px solid #333', px: 1.5, py: 1,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:focus-within': { borderColor: '#007AFF', boxShadow: '0 0 0 1px rgba(0,122,255,0.3)' },
      }}>
        <Tooltip title="Attach file">
          <IconButton size="small" onClick={open} sx={{ color: '#666', '&:hover': { color: '#999' } }}>
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {text.split('\n').length > EXPAND_THRESHOLD_LINES && (
          <Tooltip title={isExpanded ? 'Minimize' : 'Expand'}>
            <IconButton size="small" onClick={toggleExpand} sx={{ color: '#666', '&:hover': { color: '#999' } }}>
              {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask anything..."
          disabled={disabled}
          rows={MIN_ROWS}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: '#E8E8E8', fontSize: '0.875rem',
            fontFamily: '"Inter", -apple-system, sans-serif', lineHeight: 1.5,
            maxHeight: isExpanded ? 300 : 120,
          }}
        />
        <Tooltip title="Send (Enter)">
          <span>
            <IconButton
              onClick={handleSend}
              disabled={disabled || (!text.trim() && !largeContent && attachments.length === 0)}
              sx={{
                bgcolor: '#007AFF', color: '#fff', width: 32, height: 32,
                borderRadius: '8px',
                '&:hover': { bgcolor: '#0066DD' },
                '&.Mui-disabled': { bgcolor: '#333', color: '#555' },
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Typography sx={{ mt: 0.75, display: 'block', textAlign: 'center', fontSize: 10.5, color: '#4A4A4A' }}>
        Shift+Enter for new line · Drag & drop files · Max 10MB
      </Typography>
    </Box>
  );
};

export default ChatInput;
