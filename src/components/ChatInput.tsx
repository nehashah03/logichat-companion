import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Tooltip, Typography, Dialog, DialogContent, Snackbar, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CodeIcon from '@mui/icons-material/Code';
import { useDropzone } from 'react-dropzone';
import { formatFileSize, generateId } from '../utils/helpers';
import { useThemeMode } from '../contexts/ThemeModeContext';
import type { FileAttachment, PasteSnippet } from '../features/chat/chatSlice';

interface Props {
  onSend: (content: string, attachments: FileAttachment[], snippets?: PasteSnippet[]) => void;
  disabled: boolean;
}

const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB combined
const ACCEPTED: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/json': ['.json'],
  'text/plain': ['.txt', '.log', '.md'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/*': [],
};
const PASTE_SNIPPET_THRESHOLD = 500;

function detectLang(text: string): string {
  if (/^\s*[{[]/.test(text) && /[}\]]\s*$/.test(text)) return 'json';
  if (/^(import |from |def |class |print\()/m.test(text)) return 'python';
  if (/^(const |let |var |function |import .+ from)/m.test(text)) return 'javascript';
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE)\b/im.test(text)) return 'sql';
  if (/^[A-Z][a-z]{2} \d+ \d{2}:\d{2}:\d{2}/m.test(text) || /\bERROR\b|\bWARN\b/m.test(text)) return 'log';
  return 'text';
}

const ChatInput: React.FC<Props> = ({ onSend, disabled }) => {
  const { palette } = useThemeMode();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<(FileAttachment & { _size: number })[]>([]);
  const [snippets, setSnippets] = useState<PasteSnippet[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'error' | 'warning' | 'success' } | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const total = attachments.reduce((s, a) => s + a._size, 0);

  const onDrop = useCallback((files: File[]) => {
    const accepted: (FileAttachment & { _size: number })[] = [];
    let running = total;
    let rejected = 0, oversize = 0;
    for (const f of files) {
      if (f.size > MAX_TOTAL_SIZE) { oversize++; continue; }
      if (running + f.size > MAX_TOTAL_SIZE) { rejected++; continue; }
      running += f.size;
      accepted.push({
        name: f.name, size: f.size, type: f.type, _size: f.size,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      });
    }
    if (accepted.length) setAttachments(p => [...p, ...accepted]);
    if (oversize) setToast({ msg: `${oversize} file(s) exceed the 10 MB limit.`, sev: 'error' });
    else if (rejected) setToast({ msg: `Combined upload limit is 10 MB. Skipped ${rejected} file(s).`, sev: 'error' });
  }, [total]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, accept: ACCEPTED, noClick: true, noKeyboard: true,
    onDropRejected(files) {
      const types = Array.from(new Set(files.map(f => f.file.type || 'unknown')));
      setToast({ msg: `Unsupported file type${types.length > 1 ? 's' : ''}: ${types.join(', ')}`, sev: 'warning' });
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.length >= PASTE_SNIPPET_THRESHOLD) {
      e.preventDefault();
      const lang = detectLang(pasted);
      setSnippets(prev => [
        ...prev,
        { id: generateId(), language: lang, content: pasted, lines: pasted.split('\n').length },
      ]);
      setToast({ msg: `Long paste converted to a snippet (${pasted.split('\n').length} lines)`, sev: 'success' });
    }
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0 && snippets.length === 0) return;
    onSend(
      text.trim(),
      attachments.map(({ _size, ...rest }) => rest),
      snippets,
    );
    setText('');
    setAttachments([]);
    setSnippets([]);
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  };

  const removeAttachment = (i: number) => {
    setAttachments(prev => {
      const t = prev[i];
      if (t?.preview) URL.revokeObjectURL(t.preview);
      return prev.filter((_, j) => j !== i);
    });
  };
  const removeSnippet = (id: string) => setSnippets(s => s.filter(x => x.id !== id));

  return (
    <Box {...getRootProps()} sx={{
      px: 3, py: 2, borderTop: '1px solid', borderColor: palette.border,
      bgcolor: isDragActive ? palette.primarySoft : palette.bgChat,
      transition: 'background-color .2s',
    }}>
      <input {...getInputProps()} />

      {isDragActive && (
        <Box sx={{ p: 2, mb: 1.5, border: '2px dashed', borderColor: palette.primary, borderRadius: '8px', textAlign: 'center', bgcolor: palette.primarySoft }}>
          <Typography sx={{ color: palette.primary, fontSize: 13 }}>Drop files here…</Typography>
        </Box>
      )}

      {/* Snippet chips */}
      {snippets.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
          {snippets.map(s => (
            <Box key={s.id} sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              border: '1px solid', borderColor: palette.border, borderRadius: '8px',
              bgcolor: palette.bgInput, px: 1, py: 0.5,
            }}>
              <CodeIcon sx={{ fontSize: 14, color: palette.primary }} />
              <Box>
                <Typography sx={{ fontSize: 11, color: palette.textPrimary, fontWeight: 500 }}>
                  Snippet · {s.language}
                </Typography>
                <Typography sx={{ fontSize: 10, color: palette.textMuted }}>{s.lines} lines</Typography>
              </Box>
              <IconButton size="small" onClick={() => removeSnippet(s.id)} sx={{ p: 0.25, color: palette.textMuted }}>
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {attachments.map((a, i) => (
              <Box key={i}
                onClick={() => a.preview && setImagePreview(a.preview)}
                sx={{
                  position: 'relative', borderRadius: '8px', overflow: 'hidden',
                  border: '1px solid', borderColor: palette.border, bgcolor: palette.bgInput,
                  display: 'flex', alignItems: 'center', gap: 1,
                  ...(a.preview ? { width: 80, height: 80, cursor: 'pointer' } : { px: 1.5, py: 0.75 }),
                }}
              >
                {a.preview ? (
                  <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <InsertDriveFileIcon sx={{ fontSize: 16, color: palette.textMuted }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11, color: palette.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{a.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: palette.textMuted }}>{formatFileSize(a.size)}</Typography>
                    </Box>
                  </>
                )}
                <IconButton size="small"
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
            {formatFileSize(total)} / 10 MB used
          </Typography>
        </Box>
      )}

      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 1,
        bgcolor: palette.bgInput, borderRadius: '14px',
        border: '1px solid', borderColor: palette.border, px: 1.5, py: 1,
        '&:focus-within': { borderColor: palette.primary, boxShadow: `0 0 0 2px ${palette.primarySoft}` },
      }}>
        <Tooltip title="Attach file (10 MB total max)">
          <IconButton size="small" onClick={open} sx={{ color: palette.textMuted, '&:hover': { color: palette.primary } }}>
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <textarea
          ref={taRef} value={text}
          onChange={handleInput} onKeyDown={handleKeyDown} onPaste={handlePaste}
          placeholder="Ask anything — paste logs, attach files, drop screenshots…"
          disabled={disabled} rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: palette.textPrimary,
            fontSize: '0.9rem', fontFamily: '"Inter", -apple-system, sans-serif',
            lineHeight: 1.5, maxHeight: 240, overflowY: 'auto',
          }}
        />
        <Tooltip title="Send (Enter)">
          <span>
            <IconButton onClick={handleSend}
              disabled={disabled || (!text.trim() && attachments.length === 0 && snippets.length === 0)}
              sx={{
                bgcolor: palette.primary, color: palette.textOnPrimary, width: 34, height: 34,
                borderRadius: '10px',
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
        <DialogContent sx={{ p: 1, bgcolor: palette.bgChat }}>
          {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
        </DialogContent>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.sev} onClose={() => setToast(null)} sx={{ fontSize: 12 }}>{toast.msg}</Alert> : <span />}
      </Snackbar>
    </Box>
  );
};

export default ChatInput;
