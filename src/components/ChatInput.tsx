import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, Dialog, DialogContent, Snackbar, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useDropzone } from 'react-dropzone';
import { formatFileSize } from '../utils/helpers';
import { useThemeMode } from '../contexts/ThemeModeContext';
import type { FileAttachment } from '../features/chat/chatSlice';

interface ChatInputProps {
  onSend: (message: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
}

const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB COMBINED across all attachments
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/*': [],
};
const MAX_HEIGHT_COLLAPSED = 120;
const MAX_HEIGHT_EXPANDED = 300;

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const { palette } = useThemeMode();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<(FileAttachment & { _size: number })[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'error' | 'warning' | 'success' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentTotal = attachments.reduce((s, a) => s + a._size, 0);

  const onDrop = useCallback((files: File[]) => {
    const accepted: (FileAttachment & { _size: number })[] = [];
    let running = currentTotal;
    let rejected = 0;
    for (const f of files) {
      if (running + f.size > MAX_TOTAL_SIZE) { rejected++; continue; }
      running += f.size;
      accepted.push({
        name: f.name, size: f.size, type: f.type, _size: f.size,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      });
    }
    if (accepted.length) setAttachments(prev => [...prev, ...accepted]);
    if (rejected > 0) {
      setToast({
        msg: `Combined upload limit is 10 MB. Skipped ${rejected} file${rejected > 1 ? 's' : ''}.`,
        sev: 'error',
      });
    }
  }, [currentTotal]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, noClick: true, noKeyboard: true,
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments.map(({ _size, ...rest }) => rest));
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

  const removeAttachment = (i: number) => {
    setAttachments(prev => {
      const target = prev[i];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, j) => j !== i);
    });
  };

  return (
    <Box {...getRootProps()} sx={{
      px: 3, py: 2, borderTop: '1px solid', borderColor: palette.border,
      bgcolor: isDragActive ? palette.primarySoft : palette.bgChat,
      transition: 'background-color 0.2s',
    }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <Box sx={{
          p: 2, mb: 1.5, border: '2px dashed', borderColor: palette.primary,
          borderRadius: '8px', textAlign: 'center', bgcolor: palette.primarySoft,
        }}>
          <Typography sx={{ color: palette.primary, fontSize: 13 }}>Drop files here…</Typography>
        </Box>
      )}

      {attachments.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {attachments.map((a, i) => (
              <Box key={i} sx={{
                position: 'relative', borderRadius: '8px', overflow: 'hidden',
                border: '1px solid', borderColor: palette.border, bgcolor: palette.bgInput,
                display: 'flex', alignItems: 'center', gap: 1,
                ...(a.preview ? { width: 80, height: 80, cursor: 'pointer' } : { px: 1.5, py: 0.75 }),
              }} onClick={() => a.preview && setImagePreview(a.preview)}>
                {a.preview ? (
                  <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <InsertDriveFileIcon sx={{ fontSize: 16, color: palette.textMuted }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, color: palette.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{a.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: palette.textMuted }}>{formatFileSize(a.size)}</Typography>
                    </Box>
                  </>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); removeAttachment(i); }}
                  sx={{
                    position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                    bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: 10.5, color: palette.textMuted, mt: 0.5 }}>
            {formatFileSize(currentTotal)} / 10 MB used
          </Typography>
        </Box>
      )}

      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        bgcolor: palette.bgInput, borderRadius: '12px',
        border: '1px solid', borderColor: palette.border, px: 1.5, py: 1,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:focus-within': { borderColor: palette.primary, boxShadow: `0 0 0 2px ${palette.primarySoft}` },
      }}>
        <Tooltip title="Attach file (10 MB total max)">
          <IconButton size="small" onClick={open} sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}>
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question…"
          disabled={disabled}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: palette.textPrimary, fontSize: '0.875rem',
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
                bgcolor: palette.primary, color: palette.textOnPrimary, width: 32, height: 32,
                borderRadius: '8px',
                '&:hover': { bgcolor: palette.primaryHover },
                '&.Mui-disabled': { bgcolor: palette.border, color: palette.textMuted },
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.sev} onClose={() => setToast(null)} sx={{ fontSize: 12 }}>
            {toast.msg}
          </Alert>
        ) : <span />}
      </Snackbar>
    </Box>
  );
};

export default ChatInput;
