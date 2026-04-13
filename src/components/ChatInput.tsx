import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, Dialog, DialogContent } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useDropzone } from 'react-dropzone';
import { formatFileSize } from '../utils/helpers';
import type { FileAttachment } from '../features/chat/chatSlice';

interface ChatInputProps {
  onSend: (message: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'image/*': [] };
const MIN_ROWS = 1;
const MAX_HEIGHT_COLLAPSED = 120;
const MAX_HEIGHT_EXPANDED = 300;

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const el = e.target;
    el.style.height = 'auto';
    const lines = val.split('\n').length;
    const maxH = lines > 4 ? MAX_HEIGHT_EXPANDED : MAX_HEIGHT_COLLAPSED;
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
  };

  return (
    <Box {...getRootProps()} sx={{
      px: 3, py: 2, borderTop: '1px solid', borderColor: '#E5E7EB',
      bgcolor: isDragActive ? '#F0F7FF' : '#FFFFFF',
      transition: 'background-color 0.2s',
    }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <Box sx={{
          p: 2, mb: 1.5, border: '2px dashed #1976d2',
          borderRadius: '8px', textAlign: 'center', bgcolor: '#F0F7FF',
        }}>
          <Typography sx={{ color: '#1976d2', fontSize: 13 }}>Drop files here...</Typography>
        </Box>
      )}

      {/* File attachment previews */}
      {attachments.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          {attachments.map((a, i) => (
            <Box key={i} sx={{
              position: 'relative', borderRadius: '8px', overflow: 'hidden',
              border: '1px solid #E5E7EB', bgcolor: '#F9FAFB',
              display: 'flex', alignItems: 'center', gap: 1,
              ...(a.preview ? { width: 80, height: 80, cursor: 'pointer' } : { px: 1.5, py: 0.75 }),
            }} onClick={() => a.preview && setImagePreview(a.preview)}>
              {a.preview ? (
                <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: '#888' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 11, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{a.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: '#888' }}>{formatFileSize(a.size)}</Typography>
                  </Box>
                </>
              )}
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setAttachments(prev => prev.filter((_, j) => j !== i)); }}
                sx={{
                  position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                  bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        bgcolor: '#F9FAFB', borderRadius: '12px',
        border: '1px solid #E5E7EB', px: 1.5, py: 1,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:focus-within': { borderColor: '#1976d2', boxShadow: '0 0 0 2px rgba(25,118,210,0.1)' },
      }}>
        <Tooltip title="Attach file">
          <IconButton size="small" onClick={open} sx={{ color: '#999', '&:hover': { color: '#333' } }}>
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask a followup question"
          disabled={disabled}
          rows={MIN_ROWS}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: '#1a1a1a', fontSize: '0.875rem',
            fontFamily: '"Inter", -apple-system, sans-serif', lineHeight: 1.5,
            maxHeight: MAX_HEIGHT_EXPANDED, overflowY: 'auto',
          }}
        />
        <Tooltip title="Send (Enter)">
          <span>
            <IconButton
              onClick={handleSend}
              disabled={disabled || (!text.trim() && attachments.length === 0)}
              sx={{
                bgcolor: '#1976d2', color: '#fff', width: 32, height: 32,
                borderRadius: '8px',
                '&:hover': { bgcolor: '#1565c0' },
                '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#bbb' },
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Image preview dialog */}
      <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ChatInput;
