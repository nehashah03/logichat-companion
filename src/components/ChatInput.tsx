// // // // import React, { useState, useRef, useCallback } from 'react';
// // // // import { Box, IconButton, Tooltip, Typography, Dialog, DialogContent, Snackbar, Alert } from '@mui/material';
// // // // import SendIcon from '@mui/icons-material/Send';
// // // // import AttachFileIcon from '@mui/icons-material/AttachFile';
// // // // import CloseIcon from '@mui/icons-material/Close';
// // // // import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
// // // // import CodeIcon from '@mui/icons-material/Code';
// // // // import { useDropzone } from 'react-dropzone';
// // // // import { formatFileSize, generateId } from '../utils/helpers';
// // // // import { useThemeMode } from '../contexts/ThemeModeContext';
// // // // import type { FileAttachment, PasteSnippet } from '../features/chat/chatSlice';

// // // // interface Props {
// // // //   onSend: (content: string, attachments: FileAttachment[], snippets?: PasteSnippet[]) => void;
// // // //   disabled: boolean;
// // // // }

// // // // const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB combined
// // // // const ACCEPTED: Record<string, string[]> = {
// // // //   'application/pdf': ['.pdf'],
// // // //   'application/json': ['.json'],
// // // //   'text/plain': ['.txt', '.log', '.md'],
// // // //   'text/csv': ['.csv'],
// // // //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
// // // //   'image/*': [],
// // // // };
// // // // const PASTE_SNIPPET_THRESHOLD = 500;

// // // // function detectLang(text: string): string {
// // // //   if (/^\s*[{[]/.test(text) && /[}\]]\s*$/.test(text)) return 'json';
// // // //   if (/^(import |from |def |class |print\()/m.test(text)) return 'python';
// // // //   if (/^(const |let |var |function |import .+ from)/m.test(text)) return 'javascript';
// // // //   if (/^\s*(SELECT|INSERT|UPDATE|DELETE)\b/im.test(text)) return 'sql';
// // // //   if (/^[A-Z][a-z]{2} \d+ \d{2}:\d{2}:\d{2}/m.test(text) || /\bERROR\b|\bWARN\b/m.test(text)) return 'log';
// // // //   return 'text';
// // // // }

// // // // const ChatInput: React.FC<Props> = ({ onSend, disabled }) => {
// // // //   const { palette } = useThemeMode();
// // // //   const [text, setText] = useState('');
// // // //   const [attachments, setAttachments] = useState<(FileAttachment & { _size: number })[]>([]);
// // // //   const [snippets, setSnippets] = useState<PasteSnippet[]>([]);
// // // //   const [imagePreview, setImagePreview] = useState<string | null>(null);
// // // //   const [toast, setToast] = useState<{ msg: string; sev: 'error' | 'warning' | 'success' } | null>(null);
// // // //   const taRef = useRef<HTMLTextAreaElement>(null);

// // // //   const total = attachments.reduce((s, a) => s + a._size, 0);

// // // //   const onDrop = useCallback((files: File[]) => {
// // // //     const accepted: (FileAttachment & { _size: number })[] = [];
// // // //     let running = total;
// // // //     let rejected = 0, oversize = 0;
// // // //     for (const f of files) {
// // // //       if (f.size > MAX_TOTAL_SIZE) { oversize++; continue; }
// // // //       if (running + f.size > MAX_TOTAL_SIZE) { rejected++; continue; }
// // // //       running += f.size;
// // // //       accepted.push({
// // // //         name: f.name, size: f.size, type: f.type, _size: f.size,
// // // //         preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
// // // //       });
// // // //     }
// // // //     if (accepted.length) setAttachments(p => [...p, ...accepted]);
// // // //     if (oversize) setToast({ msg: `${oversize} file(s) exceed the 10 MB limit.`, sev: 'error' });
// // // //     else if (rejected) setToast({ msg: `Combined upload limit is 10 MB. Skipped ${rejected} file(s).`, sev: 'error' });
// // // //   }, [total]);

// // // //   const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
// // // //     onDrop, accept: ACCEPTED, noClick: true, noKeyboard: true,
// // // //     onDropRejected(files) {
// // // //       const types = Array.from(new Set(files.map(f => f.file.type || 'unknown')));
// // // //       setToast({ msg: `Unsupported file type${types.length > 1 ? 's' : ''}: ${types.join(', ')}`, sev: 'warning' });
// // // //     },
// // // //   });

// // // //   const handleKeyDown = (e: React.KeyboardEvent) => {
// // // //     if (e.key === 'Enter' && !e.shiftKey) {
// // // //       e.preventDefault();
// // // //       handleSend();
// // // //     }
// // // //   };

// // // //   const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
// // // //     const pasted = e.clipboardData.getData('text');
// // // //     if (pasted.length >= PASTE_SNIPPET_THRESHOLD) {
// // // //       e.preventDefault();
// // // //       const lang = detectLang(pasted);
// // // //       setSnippets(prev => [
// // // //         ...prev,
// // // //         { id: generateId(), language: lang, content: pasted, lines: pasted.split('\n').length },
// // // //       ]);
// // // //       setToast({ msg: `Long paste converted to a snippet (${pasted.split('\n').length} lines)`, sev: 'success' });
// // // //     }
// // // //   };

// // // //   const handleSend = () => {
// // // //     if (!text.trim() && attachments.length === 0 && snippets.length === 0) return;
// // // //     onSend(
// // // //       text.trim(),
// // // //       attachments.map(({ _size, ...rest }) => rest),
// // // //       snippets,
// // // //     );
// // // //     setText('');
// // // //     setAttachments([]);
// // // //     setSnippets([]);
// // // //     if (taRef.current) taRef.current.style.height = 'auto';
// // // //   };

// // // //   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
// // // //     setText(e.target.value);
// // // //     const el = e.target;
// // // //     el.style.height = 'auto';
// // // //     el.style.height = Math.min(el.scrollHeight, 240) + 'px';
// // // //   };

// // // //   const removeAttachment = (i: number) => {
// // // //     setAttachments(prev => {
// // // //       const t = prev[i];
// // // //       if (t?.preview) URL.revokeObjectURL(t.preview);
// // // //       return prev.filter((_, j) => j !== i);
// // // //     });
// // // //   };
// // // //   const removeSnippet = (id: string) => setSnippets(s => s.filter(x => x.id !== id));

// // // //   return (
// // // //     <Box {...getRootProps()} sx={{
// // // //       px: 3, py: 2, borderTop: '1px solid', borderColor: palette.border,
// // // //       bgcolor: isDragActive ? palette.primarySoft : palette.bgChat,
// // // //       transition: 'background-color .2s',
// // // //     }}>
// // // //       <input {...getInputProps()} />

// // // //       {isDragActive && (
// // // //         <Box sx={{ p: 2, mb: 1.5, border: '2px dashed', borderColor: palette.primary, borderRadius: '8px', textAlign: 'center', bgcolor: palette.primarySoft }}>
// // // //           <Typography sx={{ color: palette.primary, fontSize: 13 }}>Drop files here…</Typography>
// // // //         </Box>
// // // //       )}

// // // //       {/* Snippet chips */}
// // // //       {snippets.length > 0 && (
// // // //         <Box sx={{ display: 'flex', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
// // // //           {snippets.map(s => (
// // // //             <Box key={s.id} sx={{
// // // //               display: 'flex', alignItems: 'center', gap: 0.75,
// // // //               border: '1px solid', borderColor: palette.border, borderRadius: '8px',
// // // //               bgcolor: palette.bgInput, px: 1, py: 0.5,
// // // //             }}>
// // // //               <CodeIcon sx={{ fontSize: 14, color: palette.primary }} />
// // // //               <Box>
// // // //                 <Typography sx={{ fontSize: 11, color: palette.textPrimary, fontWeight: 500 }}>
// // // //                   Snippet · {s.language}
// // // //                 </Typography>
// // // //                 <Typography sx={{ fontSize: 10, color: palette.textMuted }}>{s.lines} lines</Typography>
// // // //               </Box>
// // // //               <IconButton size="small" onClick={() => removeSnippet(s.id)} sx={{ p: 0.25, color: palette.textMuted }}>
// // // //                 <CloseIcon sx={{ fontSize: 12 }} />
// // // //               </IconButton>
// // // //             </Box>
// // // //           ))}
// // // //         </Box>
// // // //       )}

// // // //       {/* Attachments */}
// // // //       {attachments.length > 0 && (
// // // //         <Box sx={{ mb: 1.25 }}>
// // // //           <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
// // // //             {attachments.map((a, i) => (
// // // //               <Box key={i}
// // // //                 onClick={() => a.preview && setImagePreview(a.preview)}
// // // //                 sx={{
// // // //                   position: 'relative', borderRadius: '8px', overflow: 'hidden',
// // // //                   border: '1px solid', borderColor: palette.border, bgcolor: palette.bgInput,
// // // //                   display: 'flex', alignItems: 'center', gap: 1,
// // // //                   ...(a.preview ? { width: 80, height: 80, cursor: 'pointer' } : { px: 1.5, py: 0.75 }),
// // // //                 }}
// // // //               >
// // // //                 {a.preview ? (
// // // //                   <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
// // // //                 ) : (
// // // //                   <>
// // // //                     <InsertDriveFileIcon sx={{ fontSize: 16, color: palette.textMuted }} />
// // // //                     <Box sx={{ minWidth: 0 }}>
// // // //                       <Typography sx={{ fontSize: 11, color: palette.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{a.name}</Typography>
// // // //                       <Typography sx={{ fontSize: 10, color: palette.textMuted }}>{formatFileSize(a.size)}</Typography>
// // // //                     </Box>
// // // //                   </>
// // // //                 )}
// // // //                 <IconButton size="small"
// // // //                   onClick={(e) => { e.stopPropagation(); removeAttachment(i); }}
// // // //                   sx={{
// // // //                     position: 'absolute', top: 2, right: 2, width: 18, height: 18,
// // // //                     bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
// // // //                     '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
// // // //                   }}
// // // //                 >
// // // //                   <CloseIcon sx={{ fontSize: 12 }} />
// // // //                 </IconButton>
// // // //               </Box>
// // // //             ))}
// // // //           </Box>
// // // //           <Typography sx={{ fontSize: 10.5, color: palette.textMuted, mt: 0.5 }}>
// // // //             {formatFileSize(total)} / 10 MB used
// // // //           </Typography>
// // // //         </Box>
// // // //       )}

// // // //       <Box sx={{
// // // //         display: 'flex', alignItems: 'flex-end', gap: 1,
// // // //         bgcolor: palette.bgInput, borderRadius: '14px',
// // // //         border: '1px solid', borderColor: palette.border, px: 1.5, py: 1,
// // // //         '&:focus-within': { borderColor: palette.primary, boxShadow: `0 0 0 2px ${palette.primarySoft}` },
// // // //       }}>
// // // //         <Tooltip title="Attach file (10 MB total max)">
// // // //           <IconButton size="small" onClick={open} sx={{ color: palette.textMuted, '&:hover': { color: palette.primary } }}>
// // // //             <AttachFileIcon sx={{ fontSize: 18 }} />
// // // //           </IconButton>
// // // //         </Tooltip>

// // // //         <textarea
// // // //           ref={taRef} value={text}
// // // //           onChange={handleInput} onKeyDown={handleKeyDown} onPaste={handlePaste}
// // // //           placeholder="Ask anything — paste logs, attach files, drop screenshots…"
// // // //           disabled={disabled} rows={1}
// // // //           style={{
// // // //             flex: 1, resize: 'none', border: 'none', outline: 'none',
// // // //             background: 'transparent', color: palette.textPrimary,
// // // //             fontSize: '0.9rem', fontFamily: '"Inter", -apple-system, sans-serif',
// // // //             lineHeight: 1.5, maxHeight: 240, overflowY: 'auto',
// // // //           }}
// // // //         />
// // // //         <Tooltip title="Send (Enter)">
// // // //           <span>
// // // //             <IconButton onClick={handleSend}
// // // //               disabled={disabled || (!text.trim() && attachments.length === 0 && snippets.length === 0)}
// // // //               sx={{
// // // //                 bgcolor: palette.primary, color: palette.textOnPrimary, width: 34, height: 34,
// // // //                 borderRadius: '10px',
// // // //                 '&:hover': { bgcolor: palette.primaryHover },
// // // //                 '&.Mui-disabled': { bgcolor: palette.border, color: palette.textMuted },
// // // //               }}
// // // //             >
// // // //               <SendIcon sx={{ fontSize: 16 }} />
// // // //             </IconButton>
// // // //           </span>
// // // //         </Tooltip>
// // // //       </Box>

// // // //       <Dialog open={!!imagePreview} onClose={() => setImagePreview(null)} maxWidth="md">
// // // //         <DialogContent sx={{ p: 1, bgcolor: palette.bgChat }}>
// // // //           {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />}
// // // //         </DialogContent>
// // // //       </Dialog>

// // // //       <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
// // // //         {toast ? <Alert severity={toast.sev} onClose={() => setToast(null)} sx={{ fontSize: 12 }}>{toast.msg}</Alert> : <span />}
// // // //       </Snackbar>
// // // //     </Box>
// // // //   );
// // // // };

// // // // export default ChatInput;

// // // import React, { useState, useRef, useCallback } from "react";
// // // import {
// // //   Box,
// // //   IconButton,
// // //   Tooltip,
// // //   Typography,
// // //   Dialog,
// // //   DialogTitle,
// // //   DialogContent,
// // //   Snackbar,
// // //   Alert,
// // // } from "@mui/material";
// // // import { alpha } from "@mui/material/styles";

// // // import SendIcon from "@mui/icons-material/Send";
// // // import AttachFileIcon from "@mui/icons-material/AttachFile";
// // // import CloseIcon from "@mui/icons-material/Close";
// // // import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
// // // import CodeIcon from "@mui/icons-material/Code";

// // // import { useDropzone } from "react-dropzone";

// // // import { formatFileSize, generateId } from "../utils/helpers";
// // // import { useThemeMode } from "../contexts/ThemeModeContext";

// // // import type { FileAttachment, PasteSnippet } from "../features/chat/chatSlice";

// // // /* ============================================================
// // //    TYPES
// // //    ============================================================ */

// // // interface Props {
// // //   // Main send handler from parent
// // //   onSend: (
// // //     content: string,
// // //     attachments: FileAttachment[],
// // //     snippets?: PasteSnippet[],
// // //   ) => void;

// // //   // Disable composer while request is running
// // //   disabled: boolean;

// // //   // Optional placeholder override
// // //   placeholder?: string;

// // //   // Footer = docked input bar
// // //   // Hero = centered empty-state composer
// // //   variant?: "footer" | "hero";
// // // }

// // // /* ============================================================
// // //    CONSTANTS
// // //    ============================================================ */

// // // // Maximum combined upload size
// // // const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

// // // // Accepted file types
// // // const ACCEPTED: Record<string, string[]> = {
// // //   "application/pdf": [".pdf"],
// // //   "application/json": [".json"],
// // //   "text/plain": [".txt", ".log", ".md"],
// // //   "text/csv": [".csv"],
// // //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
// // //   "image/*": [],
// // // };

// // // // If pasted text is long, convert it into a snippet chip
// // // const PASTE_SNIPPET_THRESHOLD = 500;

// // // // Minimum rows in footer mode
// // // const MIN_ROWS = 1;

// // // // Maximum textarea heights
// // // const TEXTAREA_MAX_HEIGHT_FOOTER = 160;
// // // const TEXTAREA_MAX_HEIGHT_HERO = 240;

// // // /* ============================================================
// // //    HELPERS
// // //    ============================================================ */

// // // // Tries to infer language from pasted text
// // // function detectLang(text: string): string {
// // //   if (/^\s*[{[]/.test(text) && /[}\]]\s*$/.test(text)) return "json";
// // //   if (/^(import |from |def |class |print\()/m.test(text)) return "python";
// // //   if (/^(const |let |var |function |import .+ from)/m.test(text)) return "javascript";
// // //   if (/^\s*(SELECT|INSERT|UPDATE|DELETE)\b/im.test(text)) return "sql";
// // //   if (/^[A-Z][a-z]{2} \d+ \d{2}:\d{2}:\d{2}/m.test(text) || /\bERROR\b|\bWARN\b/m.test(text)) {
// // //     return "log";
// // //   }
// // //   return "text";
// // // }

// // // /* ============================================================
// // //    COMPONENT
// // //    ============================================================ */

// // // const ChatInput: React.FC<Props> = ({
// // //   onSend,
// // //   disabled,
// // //   placeholder,
// // //   variant = "footer",
// // // }) => {
// // //   // Read theme palette + mode from custom theme context
// // //   const { palette, mode } = useThemeMode();

// // //   // Variant flag
// // //   const isHero = variant === "hero";

// // //   // Different placeholder text depending on placement
// // //   const resolvedPlaceholder =
// // //     placeholder ??
// // //     (isHero
// // //       ? "Ask anything — paste logs, attach files, drop screenshots…"
// // //       : "Ask anything — paste logs, attach files, drop screenshots…");

// // //   // Maximum input height based on variant
// // //   const maxTextHeight = isHero
// // //     ? TEXTAREA_MAX_HEIGHT_HERO
// // //     : TEXTAREA_MAX_HEIGHT_FOOTER;

// // //   // Main text value
// // //   const [text, setText] = useState("");

// // //   // Uploaded attachments
// // //   const [attachments, setAttachments] = useState<
// // //     (FileAttachment & { _size: number; objectUrl?: string })[]
// // //   >([]);

// // //   // Long pasted code/log snippets
// // //   const [snippets, setSnippets] = useState<PasteSnippet[]>([]);

// // //   // File preview dialog state
// // //   const [filePreview, setFilePreview] = useState<{
// // //     url: string;
// // //     type: string;
// // //     name: string;
// // //   } | null>(null);

// // //   // Toast/snackbar state
// // //   const [toast, setToast] = useState<{
// // //     msg: string;
// // //     sev: "error" | "warning" | "success";
// // //   } | null>(null);

// // //   // Ref to textarea for auto-resizing
// // //   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

// // //   // Current total uploaded size
// // //   const totalSize = attachments.reduce((sum, item) => sum + item._size, 0);

// // //   /* ============================================================
// // //      FILE DROP
// // //      ============================================================ */

// // //   const onDrop = useCallback(
// // //     (files: File[]) => {
// // //       const acceptedFiles: (FileAttachment & { _size: number; objectUrl?: string })[] = [];

// // //       let runningTotal = totalSize;
// // //       let skippedCombined = 0;
// // //       let skippedOversize = 0;

// // //       for (const file of files) {
// // //         // Single file too large
// // //         if (file.size > MAX_TOTAL_SIZE) {
// // //           skippedOversize++;
// // //           continue;
// // //         }

// // //         // Combined total limit exceeded
// // //         if (runningTotal + file.size > MAX_TOTAL_SIZE) {
// // //           skippedCombined++;
// // //           continue;
// // //         }

// // //         runningTotal += file.size;

// // //         const objectUrl = URL.createObjectURL(file);

// // //         acceptedFiles.push({
// // //           name: file.name,
// // //           size: file.size,
// // //           type: file.type,
// // //           _size: file.size,
// // //           objectUrl,
// // //           preview: file.type.startsWith("image/") ? objectUrl : undefined,
// // //         });
// // //       }

// // //       // Append accepted files
// // //       if (acceptedFiles.length) {
// // //         setAttachments((prev) => [...prev, ...acceptedFiles]);
// // //       }

// // //       // Show feedback
// // //       if (skippedOversize) {
// // //         setToast({
// // //           msg: `${skippedOversize} file(s) exceed the 10 MB limit.`,
// // //           sev: "error",
// // //         });
// // //       } else if (skippedCombined) {
// // //         setToast({
// // //           msg: `Combined upload limit is 10 MB. Skipped ${skippedCombined} file(s).`,
// // //           sev: "error",
// // //         });
// // //       }
// // //     },
// // //     [totalSize],
// // //   );

// // //   // Dropzone setup
// // //   const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
// // //     onDrop,
// // //     accept: ACCEPTED,
// // //     noClick: true,
// // //     noKeyboard: true,
// // //     onDropRejected(files) {
// // //       const types = Array.from(new Set(files.map((f) => f.file.type || "unknown")));
// // //       setToast({
// // //         msg: `Unsupported file type${types.length > 1 ? "s" : ""}: ${types.join(", ")}`,
// // //         sev: "warning",
// // //       });
// // //     },
// // //   });

// // //   /* ============================================================
// // //      INPUT HANDLERS
// // //      ============================================================ */

// // //   // Auto-resize textarea while typing
// // //   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
// // //     setText(e.target.value);

// // //     const el = e.target;
// // //     el.style.height = "auto";
// // //     el.style.height = `${Math.min(el.scrollHeight, maxTextHeight)}px`;
// // //   };

// // //   // Enter sends, Shift+Enter adds newline
// // //   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
// // //     if (e.key === "Enter" && !e.shiftKey) {
// // //       e.preventDefault();
// // //       handleSend();
// // //     }
// // //   };

// // //   // Convert long pasted text into snippet chip
// // //   const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
// // //     const pasted = e.clipboardData.getData("text");

// // //     if (pasted.length >= PASTE_SNIPPET_THRESHOLD) {
// // //       e.preventDefault();

// // //       const language = detectLang(pasted);

// // //       setSnippets((prev) => [
// // //         ...prev,
// // //         {
// // //           id: generateId(),
// // //           language,
// // //           content: pasted,
// // //           lines: pasted.split("\n").length,
// // //         },
// // //       ]);

// // //       setToast({
// // //         msg: `Long paste converted to a snippet (${pasted.split("\n").length} lines)`,
// // //         sev: "success",
// // //       });
// // //     }
// // //   };

// // //   // Send message
// // //   const handleSend = () => {
// // //     // Prevent empty sends
// // //     if (!text.trim() && attachments.length === 0 && snippets.length === 0) {
// // //       return;
// // //     }

// // //     // Send clean payload to parent
// // //     onSend(
// // //       text.trim(),
// // //       attachments.map(({ _size, objectUrl, ...rest }) => rest),
// // //       snippets,
// // //     );

// // //     // Reset local state
// // //     setText("");
// // //     setSnippets([]);

// // //     // Revoke file URLs before clearing
// // //     attachments.forEach((item) => {
// // //       if (item.objectUrl) {
// // //         URL.revokeObjectURL(item.objectUrl);
// // //       }
// // //     });

// // //     setAttachments([]);

// // //     // Reset textarea height
// // //     if (textareaRef.current) {
// // //       textareaRef.current.style.height = "auto";
// // //     }
// // //   };

// // //   /* ============================================================
// // //      REMOVE HANDLERS
// // //      ============================================================ */

// // //   // Remove one attachment
// // //   const removeAttachment = (index: number) => {
// // //     setAttachments((prev) => {
// // //       const removed = prev[index];

// // //       if (removed?.objectUrl) {
// // //         URL.revokeObjectURL(removed.objectUrl);
// // //       }

// // //       return prev.filter((_, i) => i !== index);
// // //     });
// // //   };

// // //   // Remove one snippet
// // //   const removeSnippet = (id: string) => {
// // //     setSnippets((prev) => prev.filter((item) => item.id !== id));
// // //   };

// // //   /* ============================================================
// // //      VISUAL STYLING HELPERS
// // //      ============================================================ */

// // //   // Background for the input shell
// // //   const inputShellBg = isHero
// // //     ? mode === "dark"
// // //       ? alpha("#fff", 0.04)
// // //       : "#ffffff"
// // //     : palette.bgInput;

// // //   // Focus style
// // //   const focusRing =
// // //     mode === "dark" && isHero
// // //       ? `0 0 0 1px ${alpha(palette.primary, 0.45)}, 0 0 0 2px ${alpha(
// // //           palette.primary,
// // //           0.18,
// // //         )}, 0 1px 10px ${alpha("#000", 0.25)}`
// // //       : `0 0 0 2px ${palette.primarySoft}`;

// // //   /* ============================================================
// // //      RENDER
// // //      ============================================================ */

// // //   return (
// // //     <Box
// // //       {...getRootProps()}
// // //       sx={{
// // //         px: isHero ? 0 : 3,
// // //         py: isHero ? 0 : 2,
// // //         borderTop: isHero ? "none" : "1px solid",
// // //         borderColor: palette.border,
// // //         bgcolor: isDragActive ? palette.primarySoft : isHero ? "transparent" : palette.bgChat,
// // //         transition: "background-color 0.2s",
// // //       }}
// // //     >
// // //       {/* Hidden input managed by react-dropzone */}
// // //       <input {...getInputProps()} />

// // //       {/* Drag overlay */}
// // //       {isDragActive && (
// // //         <Box
// // //           sx={{
// // //             p: 2,
// // //             mb: 1.5,
// // //             border: "2px dashed",
// // //             borderColor: palette.primary,
// // //             borderRadius: "8px",
// // //             textAlign: "center",
// // //             bgcolor: palette.primarySoft,
// // //           }}
// // //         >
// // //           <Typography sx={{ color: palette.primary, fontSize: 13 }}>
// // //             Drop files here…
// // //           </Typography>
// // //         </Box>
// // //       )}

// // //       {/* ========================================================
// // //           SNIPPET CHIPS
// // //          ======================================================== */}
// // //       {snippets.length > 0 && (
// // //         <Box
// // //           sx={{
// // //             display: "flex",
// // //             gap: 0.75,
// // //             mb: 1,
// // //             flexWrap: "wrap",
// // //             justifyContent: isHero ? "center" : "flex-start",
// // //           }}
// // //         >
// // //           {snippets.map((snippet) => (
// // //             <Box
// // //               key={snippet.id}
// // //               sx={{
// // //                 display: "flex",
// // //                 alignItems: "center",
// // //                 gap: 0.75,
// // //                 border: "1px solid",
// // //                 borderColor: palette.border,
// // //                 borderRadius: "8px",
// // //                 bgcolor: palette.bgInput,
// // //                 px: 1,
// // //                 py: 0.5,
// // //               }}
// // //             >
// // //               <CodeIcon sx={{ fontSize: 14, color: palette.primary }} />

// // //               <Box>
// // //                 <Typography
// // //                   sx={{
// // //                     fontSize: 11,
// // //                     color: palette.textPrimary,
// // //                     fontWeight: 500,
// // //                   }}
// // //                 >
// // //                   Snippet · {snippet.language}
// // //                 </Typography>

// // //                 <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
// // //                   {snippet.lines} lines
// // //                 </Typography>
// // //               </Box>

// // //               <IconButton
// // //                 size="small"
// // //                 onClick={() => removeSnippet(snippet.id)}
// // //                 sx={{ p: 0.25, color: palette.textMuted }}
// // //               >
// // //                 <CloseIcon sx={{ fontSize: 12 }} />
// // //               </IconButton>
// // //             </Box>
// // //           ))}
// // //         </Box>
// // //       )}

// // //       {/* ========================================================
// // //           ATTACHMENTS
// // //          ======================================================== */}
// // //       {attachments.length > 0 && (
// // //         <Box sx={{ mb: 1.25 }}>
// // //           <Box
// // //             sx={{
// // //               display: "flex",
// // //               gap: 1,
// // //               flexWrap: "wrap",
// // //               justifyContent: isHero ? "center" : "flex-start",
// // //             }}
// // //           >
// // //             {attachments.map((file, index) => (
// // //               <Box
// // //                 key={`${file.name}-${index}`}
// // //                 onClick={() => {
// // //                   if (file.preview || file.objectUrl) {
// // //                     setFilePreview({
// // //                       url: file.objectUrl || file.preview || "",
// // //                       type: file.type || "",
// // //                       name: file.name,
// // //                     });
// // //                   }
// // //                 }}
// // //                 sx={{
// // //                   position: "relative",
// // //                   borderRadius: "8px",
// // //                   overflow: "hidden",
// // //                   border: "1px solid",
// // //                   borderColor: palette.border,
// // //                   bgcolor: palette.bgInput,
// // //                   display: "flex",
// // //                   alignItems: "center",
// // //                   gap: 1,
// // //                   ...(file.preview
// // //                     ? {
// // //                         width: 80,
// // //                         height: 80,
// // //                         cursor: "pointer",
// // //                       }
// // //                     : {
// // //                         px: 1.5,
// // //                         py: 0.75,
// // //                         cursor: file.objectUrl ? "pointer" : "default",
// // //                       }),
// // //                 }}
// // //               >
// // //                 {file.preview ? (
// // //                   <img
// // //                     src={file.preview}
// // //                     alt={file.name}
// // //                     style={{
// // //                       width: "100%",
// // //                       height: "100%",
// // //                       objectFit: "cover",
// // //                     }}
// // //                   />
// // //                 ) : (
// // //                   <>
// // //                     <InsertDriveFileIcon
// // //                       sx={{
// // //                         fontSize: 16,
// // //                         color: palette.textMuted,
// // //                       }}
// // //                     />

// // //                     <Box sx={{ minWidth: 0 }}>
// // //                       <Typography
// // //                         sx={{
// // //                           fontSize: 11,
// // //                           color: palette.textPrimary,
// // //                           whiteSpace: "nowrap",
// // //                           overflow: "hidden",
// // //                           textOverflow: "ellipsis",
// // //                           maxWidth: 140,
// // //                         }}
// // //                       >
// // //                         {file.name}
// // //                       </Typography>

// // //                       <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
// // //                         {formatFileSize(file.size)}
// // //                       </Typography>
// // //                     </Box>
// // //                   </>
// // //                 )}

// // //                 <IconButton
// // //                   size="small"
// // //                   onClick={(e) => {
// // //                     e.stopPropagation();
// // //                     removeAttachment(index);
// // //                   }}
// // //                   sx={{
// // //                     position: "absolute",
// // //                     top: 2,
// // //                     right: 2,
// // //                     width: 18,
// // //                     height: 18,
// // //                     bgcolor: "rgba(0,0,0,0.55)",
// // //                     color: "#fff",
// // //                     "&:hover": {
// // //                       bgcolor: "rgba(0,0,0,0.75)",
// // //                     },
// // //                   }}
// // //                 >
// // //                   <CloseIcon sx={{ fontSize: 12 }} />
// // //                 </IconButton>
// // //               </Box>
// // //             ))}
// // //           </Box>

// // //           {/* Total upload usage */}
// // //           <Typography
// // //             sx={{
// // //               fontSize: 10.5,
// // //               color: palette.textMuted,
// // //               mt: 0.5,
// // //               textAlign: isHero ? "center" : "left",
// // //             }}
// // //           >
// // //             {formatFileSize(totalSize)} / 10 MB used
// // //           </Typography>
// // //         </Box>
// // //       )}

// // //       {/* ========================================================
// // //           MAIN INPUT SHELL
// // //          ======================================================== */}
// // //       <Box
// // //         sx={{
// // //           display: "flex",
// // //           alignItems: "flex-end",
// // //           gap: 1,
// // //           bgcolor: inputShellBg,
// // //           borderRadius: isHero ? "16px" : "14px",
// // //           border: "1px solid",
// // //           borderColor: palette.border,
// // //           px: isHero ? 2 : 1.5,
// // //           py: isHero ? 1.5 : 1,
// // //           minHeight: isHero ? 120 : undefined,
// // //           transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
// // //           ...(isHero && mode === "dark"
// // //             ? {
// // //                 boxShadow: `0 0 0 1px ${alpha(
// // //                   palette.border,
// // //                   0.9,
// // //                 )}, 0 1px 8px ${alpha("#000", 0.28)}, inset 0 1px 0 ${alpha(
// // //                   palette.primary,
// // //                   0.14,
// // //                 )}`,
// // //               }
// // //             : isHero && mode === "light"
// // //               ? {
// // //                   boxShadow: `0 1px 3px ${alpha("#000", 0.06)}, inset 0 1px 0 ${alpha(
// // //                     palette.primary,
// // //                     0.12,
// // //                   )}`,
// // //                 }
// // //               : {}),
// // //           "&:focus-within": {
// // //             borderColor: palette.primary,
// // //             boxShadow: focusRing,
// // //           },
// // //         }}
// // //       >
// // //         {/* Attach button */}
// // //         <Tooltip title="Attach file (10 MB total max)">
// // //           <IconButton
// // //             size="small"
// // //             onClick={open}
// // //             sx={{
// // //               color: palette.textMuted,
// // //               "&:hover": {
// // //                 color: palette.primary,
// // //               },
// // //             }}
// // //           >
// // //             <AttachFileIcon sx={{ fontSize: 18 }} />
// // //           </IconButton>
// // //         </Tooltip>

// // //         {/* Textarea */}
// // //         <textarea
// // //           ref={textareaRef}
// // //           value={text}
// // //           onChange={handleInput}
// // //           onKeyDown={handleKeyDown}
// // //           onPaste={handlePaste}
// // //           placeholder={resolvedPlaceholder}
// // //           disabled={disabled}
// // //           rows={isHero ? 4 : MIN_ROWS}
// // //           style={{
// // //             flex: 1,
// // //             resize: "none",
// // //             border: "none",
// // //             outline: "none",
// // //             background: "transparent",
// // //             color: palette.textPrimary,
// // //             fontSize: isHero ? "0.9375rem" : "0.9rem",
// // //             fontFamily: '"Inter", -apple-system, sans-serif',
// // //             lineHeight: 1.55,
// // //             maxHeight: maxTextHeight,
// // //             minHeight: isHero ? 88 : undefined,
// // //             overflowY: "auto",
// // //           }}
// // //         />

// // //         {/* Send button */}
// // //         <Tooltip title="Send (Enter)">
// // //           <span>
// // //             <IconButton
// // //               onClick={handleSend}
// // //               disabled={
// // //                 disabled ||
// // //                 (!text.trim() && attachments.length === 0 && snippets.length === 0)
// // //               }
// // //               sx={{
// // //                 bgcolor: palette.primary,
// // //                 color: palette.textOnPrimary,
// // //                 width: isHero ? 40 : 34,
// // //                 height: isHero ? 40 : 34,
// // //                 borderRadius: "10px",
// // //                 "&:hover": {
// // //                   bgcolor: palette.primaryHover,
// // //                 },
// // //                 "&.Mui-disabled": {
// // //                   bgcolor: palette.border,
// // //                   color: palette.textMuted,
// // //                 },
// // //               }}
// // //             >
// // //               <SendIcon sx={{ fontSize: isHero ? 18 : 16 }} />
// // //             </IconButton>
// // //           </span>
// // //         </Tooltip>
// // //       </Box>

// // //       {/* Helper text in hero mode */}
// // //       {isHero && (
// // //         <Typography
// // //           sx={{
// // //             fontSize: 11,
// // //             color: palette.textMuted,
// // //             textAlign: "center",
// // //             mt: 1.5,
// // //           }}
// // //         >
// // //           Shift+Enter for a new line · Enter to send
// // //         </Typography>
// // //       )}

// // //       {/* ========================================================
// // //           FILE PREVIEW DIALOG
// // //          ======================================================== */}
// // //       <Dialog
// // //         open={Boolean(filePreview)}
// // //         onClose={() => setFilePreview(null)}
// // //         maxWidth="md"
// // //         fullWidth
// // //       >
// // //         {filePreview && (
// // //           <DialogTitle sx={{ fontSize: 15 }}>
// // //             {filePreview.name}
// // //           </DialogTitle>
// // //         )}

// // //         <DialogContent sx={{ p: 1, pt: 0, bgcolor: palette.bgChat }}>
// // //           {filePreview &&
// // //             (filePreview.type === "application/pdf" ? (
// // //               <Box
// // //                 component="iframe"
// // //                 title={filePreview.name}
// // //                 src={filePreview.url}
// // //                 sx={{
// // //                   width: "100%",
// // //                   height: { xs: "60vh", sm: "72vh" },
// // //                   border: "none",
// // //                   borderRadius: 1,
// // //                 }}
// // //               />
// // //             ) : (
// // //               <img
// // //                 src={filePreview.url}
// // //                 alt={filePreview.name}
// // //                 style={{
// // //                   maxWidth: "100%",
// // //                   maxHeight: "80vh",
// // //                   objectFit: "contain",
// // //                 }}
// // //               />
// // //             ))}
// // //         </DialogContent>
// // //       </Dialog>

// // //       {/* ========================================================
// // //           TOAST
// // //          ======================================================== */}
// // //       <Snackbar
// // //         open={!!toast}
// // //         autoHideDuration={4000}
// // //         onClose={() => setToast(null)}
// // //         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
// // //       >
// // //         {toast ? (
// // //           <Alert
// // //             severity={toast.sev}
// // //             onClose={() => setToast(null)}
// // //             sx={{ fontSize: 12 }}
// // //           >
// // //             {toast.msg}
// // //           </Alert>
// // //         ) : (
// // //           <span />
// // //         )}
// // //       </Snackbar>
// // //     </Box>
// // //   );
// // // };

// // // export default ChatInput;

// // import React, { useState, useRef, useCallback } from "react";
// // import {
// //   Box,
// //   IconButton,
// //   Tooltip,
// //   Typography,
// //   Dialog,
// //   DialogTitle,
// //   DialogContent,
// //   Snackbar,
// //   Alert,
// // } from "@mui/material";
// // import { alpha } from "@mui/material/styles";

// // import SendIcon from "@mui/icons-material/Send";
// // import AttachFileIcon from "@mui/icons-material/AttachFile";
// // import CloseIcon from "@mui/icons-material/Close";
// // import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

// // import { useDropzone } from "react-dropzone";

// // import { formatFileSize } from "../utils/helpers";
// // import { useThemeMode } from "../contexts/ThemeModeContext";

// // import type { FileAttachment } from "../features/chat/chatSlice";

// // /* ============================================================
// //    TYPES
// //    ============================================================ */

// // interface Props {
// //   // Parent send handler
// //   onSend: (content: string, attachments: FileAttachment[]) => void;

// //   // Disable input while response is in progress
// //   disabled: boolean;

// //   // Optional custom placeholder
// //   placeholder?: string;

// //   // footer = docked input
// //   // hero = centered empty-state input
// //   variant?: "footer" | "hero";
// // }

// // /* ============================================================
// //    CONSTANTS
// //    ============================================================ */

// // // Total upload limit
// // const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

// // // Allowed file types
// // const ACCEPTED: Record<string, string[]> = {
// //   "application/pdf": [".pdf"],
// //   "application/json": [".json"],
// //   "text/plain": [".txt", ".log", ".md"],
// //   "text/csv": [".csv"],
// //   "application/vnd.ms-excel": [".xls"],
// //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
// //   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
// //   "image/*": [],
// // };

// // // If pasted text is at least this long, convert it into a text file attachment
// // const PASTE_TO_FILE_THRESHOLD = 500;

// // // Textarea heights
// // const MIN_ROWS = 1;
// // const TEXTAREA_MAX_HEIGHT_FOOTER = 160;
// // const TEXTAREA_MAX_HEIGHT_HERO = 240;

// // /* ============================================================
// //    LOCAL ATTACHMENT TYPE
// //    ============================================================ */

// // // Local state keeps a little more info than FileAttachment
// // type LocalAttachment = FileAttachment & {
// //   _size: number;
// //   objectUrl?: string;
// //   rawText?: string; // used for pasted text preview in dialog
// // };

// // /* ============================================================
// //    COMPONENT
// //    ============================================================ */

// // const ChatInput: React.FC<Props> = ({
// //   onSend,
// //   disabled,
// //   placeholder,
// //   variant = "footer",
// // }) => {
// //   // Get palette + mode from theme context
// //   const { palette, mode } = useThemeMode();

// //   // Variant helpers
// //   const isHero = variant === "hero";
// //   const maxTextHeight = isHero
// //     ? TEXTAREA_MAX_HEIGHT_HERO
// //     : TEXTAREA_MAX_HEIGHT_FOOTER;

// //   // Placeholder based on variant
// //   const resolvedPlaceholder =
// //     placeholder ??
// //     (isHero
// //       ? "Ask anything — paste logs, attach files, drop screenshots…"
// //       : "Ask anything — paste logs, attach files, drop screenshots…");

// //   // Main typed text
// //   const [text, setText] = useState("");

// //   // Attachments
// //   const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

// //   // Preview dialog state
// //   const [filePreview, setFilePreview] = useState<{
// //     url?: string;
// //     type: string;
// //     name: string;
// //     rawText?: string;
// //   } | null>(null);

// //   // Toast messages
// //   const [toast, setToast] = useState<{
// //     msg: string;
// //     sev: "error" | "warning" | "success";
// //   } | null>(null);

// //   // Textarea ref for auto-resize reset
// //   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

// //   // Count pasted text files already created
// //   const pastedFileCountRef = useRef(0);

// //   // Total upload size
// //   const totalSize = attachments.reduce((sum, item) => sum + item._size, 0);

// //   /* ============================================================
// //      HELPERS
// //      ============================================================ */

// //   // Create pasted file name sequence:
// //   // pasted.txt, pasted2.txt, pasted3.txt...
// //   const getNextPastedFileName = () => {
// //     pastedFileCountRef.current += 1;
// //     return pastedFileCountRef.current === 1
// //       ? "pasted.txt"
// //       : `pasted${pastedFileCountRef.current}.txt`;
// //   };

// //   /* ============================================================
// //      FILE DROP
// //      ============================================================ */

// //   const onDrop = useCallback(
// //     (files: File[]) => {
// //       const acceptedFiles: LocalAttachment[] = [];

// //       let runningTotal = totalSize;
// //       let skippedCombined = 0;
// //       let skippedOversize = 0;

// //       for (const file of files) {
// //         // Single file too large
// //         if (file.size > MAX_TOTAL_SIZE) {
// //           skippedOversize++;
// //           continue;
// //         }

// //         // Combined total too large
// //         if (runningTotal + file.size > MAX_TOTAL_SIZE) {
// //           skippedCombined++;
// //           continue;
// //         }

// //         runningTotal += file.size;

// //         // Create object URL for preview
// //         const objectUrl = URL.createObjectURL(file);

// //         acceptedFiles.push({
// //           name: file.name,
// //           size: file.size,
// //           type: file.type,
// //           _size: file.size,
// //           objectUrl,
// //           preview: file.type.startsWith("image/") ? objectUrl : undefined,
// //         });
// //       }

// //       // Add accepted files
// //       if (acceptedFiles.length) {
// //         setAttachments((prev) => [...prev, ...acceptedFiles]);
// //       }

// //       // Show feedback
// //       if (skippedOversize) {
// //         setToast({
// //           msg: `${skippedOversize} file(s) exceed the 10 MB limit.`,
// //           sev: "error",
// //         });
// //       } else if (skippedCombined) {
// //         setToast({
// //           msg: `Combined upload limit is 10 MB. Skipped ${skippedCombined} file(s).`,
// //           sev: "error",
// //         });
// //       }
// //     },
// //     [totalSize],
// //   );

// //   // Dropzone
// //   const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
// //     onDrop,
// //     accept: ACCEPTED,
// //     noClick: true,
// //     noKeyboard: true,
// //     onDropRejected(files) {
// //       const types = Array.from(new Set(files.map((f) => f.file.type || "unknown")));
// //       setToast({
// //         msg: `Unsupported file type${types.length > 1 ? "s" : ""}: ${types.join(", ")}`,
// //         sev: "warning",
// //       });
// //     },
// //   });

// //   /* ============================================================
// //      INPUT HANDLERS
// //      ============================================================ */

// //   // Auto-resize while typing
// //   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
// //     setText(e.target.value);

// //     const el = e.target;
// //     el.style.height = "auto";
// //     el.style.height = `${Math.min(el.scrollHeight, maxTextHeight)}px`;
// //   };

// //   // Enter sends, Shift+Enter adds new line
// //   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
// //     if (e.key === "Enter" && !e.shiftKey) {
// //       e.preventDefault();
// //       handleSend();
// //     }
// //   };

// //   // Convert long pasted text into a .txt attachment
// //   const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
// //     const pasted = e.clipboardData.getData("text");

// //     // Only convert long pasted text
// //     if (pasted.length < PASTE_TO_FILE_THRESHOLD) {
// //       return;
// //     }

// //     // Stop normal paste into textarea
// //     e.preventDefault();

// //     // Build file name
// //     const fileName = getNextPastedFileName();

// //     // Create blob as text file
// //     const blob = new Blob([pasted], { type: "text/plain" });

// //     // Size check before adding
// //     if (totalSize + blob.size > MAX_TOTAL_SIZE) {
// //       setToast({
// //         msg: `Combined upload limit is 10 MB. Could not add ${fileName}.`,
// //         sev: "error",
// //       });
// //       return;
// //     }

// //     // Create object URL for preview dialog
// //     const objectUrl = URL.createObjectURL(blob);

// //     // Add as normal attachment, but with rawText for preview dialog
// //     setAttachments((prev) => [
// //       ...prev,
// //       {
// //         name: fileName,
// //         size: blob.size,
// //         type: "text/plain",
// //         _size: blob.size,
// //         objectUrl,
// //         rawText: pasted,
// //       },
// //     ]);

// //     setToast({
// //       msg: `${fileName} added from pasted text.`,
// //       sev: "success",
// //     });
// //   };

// //   // Send everything
// //   const handleSend = () => {
// //     if (!text.trim() && attachments.length === 0) return;

// //     // Send only clean attachment shape to parent
// //     onSend(
// //       text.trim(),
// //       attachments.map(({ _size, objectUrl, rawText, ...rest }) => rest),
// //     );

// //     // Clean up object URLs
// //     attachments.forEach((item) => {
// //       if (item.objectUrl) {
// //         URL.revokeObjectURL(item.objectUrl);
// //       }
// //     });

// //     // Reset state
// //     setText("");
// //     setAttachments([]);

// //     // Reset textarea height
// //     if (textareaRef.current) {
// //       textareaRef.current.style.height = "auto";
// //     }
// //   };

// //   /* ============================================================
// //      REMOVE ATTACHMENT
// //      ============================================================ */

// //   const removeAttachment = (index: number) => {
// //     setAttachments((prev) => {
// //       const removed = prev[index];

// //       if (removed?.objectUrl) {
// //         URL.revokeObjectURL(removed.objectUrl);
// //       }

// //       return prev.filter((_, i) => i !== index);
// //     });
// //   };

// //   /* ============================================================
// //      STYLING HELPERS
// //      ============================================================ */

// //   const inputShellBg = isHero
// //     ? mode === "dark"
// //       ? alpha("#fff", 0.04)
// //       : "#ffffff"
// //     : palette.bgInput;

// //   const focusRing =
// //     mode === "dark" && isHero
// //       ? `0 0 0 1px ${alpha(palette.primary, 0.45)}, 0 0 0 2px ${alpha(
// //           palette.primary,
// //           0.18,
// //         )}, 0 1px 10px ${alpha("#000", 0.25)}`
// //       : `0 0 0 2px ${palette.primarySoft}`;

// //   /* ============================================================
// //      RENDER
// //      ============================================================ */

// //   return (
// //     <Box
// //       {...getRootProps()}
// //       sx={{
// //         px: isHero ? 0 : 3,
// //         py: isHero ? 0 : 2,
// //         borderTop: isHero ? "none" : "1px solid",
// //         borderColor: palette.border,
// //         bgcolor: isDragActive ? palette.primarySoft : isHero ? "transparent" : palette.bgChat,
// //         transition: "background-color 0.2s",
// //       }}
// //     >
// //       {/* Hidden file input from dropzone */}
// //       <input {...getInputProps()} />

// //       {/* Drag and drop helper */}
// //       {isDragActive && (
// //         <Box
// //           sx={{
// //             p: 2,
// //             mb: 1.5,
// //             border: "2px dashed",
// //             borderColor: palette.primary,
// //             borderRadius: "8px",
// //             textAlign: "center",
// //             bgcolor: palette.primarySoft,
// //           }}
// //         >
// //           <Typography sx={{ color: palette.primary, fontSize: 13 }}>
// //             Drop files here…
// //           </Typography>
// //         </Box>
// //       )}

// //       {/* Attachment chips / cards */}
// //       {attachments.length > 0 && (
// //         <Box sx={{ mb: 1.25 }}>
// //           <Box
// //             sx={{
// //               display: "flex",
// //               gap: 1,
// //               flexWrap: "wrap",
// //               justifyContent: isHero ? "center" : "flex-start",
// //             }}
// //           >
// //             {attachments.map((file, index) => (
// //               <Box
// //                 key={`${file.name}-${index}`}
// //                 onClick={() => {
// //                   // Image preview
// //                   if (file.preview) {
// //                     setFilePreview({
// //                       url: file.preview,
// //                       type: file.type || "",
// //                       name: file.name,
// //                     });
// //                     return;
// //                   }

// //                   // Pasted text preview in scrollable dialog
// //                   if (file.rawText) {
// //                     setFilePreview({
// //                       type: "text/plain",
// //                       name: file.name,
// //                       rawText: file.rawText,
// //                     });
// //                     return;
// //                   }

// //                   // PDF / other file with object url
// //                   if (file.objectUrl) {
// //                     setFilePreview({
// //                       url: file.objectUrl,
// //                       type: file.type || "",
// //                       name: file.name,
// //                     });
// //                   }
// //                 }}
// //                 sx={{
// //                   position: "relative",
// //                   borderRadius: "8px",
// //                   overflow: "hidden",
// //                   border: "1px solid",
// //                   borderColor: palette.border,
// //                   bgcolor: palette.bgInput,
// //                   display: "flex",
// //                   alignItems: "center",
// //                   gap: 1,
// //                   cursor: "pointer",
// //                   ...(file.preview
// //                     ? {
// //                         width: 80,
// //                         height: 80,
// //                       }
// //                     : {
// //                         px: 1.5,
// //                         py: 0.75,
// //                       }),
// //                 }}
// //               >
// //                 {file.preview ? (
// //                   <img
// //                     src={file.preview}
// //                     alt={file.name}
// //                     style={{
// //                       width: "100%",
// //                       height: "100%",
// //                       objectFit: "cover",
// //                     }}
// //                   />
// //                 ) : (
// //                   <>
// //                     <InsertDriveFileIcon
// //                       sx={{
// //                         fontSize: 16,
// //                         color: palette.textMuted,
// //                       }}
// //                     />

// //                     <Box sx={{ minWidth: 0 }}>
// //                       <Typography
// //                         sx={{
// //                           fontSize: 11,
// //                           color: palette.textPrimary,
// //                           whiteSpace: "nowrap",
// //                           overflow: "hidden",
// //                           textOverflow: "ellipsis",
// //                           maxWidth: 140,
// //                         }}
// //                       >
// //                         {file.name}
// //                       </Typography>

// //                       <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
// //                         {formatFileSize(file.size)}
// //                       </Typography>
// //                     </Box>
// //                   </>
// //                 )}

// //                 {/* Remove attachment */}
// //                 <IconButton
// //                   size="small"
// //                   onClick={(e) => {
// //                     e.stopPropagation();
// //                     removeAttachment(index);
// //                   }}
// //                   sx={{
// //                     position: "absolute",
// //                     top: 2,
// //                     right: 2,
// //                     width: 18,
// //                     height: 18,
// //                     bgcolor: "rgba(0,0,0,0.55)",
// //                     color: "#fff",
// //                     "&:hover": {
// //                       bgcolor: "rgba(0,0,0,0.75)",
// //                     },
// //                   }}
// //                 >
// //                   <CloseIcon sx={{ fontSize: 12 }} />
// //                 </IconButton>
// //               </Box>
// //             ))}
// //           </Box>

// //           {/* Upload usage */}
// //           <Typography
// //             sx={{
// //               fontSize: 10.5,
// //               color: palette.textMuted,
// //               mt: 0.5,
// //               textAlign: isHero ? "center" : "left",
// //             }}
// //           >
// //             {formatFileSize(totalSize)} / 10 MB used
// //           </Typography>
// //         </Box>
// //       )}

// //       {/* Main input shell */}
// //       <Box
// //         sx={{
// //           display: "flex",
// //           alignItems: "flex-end",
// //           gap: 1,
// //           bgcolor: inputShellBg,
// //           borderRadius: isHero ? "16px" : "14px",
// //           border: "1px solid",
// //           borderColor: palette.border,
// //           px: isHero ? 2 : 1.5,
// //           py: isHero ? 1.5 : 1,
// //           minHeight: isHero ? 120 : undefined,
// //           transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
// //           ...(isHero && mode === "dark"
// //             ? {
// //                 boxShadow: `0 0 0 1px ${alpha(
// //                   palette.border,
// //                   0.9,
// //                 )}, 0 1px 8px ${alpha("#000", 0.28)}, inset 0 1px 0 ${alpha(
// //                   palette.primary,
// //                   0.14,
// //                 )}`,
// //               }
// //             : isHero && mode === "light"
// //               ? {
// //                   boxShadow: `0 1px 3px ${alpha("#000", 0.06)}, inset 0 1px 0 ${alpha(
// //                     palette.primary,
// //                     0.12,
// //                   )}`,
// //                 }
// //               : {}),
// //           "&:focus-within": {
// //             borderColor: palette.primary,
// //             boxShadow: focusRing,
// //           },
// //         }}
// //       >
// //         {/* Attach button */}
// //         <Tooltip title="Attach file (10 MB total max)">
// //           <IconButton
// //             size="small"
// //             onClick={open}
// //             sx={{
// //               color: palette.textMuted,
// //               "&:hover": {
// //                 color: palette.primary,
// //               },
// //             }}
// //           >
// //             <AttachFileIcon sx={{ fontSize: 18 }} />
// //           </IconButton>
// //         </Tooltip>

// //         {/* Textarea */}
// //         <textarea
// //           ref={textareaRef}
// //           value={text}
// //           onChange={handleInput}
// //           onKeyDown={handleKeyDown}
// //           onPaste={handlePaste}
// //           placeholder={resolvedPlaceholder}
// //           disabled={disabled}
// //           rows={isHero ? 4 : MIN_ROWS}
// //           style={{
// //             flex: 1,
// //             resize: "none",
// //             border: "none",
// //             outline: "none",
// //             background: "transparent",
// //             color: palette.textPrimary,
// //             fontSize: isHero ? "0.9375rem" : "0.9rem",
// //             fontFamily: '"Inter", -apple-system, sans-serif',
// //             lineHeight: 1.55,
// //             maxHeight: maxTextHeight,
// //             minHeight: isHero ? 88 : undefined,
// //             overflowY: "auto",
// //           }}
// //         />

// //         {/* Send button */}
// //         <Tooltip title="Send (Enter)">
// //           <span>
// //             <IconButton
// //               onClick={handleSend}
// //               disabled={disabled || (!text.trim() && attachments.length === 0)}
// //               sx={{
// //                 bgcolor: palette.primary,
// //                 color: palette.textOnPrimary,
// //                 width: isHero ? 40 : 34,
// //                 height: isHero ? 40 : 34,
// //                 borderRadius: "10px",
// //                 "&:hover": {
// //                   bgcolor: palette.primaryHover,
// //                 },
// //                 "&.Mui-disabled": {
// //                   bgcolor: palette.border,
// //                   color: palette.textMuted,
// //                 },
// //               }}
// //             >
// //               <SendIcon sx={{ fontSize: isHero ? 18 : 16 }} />
// //             </IconButton>
// //           </span>
// //         </Tooltip>
// //       </Box>

// //       {/* Hero helper text */}
// //       {isHero && (
// //         <Typography
// //           sx={{
// //             fontSize: 11,
// //             color: palette.textMuted,
// //             textAlign: "center",
// //             mt: 1.5,
// //           }}
// //         >
// //           Shift+Enter for a new line · Enter to send
// //         </Typography>
// //       )}

// //       {/* Preview dialog */}
// //       <Dialog
// //         open={Boolean(filePreview)}
// //         onClose={() => setFilePreview(null)}
// //         maxWidth="md"
// //         fullWidth
// //       >
// //         {filePreview && (
// //           <DialogTitle sx={{ fontSize: 15 }}>
// //             {filePreview.name}
// //           </DialogTitle>
// //         )}

// //         <DialogContent sx={{ p: 1, pt: 0, bgcolor: palette.bgChat }}>
// //           {/* PDF preview */}
// //           {filePreview?.type === "application/pdf" && filePreview.url ? (
// //             <Box
// //               component="iframe"
// //               title={filePreview.name}
// //               src={filePreview.url}
// //               sx={{
// //                 width: "100%",
// //                 height: { xs: "60vh", sm: "72vh" },
// //                 border: "none",
// //                 borderRadius: 1,
// //               }}
// //             />
// //           ) : /* Text file preview with scrollbar */
// //           filePreview?.type === "text/plain" && filePreview.rawText ? (
// //             <Box
// //               sx={{
// //                 maxHeight: "72vh",
// //                 overflow: "auto",
// //                 border: "1px solid",
// //                 borderColor: palette.border,
// //                 borderRadius: 1.5,
// //                 bgcolor: palette.bgInput,
// //                 p: 2,
// //               }}
// //             >
// //               <Typography
// //                 component="pre"
// //                 sx={{
// //                   m: 0,
// //                   whiteSpace: "pre-wrap",
// //                   wordBreak: "break-word",
// //                   fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
// //                   fontSize: 12.5,
// //                   lineHeight: 1.6,
// //                   color: palette.textPrimary,
// //                 }}
// //               >
// //                 {filePreview.rawText}
// //               </Typography>
// //             </Box>
// //           ) : /* Image preview */
// //           filePreview?.url ? (
// //             <img
// //               src={filePreview.url}
// //               alt={filePreview.name}
// //               style={{
// //                 maxWidth: "100%",
// //                 maxHeight: "80vh",
// //                 objectFit: "contain",
// //               }}
// //             />
// //           ) : null}
// //         </DialogContent>
// //       </Dialog>

// //       {/* Toast */}
// //       <Snackbar
// //         open={!!toast}
// //         autoHideDuration={4000}
// //         onClose={() => setToast(null)}
// //         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
// //       >
// //         {toast ? (
// //           <Alert
// //             severity={toast.sev}
// //             onClose={() => setToast(null)}
// //             sx={{ fontSize: 12 }}
// //           >
// //             {toast.msg}
// //           </Alert>
// //         ) : (
// //           <span />
// //         )}
// //       </Snackbar>
// //     </Box>
// //   );
// // };

// // export default ChatInput;
// import React, { useState, useRef, useCallback, useMemo } from "react";
// import {
//   Box,
//   IconButton,
//   Tooltip,
//   Typography,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import { alpha } from "@mui/material/styles";

// import SendIcon from "@mui/icons-material/Send";
// import AttachFileIcon from "@mui/icons-material/AttachFile";
// import CloseIcon from "@mui/icons-material/Close";
// import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
// import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

// import { useDropzone } from "react-dropzone";

// import { formatFileSize } from "../utils/helpers";
// import { useThemeMode } from "../contexts/ThemeModeContext";

// import type { FileAttachment } from "../features/chat/chatSlice";

// /* ============================================================
//    TYPES
//    ============================================================ */

// interface Props {
//   // Parent send handler
//   onSend: (content: string, attachments: FileAttachment[]) => void;

//   // Whether input interactions should be disabled
//   disabled: boolean;

//   // Whether assistant is currently streaming
//   // Used to swap Send button with Stop button
//   isStreaming?: boolean;

//   // Parent stop handler
//   onStop?: () => void;

//   // Optional custom placeholder
//   placeholder?: string;

//   // footer = docked input
//   // hero   = centered large composer
//   variant?: "footer" | "hero";
// }

// /* ============================================================
//    CONSTANTS
//    ============================================================ */

// // Combined upload limit across all attachments
// const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

// // Textarea inline limit
// const MAX_WORDS = 1000;

// // If pasted text is 500 words or more, convert to .txt file
// const PASTE_TO_FILE_WORD_THRESHOLD = 500;

// // Accepted upload types
// const ACCEPTED: Record<string, string[]> = {
//   "application/pdf": [".pdf"],
//   "application/json": [".json"],
//   "text/plain": [".txt", ".log", ".md"],
//   "text/csv": [".csv"],
//   "application/vnd.ms-excel": [".xls"],
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
//   "image/*": [],
// };

// // Minimum rows in footer mode
// const MIN_ROWS = 1;

// // Normal max visible height before scrolling
// const TEXTAREA_COLLAPSED_MAX_HEIGHT_FOOTER = 240;
// const TEXTAREA_COLLAPSED_MAX_HEIGHT_HERO = 320;

// // Expanded height when user clicks "Show more"
// const TEXTAREA_EXPANDED_MAX_HEIGHT_FOOTER = 420;
// const TEXTAREA_EXPANDED_MAX_HEIGHT_HERO = 520;

// /* ============================================================
//    LOCAL ATTACHMENT TYPE
//    ============================================================ */

// // We keep a little extra local info beyond FileAttachment
// type LocalAttachment = FileAttachment & {
//   _size: number;
//   objectUrl?: string;
//   rawText?: string; // only for pasted long text files
// };

// /* ============================================================
//    HELPERS
//    ============================================================ */

// // Count words robustly using whitespace split
// function countWords(value: string): number {
//   const trimmed = value.trim();
//   if (!trimmed) return 0;
//   return trimmed.split(/\s+/).length;
// }

// /* ============================================================
//    COMPONENT
//    ============================================================ */

// const ChatInput: React.FC<Props> = ({
//   onSend,
//   disabled,
//   isStreaming = false,
//   onStop,
//   placeholder,
//   variant = "footer",
// }) => {
//   /* ------------------------------------------------------------
//      THEME / VARIANT
//      ------------------------------------------------------------ */

//   const { palette, mode } = useThemeMode();

//   const isHero = variant === "hero";

//   const resolvedPlaceholder =
//     placeholder ??
//     (isHero
//       ? "Ask anything — paste images, logs, attach files, drop screenshots…"
//       : "Ask anything — paste images, logs, attach files, drop screenshots…");

//   /* ------------------------------------------------------------
//      LOCAL STATE
//      ------------------------------------------------------------ */

//   // Main textarea value
//   const [text, setText] = useState("");

//   // Attachments shown above the input shell
//   const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

//   // File preview dialog state
//   const [filePreview, setFilePreview] = useState<{
//     url?: string;
//     type: string;
//     name: string;
//     rawText?: string;
//   } | null>(null);

//   // Simple feedback snackbar
//   const [toast, setToast] = useState<{
//     msg: string;
//     sev: "error" | "warning" | "success";
//   } | null>(null);

//   // Whether user expanded textarea manually
//   const [expanded, setExpanded] = useState(false);

//   // Textarea DOM ref
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   // Counter for naming pasted text files
//   const pastedFileCountRef = useRef(0);

//   /* ------------------------------------------------------------
//      DERIVED VALUES
//      ------------------------------------------------------------ */

//   // Current total attachment size
//   const totalSize = attachments.reduce((sum, item) => sum + item._size, 0);

//   // Current word count of inline text
//   const currentWordCount = countWords(text);

//   // Max textarea height depends on hero/footer + expanded state
//   const maxTextHeight = expanded
//     ? isHero
//       ? TEXTAREA_EXPANDED_MAX_HEIGHT_HERO
//       : TEXTAREA_EXPANDED_MAX_HEIGHT_FOOTER
//     : isHero
//       ? TEXTAREA_COLLAPSED_MAX_HEIGHT_HERO
//       : TEXTAREA_COLLAPSED_MAX_HEIGHT_FOOTER;

//   // Whether input can send anything
//   const canSend = !!text.trim() || attachments.length > 0;

//   // We estimate if "Show more" should appear
//   // based on content line count and textarea size
//   const shouldOfferExpand = useMemo(() => {
//     const lines = text.split("\n").length;
//     return lines > 15 || currentWordCount > 180;
//   }, [text, currentWordCount]);

//   /* ------------------------------------------------------------
//      HELPERS
//      ------------------------------------------------------------ */

//   // Generate:
//   // pasted.txt
//   // pasted2.txt
//   // pasted3.txt
//   const getNextPastedFileName = () => {
//     pastedFileCountRef.current += 1;

//     return pastedFileCountRef.current === 1
//       ? "pasted.txt"
//       : `pasted${pastedFileCountRef.current}.txt`;
//   };

//   // Reset textarea height after send/clear
//   const resetTextareaHeight = () => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//     }
//   };

//   // Recalculate textarea height
//   const resizeTextarea = (el: HTMLTextAreaElement) => {
//     el.style.height = "auto";
//     el.style.height = `${Math.min(el.scrollHeight, maxTextHeight)}px`;
//   };

//   /* ------------------------------------------------------------
//      FILE DROP HANDLER
//      ------------------------------------------------------------ */

//   const onDrop = useCallback(
//     (files: File[]) => {
//       const acceptedFiles: LocalAttachment[] = [];

//       let runningTotal = totalSize;
//       let skippedCombined = 0;
//       let skippedOversize = 0;

//       for (const file of files) {
//         // Reject if one file alone is too large
//         if (file.size > MAX_TOTAL_SIZE) {
//           skippedOversize++;
//           continue;
//         }

//         // Reject if combined total exceeds limit
//         if (runningTotal + file.size > MAX_TOTAL_SIZE) {
//           skippedCombined++;
//           continue;
//         }

//         runningTotal += file.size;

//         const objectUrl = URL.createObjectURL(file);

//         acceptedFiles.push({
//           name: file.name,
//           size: file.size,
//           type: file.type,
//           _size: file.size,
//           objectUrl,
//           preview: file.type.startsWith("image/") ? objectUrl : undefined,
//         });
//       }

//       if (acceptedFiles.length) {
//         setAttachments((prev) => [...prev, ...acceptedFiles]);
//       }

//       if (skippedOversize) {
//         setToast({
//           msg: `${skippedOversize} file(s) exceed the 10 MB limit.`,
//           sev: "error",
//         });
//       } else if (skippedCombined) {
//         setToast({
//           msg: `Combined upload limit is 10 MB. Skipped ${skippedCombined} file(s).`,
//           sev: "error",
//         });
//       }
//     },
//     [totalSize],
//   );

//   /* ------------------------------------------------------------
//      DROPZONE
//      ------------------------------------------------------------ */

//   const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
//     onDrop,
//     accept: ACCEPTED,
//     noClick: true,
//     noKeyboard: true,
//     onDropRejected(files) {
//       const types = Array.from(new Set(files.map((f) => f.file.type || "unknown")));
//       setToast({
//         msg: `Unsupported file type${types.length > 1 ? "s" : ""}: ${types.join(", ")}`,
//         sev: "warning",
//       });
//     },
//   });

//   /* ------------------------------------------------------------
//      INPUT HANDLERS
//      ------------------------------------------------------------ */

//   // Typing into textarea
//   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const next = e.target.value;

//     // Enforce 1000-word limit for inline text
//     if (countWords(next) > MAX_WORDS) {
//       setToast({
//         msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
//         sev: "warning",
//       });
//       return;
//     }

//     setText(next);
//     resizeTextarea(e.target);
//   };

//   // Enter sends, Shift+Enter adds new line
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();

//       if (isStreaming && onStop) {
//         onStop();
//         return;
//       }

//       handleSend();
//     }
//   };

//   // Paste handler:
//   // 1) pasted images -> attachments
//   // 2) pasted text >= 500 words -> .txt file
//   // 3) pasted text < 500 words -> inline, but still respect 1000-word limit
//   const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
//     /* ----------------------------------------------------------
//        STEP 1: HANDLE PASTED IMAGES
//        ---------------------------------------------------------- */
//     const items = e.clipboardData.items;
//     const imageFiles: File[] = [];

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (item.kind === "file" && item.type.startsWith("image/")) {
//         const file = item.getAsFile();

//         if (file) {
//           const ext = file.type.split("/")[1] || "png";

//           const namedImage = new File(
//             [file],
//             file.name && file.name !== "image.png"
//               ? file.name
//               : `pasted-${Date.now()}.${ext}`,
//             { type: file.type },
//           );

//           imageFiles.push(namedImage);
//         }
//       }
//     }

//     // If clipboard contains images, add them as attachments
//     if (imageFiles.length > 0) {
//       e.preventDefault();
//       onDrop(imageFiles);

//       setToast({
//         msg: `Pasted ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} from clipboard.`,
//         sev: "success",
//       });

//       return;
//     }

//     /* ----------------------------------------------------------
//        STEP 2: HANDLE PASTED TEXT
//        ---------------------------------------------------------- */
//     const pasted = e.clipboardData.getData("text");

//     if (!pasted) return;

//     const pastedWordCount = countWords(pasted);

//     // If pasted text is 500 words or more, convert to text file
//     if (pastedWordCount >= PASTE_TO_FILE_WORD_THRESHOLD) {
//       e.preventDefault();

//       const fileName = getNextPastedFileName();
//       const blob = new Blob([pasted], { type: "text/plain" });

//       // Respect total attachment size limit
//       if (totalSize + blob.size > MAX_TOTAL_SIZE) {
//         setToast({
//           msg: `Cannot add ${fileName}. Combined upload limit is 10 MB.`,
//           sev: "error",
//         });
//         return;
//       }

//       const objectUrl = URL.createObjectURL(blob);

//       setAttachments((prev) => [
//         ...prev,
//         {
//           name: fileName,
//           size: blob.size,
//           type: "text/plain",
//           _size: blob.size,
//           objectUrl,
//           rawText: pasted,
//         },
//       ]);

//       setToast({
//         msg: `${fileName} created from pasted text.`,
//         sev: "success",
//       });

//       return;
//     }

//     // If pasted text is short, let it go inline,
//     // but check projected total inline word count first
//     const textarea = e.currentTarget;
//     const start = textarea.selectionStart ?? text.length;
//     const end = textarea.selectionEnd ?? text.length;

//     const projectedText = text.slice(0, start) + pasted + text.slice(end);

//     if (countWords(projectedText) > MAX_WORDS) {
//       e.preventDefault();

//       setToast({
//         msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
//         sev: "warning",
//       });
//     }
//   };

//   /* ------------------------------------------------------------
//      SEND HANDLER
//      ------------------------------------------------------------ */

//   const handleSend = () => {
//     if (!canSend) return;

//     onSend(
//       text.trim(),
//       attachments.map(({ _size, objectUrl, rawText, ...rest }) => rest),
//     );

//     // Revoke all local object urls
//     attachments.forEach((item) => {
//       if (item.objectUrl) {
//         URL.revokeObjectURL(item.objectUrl);
//       }
//     });

//     // Reset everything
//     setText("");
//     setAttachments([]);
//     setExpanded(false);
//     resetTextareaHeight();
//   };

//   /* ------------------------------------------------------------
//      REMOVE ATTACHMENT
//      ------------------------------------------------------------ */

//   const removeAttachment = (index: number) => {
//     setAttachments((prev) => {
//       const removed = prev[index];

//       if (removed?.objectUrl) {
//         URL.revokeObjectURL(removed.objectUrl);
//       }

//       return prev.filter((_, i) => i !== index);
//     });
//   };

//   /* ------------------------------------------------------------
//      STYLE HELPERS
//      ------------------------------------------------------------ */

//   const inputShellBg = isHero
//     ? mode === "dark"
//       ? alpha("#fff", 0.04)
//       : "#ffffff"
//     : palette.bgInput;

//   const focusRing =
//     mode === "dark" && isHero
//       ? `0 0 0 1px ${alpha(palette.primary, 0.45)}, 0 0 0 2px ${alpha(
//           palette.primary,
//           0.18,
//         )}, 0 1px 10px ${alpha("#000", 0.25)}`
//       : `0 0 0 2px ${palette.primarySoft}`;

//   /* ============================================================
//      RENDER
//      ============================================================ */

//   return (
//     <Box
//       {...getRootProps()}
//       sx={{
//         px: isHero ? 0 : 3,
//         py: isHero ? 0 : 2,
//         borderTop: isHero ? "none" : "1px solid",
//         borderColor: palette.border,
//         bgcolor: isDragActive ? palette.primarySoft : isHero ? "transparent" : palette.bgChat,
//         transition: "background-color 0.2s",
//       }}
//     >
//       {/* Hidden upload input managed by react-dropzone */}
//       <input {...getInputProps()} />

//       {/* Drag overlay */}
//       {isDragActive && (
//         <Box
//           sx={{
//             p: 2,
//             mb: 1.5,
//             border: "2px dashed",
//             borderColor: palette.primary,
//             borderRadius: "8px",
//             textAlign: "center",
//             bgcolor: palette.primarySoft,
//           }}
//         >
//           <Typography sx={{ color: palette.primary, fontSize: 13 }}>
//             Drop files here…
//           </Typography>
//         </Box>
//       )}

//       {/* ========================================================
//           ATTACHMENTS PREVIEW STRIP
//          ======================================================== */}
//       {attachments.length > 0 && (
//         <Box sx={{ mb: 1.25 }}>
//           <Box
//             sx={{
//               display: "flex",
//               gap: 1,
//               flexWrap: "wrap",
//               justifyContent: isHero ? "center" : "flex-start",
//             }}
//           >
//             {attachments.map((file, index) => (
//               <Box
//                 key={`${file.name}-${index}`}
//                 onClick={() => {
//                   // Image preview
//                   if (file.preview) {
//                     setFilePreview({
//                       url: file.preview,
//                       type: file.type || "",
//                       name: file.name,
//                     });
//                     return;
//                   }

//                   // Pasted text file preview
//                   if (file.rawText) {
//                     setFilePreview({
//                       type: "text/plain",
//                       name: file.name,
//                       rawText: file.rawText,
//                     });
//                     return;
//                   }

//                   // PDF / other file preview
//                   if (file.objectUrl) {
//                     setFilePreview({
//                       url: file.objectUrl,
//                       type: file.type || "",
//                       name: file.name,
//                     });
//                   }
//                 }}
//                 sx={{
//                   position: "relative",
//                   borderRadius: "8px",
//                   overflow: "hidden",
//                   border: "1px solid",
//                   borderColor: palette.border,
//                   bgcolor: palette.bgInput,
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 1,
//                   cursor: "pointer",
//                   ...(file.preview
//                     ? {
//                         width: 80,
//                         height: 80,
//                       }
//                     : {
//                         px: 1.5,
//                         py: 0.75,
//                       }),
//                 }}
//               >
//                 {file.preview ? (
//                   <img
//                     src={file.preview}
//                     alt={file.name}
//                     style={{
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                     }}
//                   />
//                 ) : (
//                   <>
//                     <InsertDriveFileIcon
//                       sx={{
//                         fontSize: 16,
//                         color: palette.textMuted,
//                       }}
//                     />

//                     <Box sx={{ minWidth: 0 }}>
//                       <Typography
//                         sx={{
//                           fontSize: 11,
//                           color: palette.textPrimary,
//                           whiteSpace: "nowrap",
//                           overflow: "hidden",
//                           textOverflow: "ellipsis",
//                           maxWidth: 140,
//                         }}
//                       >
//                         {file.name}
//                       </Typography>

//                       <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
//                         {formatFileSize(file.size)}
//                       </Typography>
//                     </Box>
//                   </>
//                 )}

//                 {/* Remove attachment */}
//                 <IconButton
//                   size="small"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeAttachment(index);
//                   }}
//                   sx={{
//                     position: "absolute",
//                     top: 2,
//                     right: 2,
//                     width: 18,
//                     height: 18,
//                     bgcolor: "rgba(0,0,0,0.55)",
//                     color: "#fff",
//                     "&:hover": {
//                       bgcolor: "rgba(0,0,0,0.75)",
//                     },
//                   }}
//                 >
//                   <CloseIcon sx={{ fontSize: 12 }} />
//                 </IconButton>
//               </Box>
//             ))}
//           </Box>

//           {/* Total upload usage */}
//           <Typography
//             sx={{
//               fontSize: 10.5,
//               color: palette.textMuted,
//               mt: 0.5,
//               textAlign: isHero ? "center" : "left",
//             }}
//           >
//             {formatFileSize(totalSize)} / 10 MB used
//           </Typography>
//         </Box>
//       )}

//       {/* ========================================================
//           MAIN INPUT SHELL
//          ======================================================== */}
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "flex-end",
//           gap: 1,
//           bgcolor: inputShellBg,
//           borderRadius: isHero ? "16px" : "14px",
//           border: "1px solid",
//           borderColor: palette.border,
//           px: isHero ? 2 : 1.5,
//           py: isHero ? 1.5 : 1,
//           minHeight: isHero ? 120 : undefined,
//           transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
//           ...(isHero && mode === "dark"
//             ? {
//                 boxShadow: `0 0 0 1px ${alpha(
//                   palette.border,
//                   0.9,
//                 )}, 0 1px 8px ${alpha("#000", 0.28)}, inset 0 1px 0 ${alpha(
//                   palette.primary,
//                   0.14,
//                 )}`,
//               }
//             : isHero && mode === "light"
//               ? {
//                   boxShadow: `0 1px 3px ${alpha("#000", 0.06)}, inset 0 1px 0 ${alpha(
//                     palette.primary,
//                     0.12,
//                   )}`,
//                 }
//               : {}),
//           "&:focus-within": {
//             borderColor: palette.primary,
//             boxShadow: focusRing,
//           },
//         }}
//       >
//         {/* Attach file button */}
//         <Tooltip title="Attach file (10 MB total max)">
//           <IconButton
//             size="small"
//             onClick={open}
//             sx={{
//               color: palette.textMuted,
//               "&:hover": {
//                 color: palette.primary,
//               },
//             }}
//           >
//             <AttachFileIcon sx={{ fontSize: 18 }} />
//           </IconButton>
//         </Tooltip>

//         {/* Main textarea */}
//         <textarea
//           ref={textareaRef}
//           value={text}
//           onChange={handleInput}
//           onKeyDown={handleKeyDown}
//           onPaste={handlePaste}
//           placeholder={resolvedPlaceholder}
//           disabled={disabled}
//           rows={isHero ? 4 : MIN_ROWS}
//           style={{
//             flex: 1,
//             resize: "none",
//             border: "none",
//             outline: "none",
//             background: "transparent",
//             color: palette.textPrimary,
//             fontSize: isHero ? "0.9375rem" : "0.9rem",
//             fontFamily: '"Inter", -apple-system, sans-serif',
//             lineHeight: 1.55,
//             maxHeight: maxTextHeight,
//             minHeight: isHero ? 88 : undefined,
//             overflowY: "auto",
//             whiteSpace: "pre-wrap",
//           }}
//         />

//         {/* Send / Stop button area */}
//         <Tooltip title={isStreaming ? "Stop generation" : "Send (Enter)"}>
//           <span>
//             {isStreaming ? (
//               <IconButton
//                 onClick={onStop}
//                 disabled={!onStop}
//                 sx={{
//                   bgcolor: palette.error,
//                   color: "#fff",
//                   width: isHero ? 40 : 34,
//                   height: isHero ? 40 : 34,
//                   borderRadius: "10px",
//                   "&:hover": {
//                     bgcolor: palette.error,
//                     opacity: 0.92,
//                   },
//                   "&.Mui-disabled": {
//                     bgcolor: palette.border,
//                     color: palette.textMuted,
//                   },
//                 }}
//               >
//                 <StopCircleOutlinedIcon sx={{ fontSize: isHero ? 18 : 16 }} />
//               </IconButton>
//             ) : (
//               <IconButton
//                 onClick={handleSend}
//                 disabled={disabled || !canSend}
//                 sx={{
//                   bgcolor: palette.primary,
//                   color: palette.textOnPrimary,
//                   width: isHero ? 40 : 34,
//                   height: isHero ? 40 : 34,
//                   borderRadius: "10px",
//                   "&:hover": {
//                     bgcolor: palette.primaryHover,
//                   },
//                   "&.Mui-disabled": {
//                     bgcolor: palette.border,
//                     color: palette.textMuted,
//                   },
//                 }}
//               >
//                 <SendIcon sx={{ fontSize: isHero ? 18 : 16 }} />
//               </IconButton>
//             )}
//           </span>
//         </Tooltip>
//       </Box>

//       {/* Show more / Show less */}
//       {shouldOfferExpand && (
//         <Box
//           sx={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             mt: 0.5,
//           }}
//         >
//           <Typography
//             onClick={() => {
//               setExpanded((prev) => !prev);

//               // next frame, resize with new limit
//               requestAnimationFrame(() => {
//                 if (textareaRef.current) {
//                   resizeTextarea(textareaRef.current);
//                 }
//               });
//             }}
//             sx={{
//               fontSize: 11,
//               color: palette.primary,
//               cursor: "pointer",
//               userSelect: "none",
//             }}
//           >
//             {expanded ? "Show less" : "Show more"}
//           </Typography>

//           <Typography
//             sx={{
//               fontSize: 10.5,
//               color:
//                 currentWordCount > MAX_WORDS * 0.9
//                   ? palette.warning
//                   : palette.textMuted,
//             }}
//           >
//             {currentWordCount} / {MAX_WORDS} words
//           </Typography>
//         </Box>
//       )}

//       {/* If no show-more row is visible, still show counter */}
//       {!shouldOfferExpand && (
//         <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
//           <Typography
//             sx={{
//               fontSize: 10.5,
//               color:
//                 currentWordCount > MAX_WORDS * 0.9
//                   ? palette.warning
//                   : palette.textMuted,
//             }}
//           >
//             {currentWordCount} / {MAX_WORDS} words
//           </Typography>
//         </Box>
//       )}

//       {/* Hero helper text */}
//       {isHero && (
//         <Typography
//           sx={{
//             fontSize: 11,
//             color: palette.textMuted,
//             textAlign: "center",
//             mt: 1.5,
//           }}
//         >
//           Shift+Enter for a new line · Enter to send
//         </Typography>
//       )}

//       {/* ========================================================
//           FILE PREVIEW DIALOG
//          ======================================================== */}
//       <Dialog
//         open={Boolean(filePreview)}
//         onClose={() => setFilePreview(null)}
//         maxWidth="md"
//         fullWidth
//       >
//         {filePreview && (
//           <DialogTitle sx={{ fontSize: 15 }}>
//             {filePreview.name}
//           </DialogTitle>
//         )}

//         <DialogContent sx={{ p: 1, pt: 0, bgcolor: palette.bgChat }}>
//           {/* PDF preview */}
//           {filePreview?.type === "application/pdf" && filePreview.url ? (
//             <Box
//               component="iframe"
//               title={filePreview.name}
//               src={filePreview.url}
//               sx={{
//                 width: "100%",
//                 height: { xs: "60vh", sm: "72vh" },
//                 border: "none",
//                 borderRadius: 1,
//               }}
//             />
//           ) : filePreview?.type === "text/plain" && filePreview.rawText ? (
//             // Scrollable text preview for pasted .txt files
//             <Box
//               sx={{
//                 maxHeight: "72vh",
//                 overflow: "auto",
//                 border: "1px solid",
//                 borderColor: palette.border,
//                 borderRadius: 1.5,
//                 bgcolor: palette.bgInput,
//                 p: 2,
//               }}
//             >
//               <Typography
//                 component="pre"
//                 sx={{
//                   m: 0,
//                   whiteSpace: "pre-wrap",
//                   wordBreak: "break-word",
//                   fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
//                   fontSize: 12.5,
//                   lineHeight: 1.6,
//                   color: palette.textPrimary,
//                 }}
//               >
//                 {filePreview.rawText}
//               </Typography>
//             </Box>
//           ) : filePreview?.url ? (
//             // Image preview
//             <img
//               src={filePreview.url}
//               alt={filePreview.name}
//               style={{
//                 maxWidth: "100%",
//                 maxHeight: "80vh",
//                 objectFit: "contain",
//               }}
//             />
//           ) : null}
//         </DialogContent>
//       </Dialog>

//       {/* ========================================================
//           TOAST / SNACKBAR
//          ======================================================== */}
//       <Snackbar
//         open={!!toast}
//         autoHideDuration={4000}
//         onClose={() => setToast(null)}
//         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
//       >
//         {toast ? (
//           <Alert
//             severity={toast.sev}
//             onClose={() => setToast(null)}
//             sx={{ fontSize: 12 }}
//           >
//             {toast.msg}
//           </Alert>
//         ) : (
//           <span />
//         )}
//       </Snackbar>
//     </Box>
//   );
// };

// export default ChatInput;

// import React, { useState, useRef, useCallback } from "react";
// import {
//   Box,
//   IconButton,
//   Tooltip,
//   Typography,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import { alpha } from "@mui/material/styles";

// import SendIcon from "@mui/icons-material/Send";
// import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
// import AttachFileIcon from "@mui/icons-material/AttachFile";
// import CloseIcon from "@mui/icons-material/Close";
// import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

// import { useDropzone } from "react-dropzone";

// import { formatFileSize } from "../utils/helpers";
// import { useThemeMode } from "../contexts/ThemeModeContext";

// import type { FileAttachment } from "../features/chat/chatSlice";

// /* ============================================================
//    COMPONENT PROPS
//    ============================================================ */
// interface Props {
//   // Parent callback used when user sends a message
//   onSend: (content: string, attachments: FileAttachment[]) => void;

//   // Generic disabled flag from parent
//   disabled: boolean;

//   // Whether the assistant is currently streaming
//   // If true, we show Stop instead of Send
//   isStreaming?: boolean;

//   // Called when user clicks Stop
//   onStop?: () => void;

//   // Optional custom placeholder
//   placeholder?: string;

//   // footer = bottom composer
//   // hero = centered empty-state composer
//   variant?: "footer" | "hero";
// }

// /* ============================================================
//    CONSTANTS
//    ============================================================ */

// // Total combined attachment size limit
// const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

// // Max words allowed inside textarea input
// const MAX_WORDS = 1000;

// // If pasted text has 500 words or more, convert it into .txt attachment
// const PASTE_TO_FILE_WORD_THRESHOLD = 500;

// // Accepted file types for picker / drag-drop
// const ACCEPTED: Record<string, string[]> = {
//   "application/pdf": [".pdf"],
//   "application/json": [".json"],
//   "text/plain": [".txt", ".log", ".md"],
//   "text/csv": [".csv"],
//   "application/vnd.ms-excel": [".xls"],
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
//   "image/*": [],
// };

// // Minimum visible rows in footer mode
// const MIN_ROWS = 1;

// // Keep your existing textarea heights
// const TEXTAREA_MAX_HEIGHT_FOOTER = 240;
// const TEXTAREA_MAX_HEIGHT_HERO = 320;

// /* ============================================================
//    LOCAL ATTACHMENT TYPE
//    Extra UI-only fields live here.
//    ============================================================ */
// type LocalAttachment = FileAttachment & {
//   _size: number;
//   objectUrl?: string;
//   rawText?: string;
// };

// /* ============================================================
//    WORD COUNTER
//    Counts words using whitespace separation.
//    ============================================================ */
// function countWords(value: string) {
//   const trimmed = value.trim();
//   if (!trimmed) return 0;
//   return trimmed.split(/\s+/).length;
// }

// /* ============================================================
//    MAIN COMPONENT
//    ============================================================ */
// const ChatInput: React.FC<Props> = ({
//   onSend,
//   disabled,
//   isStreaming = false,
//   onStop,
//   placeholder,
//   variant = "footer",
// }) => {
//   /* ------------------------------------------------------------
//      THEME + VARIANT
//      ------------------------------------------------------------ */
//   const { palette, mode } = useThemeMode();

//   const isHero = variant === "hero";

//   const resolvedPlaceholder =
//     placeholder ??
//     (isHero
//       ? "Ask anything — paste images, logs, attach files, drop screenshots…"
//       : "Ask anything — paste images, logs, attach files, drop screenshots…");

//   const maxTextHeight = isHero
//     ? TEXTAREA_MAX_HEIGHT_HERO
//     : TEXTAREA_MAX_HEIGHT_FOOTER;

//   /* ------------------------------------------------------------
//      STATE
//      ------------------------------------------------------------ */
//   const [text, setText] = useState("");
//   const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
//   const [filePreview, setFilePreview] = useState<{
//     url?: string;
//     type: string;
//     name: string;
//     rawText?: string;
//   } | null>(null);

//   const [toast, setToast] = useState<{
//     msg: string;
//     sev: "error" | "warning" | "success";
//   } | null>(null);

//   // Ref to textarea so we can auto-resize it
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);

//   // Keeps track of how many large pasted text blocks became files
//   const pastedFileCountRef = useRef(0);

//   /* ------------------------------------------------------------
//      DERIVED VALUES
//      ------------------------------------------------------------ */
//   const totalSize = attachments.reduce((sum, item) => sum + item._size, 0);
//   const currentWordCount = countWords(text);
//   const canSend = !!text.trim() || attachments.length > 0;

//   /* ------------------------------------------------------------
//      FILE NAME HELPER
//      Creates pasted.txt, pasted2.txt, pasted3.txt ...
//      ------------------------------------------------------------ */
//   const getNextPastedFileName = () => {
//     pastedFileCountRef.current += 1;

//     return pastedFileCountRef.current === 1
//       ? "pasted.txt"
//       : `pasted${pastedFileCountRef.current}.txt`;
//   };

//   /* ------------------------------------------------------------
//      TEXTAREA RESIZE HELPER
//      Keeps the textarea growing until max height,
//      then the textarea itself scrolls.
//      ------------------------------------------------------------ */
//   const resizeTextarea = (el: HTMLTextAreaElement) => {
//     el.style.height = "auto";
//     el.style.height = `${Math.min(el.scrollHeight, maxTextHeight)}px`;
//   };

//   /* ------------------------------------------------------------
//      FILE DROP HANDLER
//      Used for drag-drop and file picker.
//      ------------------------------------------------------------ */
//   const onDrop = useCallback(
//     (files: File[]) => {
//       const acceptedFiles: LocalAttachment[] = [];

//       let runningTotal = totalSize;
//       let skippedCombined = 0;
//       let skippedOversize = 0;

//       for (const file of files) {
//         // Reject if a single file is larger than total allowed size
//         if (file.size > MAX_TOTAL_SIZE) {
//           skippedOversize++;
//           continue;
//         }

//         // Reject if adding this file exceeds combined size limit
//         if (runningTotal + file.size > MAX_TOTAL_SIZE) {
//           skippedCombined++;
//           continue;
//         }

//         runningTotal += file.size;

//         const objectUrl = URL.createObjectURL(file);

//         acceptedFiles.push({
//           name: file.name,
//           size: file.size,
//           type: file.type,
//           _size: file.size,
//           objectUrl,
//           preview: file.type.startsWith("image/") ? objectUrl : undefined,
//         });
//       }

//       if (acceptedFiles.length) {
//         setAttachments((prev) => [...prev, ...acceptedFiles]);
//       }

//       if (skippedOversize) {
//         setToast({
//           msg: `${skippedOversize} file(s) exceed the 10 MB limit.`,
//           sev: "error",
//         });
//       } else if (skippedCombined) {
//         setToast({
//           msg: `Combined upload limit is 10 MB. Skipped ${skippedCombined} file(s).`,
//           sev: "error",
//         });
//       }
//     },
//     [totalSize],
//   );

//   /* ------------------------------------------------------------
//      DROPZONE SETUP
//      ------------------------------------------------------------ */
//   const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
//     onDrop,
//     accept: ACCEPTED,
//     noClick: true,
//     noKeyboard: true,
//     onDropRejected(files) {
//       const types = Array.from(new Set(files.map((f) => f.file.type || "unknown")));
//       setToast({
//         msg: `Unsupported file type${types.length > 1 ? "s" : ""}: ${types.join(", ")}`,
//         sev: "warning",
//       });
//     },
//   });

//   /* ------------------------------------------------------------
//      TYPING HANDLER
//      Keeps textarea content under 1000 words.
//      ------------------------------------------------------------ */
//   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const next = e.target.value;

//     if (countWords(next) > MAX_WORDS) {
//       setToast({
//         msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
//         sev: "warning",
//       });
//       return;
//     }

//     setText(next);
//     resizeTextarea(e.target);
//   };

//   /* ------------------------------------------------------------
//      KEYBOARD HANDLER
//      Enter sends
//      Shift+Enter makes a new line
//      If streaming, Enter triggers stop instead of send
//      ------------------------------------------------------------ */
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();

//       if (isStreaming && onStop) {
//         onStop();
//         return;
//       }

//       handleSend();
//     }
//   };

//   /* ------------------------------------------------------------
//      PASTE HANDLER
//      1) Pasted image -> attachment
//      2) Pasted text >= 500 words -> txt file attachment
//      3) Pasted text < 500 words -> inline text, still respects 1000-word limit
//      ------------------------------------------------------------ */
//   const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
//     const items = e.clipboardData.items;

//     // STEP 1: detect pasted images
//     const imageFiles: File[] = [];

//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       if (item.kind === "file" && item.type.startsWith("image/")) {
//         const file = item.getAsFile();

//         if (file) {
//           const ext = file.type.split("/")[1] || "png";

//           const namedImage = new File(
//             [file],
//             file.name && file.name !== "image.png"
//               ? file.name
//               : `pasted-${Date.now()}.${ext}`,
//             { type: file.type },
//           );

//           imageFiles.push(namedImage);
//         }
//       }
//     }

//     // If image(s) were pasted, treat them as attachments
//     if (imageFiles.length > 0) {
//       e.preventDefault();
//       onDrop(imageFiles);

//       setToast({
//         msg: `Pasted ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} from clipboard.`,
//         sev: "success",
//       });

//       return;
//     }

//     // STEP 2: detect pasted text
//     const pasted = e.clipboardData.getData("text");

//     if (!pasted) return;

//     const pastedWordCount = countWords(pasted);

//     // Large pasted text becomes a file attachment
//     if (pastedWordCount >= PASTE_TO_FILE_WORD_THRESHOLD) {
//       e.preventDefault();

//       const fileName = getNextPastedFileName();
//       const blob = new Blob([pasted], { type: "text/plain" });

//       // Keep total upload size safe
//       if (totalSize + blob.size > MAX_TOTAL_SIZE) {
//         setToast({
//           msg: `Cannot add ${fileName}. Combined upload limit is 10 MB.`,
//           sev: "error",
//         });
//         return;
//       }

//       const objectUrl = URL.createObjectURL(blob);

//       setAttachments((prev) => [
//         ...prev,
//         {
//           name: fileName,
//           size: blob.size,
//           type: "text/plain",
//           _size: blob.size,
//           objectUrl,
//           rawText: pasted,
//         },
//       ]);

//       setToast({
//         msg: `${fileName} created from pasted text.`,
//         sev: "success",
//       });

//       return;
//     }

//     // Small pasted text stays inline,
//     // but we must ensure projected text does not exceed 1000 words
//     const textarea = e.currentTarget;
//     const start = textarea.selectionStart ?? text.length;
//     const end = textarea.selectionEnd ?? text.length;
//     const projectedText = text.slice(0, start) + pasted + text.slice(end);

//     if (countWords(projectedText) > MAX_WORDS) {
//       e.preventDefault();

//       setToast({
//         msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
//         sev: "warning",
//       });
//     }
//   };

//   /* ------------------------------------------------------------
//      SEND HANDLER
//      Sends text + attachments, then clears local UI state.
//      ------------------------------------------------------------ */
//   const handleSend = () => {
//     if (!canSend) return;

//     onSend(
//       text.trim(),
//       attachments.map(({ _size, objectUrl, rawText, ...rest }) => rest),
//     );

//     // Clean up generated object URLs
//     attachments.forEach((item) => {
//       if (item.objectUrl) {
//         URL.revokeObjectURL(item.objectUrl);
//       }
//     });

//     // Reset input state
//     setText("");
//     setAttachments([]);

//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//     }
//   };

//   /* ------------------------------------------------------------
//      REMOVE ATTACHMENT
//      ------------------------------------------------------------ */
//   const removeAttachment = (index: number) => {
//     setAttachments((prev) => {
//       const removed = prev[index];

//       if (removed?.objectUrl) {
//         URL.revokeObjectURL(removed.objectUrl);
//       }

//       return prev.filter((_, i) => i !== index);
//     });
//   };

//   /* ------------------------------------------------------------
//      VISUAL HELPERS
//      Keep your original styled shell.
//      ------------------------------------------------------------ */
//   const inputShellBg = isHero
//     ? mode === "dark"
//       ? alpha("#fff", 0.04)
//       : "#ffffff"
//     : palette.bgInput;

//   const focusRing =
//     mode === "dark" && isHero
//       ? `0 0 0 1px ${alpha(palette.primary, 0.45)}, 0 0 0 2px ${alpha(
//           palette.primary,
//           0.18,
//         )}, 0 1px 10px ${alpha("#000", 0.25)}`
//       : `0 0 0 2px ${palette.primarySoft}`;

//   /* ============================================================
//      RENDER
//      ============================================================ */
//   return (
//     <Box
//       {...getRootProps()}
//       sx={{
//         px: isHero ? 0 : 3,
//         py: isHero ? 0 : 2,
//         borderTop: isHero ? "none" : "1px solid",
//         borderColor: palette.border,
//         bgcolor: isDragActive ? palette.primarySoft : isHero ? "transparent" : palette.bgChat,
//         transition: "background-color 0.2s",
//       }}
//     >
//       {/* Hidden file input used by react-dropzone */}
//       <input {...getInputProps()} />

//       {/* Drag-drop visual state */}
//       {isDragActive && (
//         <Box
//           sx={{
//             p: 2,
//             mb: 1.5,
//             border: "2px dashed",
//             borderColor: palette.primary,
//             borderRadius: "8px",
//             textAlign: "center",
//             bgcolor: palette.primarySoft,
//           }}
//         >
//           <Typography sx={{ color: palette.primary, fontSize: 13 }}>
//             Drop files here…
//           </Typography>
//         </Box>
//       )}

//       {/* ========================================================
//           ATTACHMENTS STRIP
//           Now horizontally scrollable if many files overflow.
//          ======================================================== */}
//       {attachments.length > 0 && (
//         <Box sx={{ mb: 1.25 }}>
//           <Box
//             sx={{
//               display: "flex",
//               gap: 1,
//               flexWrap: "nowrap",
//               overflowX: "auto",
//               overflowY: "hidden",
//               pb: 0.5,
//               justifyContent: isHero ? "flex-start" : "flex-start",
//               scrollbarWidth: "thin",
//               "&::-webkit-scrollbar": {
//                 height: 8,
//               },
//               "&::-webkit-scrollbar-thumb": {
//                 background: palette.scrollbarThumb,
//                 borderRadius: 999,
//               },
//             }}
//           >
//             {attachments.map((file, index) => (
//               <Box
//                 key={`${file.name}-${index}`}
//                 onClick={() => {
//                   // Image preview
//                   if (file.preview) {
//                     setFilePreview({
//                       url: file.preview,
//                       type: file.type || "",
//                       name: file.name,
//                     });
//                     return;
//                   }

//                   // Text file preview with scroll
//                   if (file.rawText) {
//                     setFilePreview({
//                       type: "text/plain",
//                       name: file.name,
//                       rawText: file.rawText,
//                     });
//                     return;
//                   }

//                   // PDF / other preview
//                   if (file.objectUrl) {
//                     setFilePreview({
//                       url: file.objectUrl,
//                       type: file.type || "",
//                       name: file.name,
//                     });
//                   }
//                 }}
//                 sx={{
//                   position: "relative",
//                   borderRadius: "8px",
//                   overflow: "hidden",
//                   border: "1px solid",
//                   borderColor: palette.border,
//                   bgcolor: palette.bgInput,
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 1,
//                   cursor: "pointer",
//                   flexShrink: 0,
//                   ...(file.preview
//                     ? {
//                         width: 80,
//                         height: 80,
//                       }
//                     : {
//                         px: 1.5,
//                         py: 0.75,
//                         minWidth: 180,
//                       }),
//                 }}
//               >
//                 {file.preview ? (
//                   <img
//                     src={file.preview}
//                     alt={file.name}
//                     style={{
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                     }}
//                   />
//                 ) : (
//                   <>
//                     <InsertDriveFileIcon
//                       sx={{
//                         fontSize: 16,
//                         color: palette.textMuted,
//                       }}
//                     />

//                     <Box sx={{ minWidth: 0 }}>
//                       <Typography
//                         sx={{
//                           fontSize: 11,
//                           color: palette.textPrimary,
//                           whiteSpace: "nowrap",
//                           overflow: "hidden",
//                           textOverflow: "ellipsis",
//                           maxWidth: 140,
//                         }}
//                       >
//                         {file.name}
//                       </Typography>

//                       <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
//                         {formatFileSize(file.size)}
//                       </Typography>
//                     </Box>
//                   </>
//                 )}

//                 {/* Remove button */}
//                 <IconButton
//                   size="small"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeAttachment(index);
//                   }}
//                   sx={{
//                     position: "absolute",
//                     top: 2,
//                     right: 2,
//                     width: 18,
//                     height: 18,
//                     bgcolor: "rgba(0,0,0,0.55)",
//                     color: "#fff",
//                     "&:hover": {
//                       bgcolor: "rgba(0,0,0,0.75)",
//                     },
//                   }}
//                 >
//                   <CloseIcon sx={{ fontSize: 12 }} />
//                 </IconButton>
//               </Box>
//             ))}
//           </Box>

//           {/* Combined attachment usage */}
//           <Typography
//             sx={{
//               fontSize: 10.5,
//               color: palette.textMuted,
//               mt: 0.5,
//               textAlign: isHero ? "center" : "left",
//             }}
//           >
//             {formatFileSize(totalSize)} / 10 MB used
//           </Typography>
//         </Box>
//       )}

//       {/* ========================================================
//           MAIN INPUT SHELL
//           This keeps your original styled visual shell.
//          ======================================================== */}
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "flex-end",
//           gap: 1,
//           bgcolor: inputShellBg,
//           borderRadius: isHero ? "16px" : "14px",
//           border: "1px solid",
//           borderColor: palette.border,
//           px: isHero ? 2 : 1.5,
//           py: isHero ? 1.5 : 1,
//           minHeight: isHero ? 120 : undefined,
//           transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
//           ...(isHero && mode === "dark"
//             ? {
//                 boxShadow: `0 0 0 1px ${alpha(
//                   palette.border,
//                   0.9,
//                 )}, 0 1px 8px ${alpha("#000", 0.28)}, inset 0 1px 0 ${alpha(
//                   palette.primary,
//                   0.14,
//                 )}`,
//               }
//             : isHero && mode === "light"
//               ? {
//                   boxShadow: `0 1px 3px ${alpha("#000", 0.06)}, inset 0 1px 0 ${alpha(
//                     palette.primary,
//                     0.12,
//                   )}`,
//                 }
//               : {}),
//           "&:focus-within": {
//             borderColor: palette.primary,
//             boxShadow: focusRing,
//           },
//         }}
//       >
//         {/* File picker button */}
//         <Tooltip title="Attach file (10 MB total max)">
//           <IconButton
//             size="small"
//             onClick={open}
//             sx={{
//               color: palette.textMuted,
//               "&:hover": {
//                 color: palette.primary,
//               },
//             }}
//           >
//             <AttachFileIcon sx={{ fontSize: 18 }} />
//           </IconButton>
//         </Tooltip>

//         {/* Main textarea */}
//         <textarea
//           ref={textareaRef}
//           value={text}
//           onChange={handleInput}
//           onKeyDown={handleKeyDown}
//           onPaste={handlePaste}
//           placeholder={resolvedPlaceholder}
//           disabled={disabled && !isStreaming}
//           rows={isHero ? 4 : MIN_ROWS}
//           style={{
//             flex: 1,
//             resize: "none",
//             border: "none",
//             outline: "none",
//             background: "transparent",
//             color: palette.textPrimary,
//             fontSize: isHero ? "0.9375rem" : "0.9rem",
//             fontFamily: '"Inter", -apple-system, sans-serif',
//             lineHeight: 1.55,
//             maxHeight: maxTextHeight,
//             minHeight: isHero ? 88 : undefined,
//             overflowY: "auto",
//             whiteSpace: "pre-wrap",
//           }}
//         />

//         {/* Send or Stop button */}
//         <Tooltip title={isStreaming ? "Stop generation" : "Send (Enter)"}>
//           <span>
//             {isStreaming ? (
//               <IconButton
//                 onClick={onStop}
//                 disabled={!onStop}
//                 sx={{
//                   bgcolor: palette.error,
//                   color: "#fff",
//                   width: isHero ? 40 : 34,
//                   height: isHero ? 40 : 34,
//                   borderRadius: "10px",
//                   "&:hover": {
//                     bgcolor: palette.error,
//                     opacity: 0.92,
//                   },
//                   "&.Mui-disabled": {
//                     bgcolor: palette.border,
//                     color: palette.textMuted,
//                   },
//                 }}
//               >
//                 <StopCircleOutlinedIcon sx={{ fontSize: isHero ? 18 : 16 }} />
//               </IconButton>
//             ) : (
//               <IconButton
//                 onClick={handleSend}
//                 disabled={disabled || !canSend}
//                 sx={{
//                   bgcolor: palette.primary,
//                   color: palette.textOnPrimary,
//                   width: isHero ? 40 : 34,
//                   height: isHero ? 40 : 34,
//                   borderRadius: "10px",
//                   "&:hover": {
//                     bgcolor: palette.primaryHover,
//                   },
//                   "&.Mui-disabled": {
//                     bgcolor: palette.border,
//                     color: palette.textMuted,
//                   },
//                 }}
//               >
//                 <SendIcon sx={{ fontSize: isHero ? 18 : 16 }} />
//               </IconButton>
//             )}
//           </span>
//         </Tooltip>
//       </Box>

//       {/* Word counter */}
//       <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
//         <Typography
//           sx={{
//             fontSize: 10.5,
//             color:
//               currentWordCount > MAX_WORDS * 0.9
//                 ? palette.warning
//                 : palette.textMuted,
//           }}
//         >
//           {currentWordCount} / {MAX_WORDS} words
//         </Typography>
//       </Box>

//       {/* Hero helper text */}
//       {isHero && (
//         <Typography
//           sx={{
//             fontSize: 11,
//             color: palette.textMuted,
//             textAlign: "center",
//             mt: 1.5,
//           }}
//         >
//           Shift+Enter for a new line · Enter to send
//         </Typography>
//       )}

//       {/* ========================================================
//           PREVIEW DIALOG
//          ======================================================== */}
//       <Dialog
//         open={Boolean(filePreview)}
//         onClose={() => setFilePreview(null)}
//         maxWidth="md"
//         fullWidth
//       >
//         {filePreview && (
//           <DialogTitle sx={{ fontSize: 15 }}>
//             {filePreview.name}
//           </DialogTitle>
//         )}

//         <DialogContent sx={{ p: 1, pt: 0, bgcolor: palette.bgChat }}>
//           {/* PDF preview */}
//           {filePreview?.type === "application/pdf" && filePreview.url ? (
//             <Box
//               component="iframe"
//               title={filePreview.name}
//               src={filePreview.url}
//               sx={{
//                 width: "100%",
//                 height: { xs: "60vh", sm: "72vh" },
//                 border: "none",
//                 borderRadius: 1,
//               }}
//             />
//           ) : filePreview?.type === "text/plain" && filePreview.rawText ? (
//             // Scrollable text preview
//             <Box
//               sx={{
//                 maxHeight: "72vh",
//                 overflow: "auto",
//                 border: "1px solid",
//                 borderColor: palette.border,
//                 borderRadius: 1.5,
//                 bgcolor: palette.bgInput,
//                 p: 2,
//               }}
//             >
//               <Typography
//                 component="pre"
//                 sx={{
//                   m: 0,
//                   whiteSpace: "pre-wrap",
//                   wordBreak: "break-word",
//                   fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
//                   fontSize: 12.5,
//                   lineHeight: 1.6,
//                   color: palette.textPrimary,
//                 }}
//               >
//                 {filePreview.rawText}
//               </Typography>
//             </Box>
//           ) : filePreview?.url ? (
//             // Image preview
//             <img
//               src={filePreview.url}
//               alt={filePreview.name}
//               style={{
//                 maxWidth: "100%",
//                 maxHeight: "80vh",
//                 objectFit: "contain",
//               }}
//             />
//           ) : null}
//         </DialogContent>
//       </Dialog>

//       {/* Snackbar feedback */}
//       <Snackbar
//         open={!!toast}
//         autoHideDuration={4000}
//         onClose={() => setToast(null)}
//         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
//       >
//         {toast ? (
//           <Alert
//             severity={toast.sev}
//             onClose={() => setToast(null)}
//             sx={{ fontSize: 12 }}
//           >
//             {toast.msg}
//           </Alert>
//         ) : (
//           <span />
//         )}
//       </Snackbar>
//     </Box>
//   );
// };

// export default ChatInput;

import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import SendIcon from "@mui/icons-material/Send";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { useDropzone } from "react-dropzone";

import { formatFileSize } from "../utils/helpers";
import { useThemeMode } from "../contexts/ThemeModeContext";

import type { FileAttachment } from "../features/chat/chatSlice";

/* ============================================================
   COMPONENT PROPS
   ============================================================ */
interface Props {
  onSend: (content: string, attachments: FileAttachment[]) => void;
  disabled: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  variant?: "footer" | "hero";
}

/* ============================================================
   CONSTANTS
   ============================================================ */

// Max combined size for all attachments together
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

// Max words allowed inside textarea
const MAX_WORDS = 1000;

// If pasted text reaches this many words, convert it into a .txt file
const PASTE_TO_FILE_WORD_THRESHOLD = 500;

// Accepted file types for picker / drag-drop
const ACCEPTED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/json": [".json"],
  "text/plain": [".txt", ".log", ".md"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/*": [],
};

// Visible rows in footer mode
const MIN_ROWS = 1;

// Max textarea heights before internal scroll appears
const TEXTAREA_MAX_HEIGHT_FOOTER = 240;
const TEXTAREA_MAX_HEIGHT_HERO = 320;

/* ============================================================
   LOCAL ATTACHMENT TYPE
   This extends FileAttachment only for local UI state.
   _size is local-only and should not be stored in messages.
   objectUrl/rawText/preview SHOULD be preserved when sending,
   because MessageBubble uses them later for preview dialogs.
   ============================================================ */
type LocalAttachment = FileAttachment & {
  _size: number;
  objectUrl?: string;
  rawText?: string;
};

/* ============================================================
   WORD COUNT HELPER
   ============================================================ */
function countWords(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const ChatInput: React.FC<Props> = ({
  onSend,
  disabled,
  isStreaming = false,
  onStop,
  placeholder,
  variant = "footer",
}) => {
  /* ------------------------------------------------------------
     THEME + VARIANT
     ------------------------------------------------------------ */
  const { palette, mode } = useThemeMode();

  const isHero = variant === "hero";

  const resolvedPlaceholder =
    placeholder ??
    (isHero
      ? "Ask anything — paste images, logs, attach files, drop screenshots…"
      : "Ask anything — paste images, logs, attach files, drop screenshots…");

  const maxTextHeight = isHero
    ? TEXTAREA_MAX_HEIGHT_HERO
    : TEXTAREA_MAX_HEIGHT_FOOTER;

  /* ------------------------------------------------------------
     STATE
     ------------------------------------------------------------ */

  // Main text typed by user
  const [text, setText] = useState("");

  // Attachments added before send
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  // Preview dialog state for attachments before send
  const [filePreview, setFilePreview] = useState<{
    url?: string;
    type: string;
    name: string;
    rawText?: string;
  } | null>(null);

  // Toast state for warnings / success / errors
  const [toast, setToast] = useState<{
    msg: string;
    sev: "error" | "warning" | "success";
  } | null>(null);

  // Ref for auto-resizing textarea
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Count how many large pasted blocks were converted to file
  const pastedFileCountRef = useRef(0);

  /* ------------------------------------------------------------
     DERIVED VALUES
     ------------------------------------------------------------ */
  const totalSize = attachments.reduce((sum, item) => sum + item._size, 0);
  const currentWordCount = countWords(text);
  const canSend = !!text.trim() || attachments.length > 0;

  /* ------------------------------------------------------------
     FILE NAME HELPER
     Creates:
     pasted.txt
     pasted2.txt
     pasted3.txt
     ...
     ------------------------------------------------------------ */
  const getNextPastedFileName = () => {
    pastedFileCountRef.current += 1;

    return pastedFileCountRef.current === 1
      ? "pasted.txt"
      : `pasted${pastedFileCountRef.current}.txt`;
  };

  /* ------------------------------------------------------------
     TEXTAREA RESIZE HELPER
     Makes textarea grow until max height,
     then textarea itself becomes scrollable.
     ------------------------------------------------------------ */
  const resizeTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxTextHeight)}px`;
  };

  /* ------------------------------------------------------------
     FILE DROP HANDLER
     Used by drag-drop and file picker.
     ------------------------------------------------------------ */
  const onDrop = useCallback(
    (files: File[]) => {
      const acceptedFiles: LocalAttachment[] = [];

      let runningTotal = totalSize;
      let skippedCombined = 0;
      let skippedOversize = 0;

      for (const file of files) {
        // Reject very large single file
        if (file.size > MAX_TOTAL_SIZE) {
          skippedOversize++;
          continue;
        }

        // Reject if total would exceed combined limit
        if (runningTotal + file.size > MAX_TOTAL_SIZE) {
          skippedCombined++;
          continue;
        }

        runningTotal += file.size;

        const objectUrl = URL.createObjectURL(file);

        acceptedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          _size: file.size,
          objectUrl,
          preview: file.type.startsWith("image/") ? objectUrl : undefined,
        });
      }

      if (acceptedFiles.length) {
        setAttachments((prev) => [...prev, ...acceptedFiles]);
      }

      if (skippedOversize) {
        setToast({
          msg: `${skippedOversize} file(s) exceed the 10 MB limit.`,
          sev: "error",
        });
      } else if (skippedCombined) {
        setToast({
          msg: `Combined upload limit is 10 MB. Skipped ${skippedCombined} file(s).`,
          sev: "error",
        });
      }
    },
    [totalSize],
  );

  /* ------------------------------------------------------------
     DROPZONE SETUP
     ------------------------------------------------------------ */
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    noClick: true,
    noKeyboard: true,
    onDropRejected(files) {
      const types = Array.from(new Set(files.map((f) => f.file.type || "unknown")));
      setToast({
        msg: `Unsupported file type${types.length > 1 ? "s" : ""}: ${types.join(", ")}`,
        sev: "warning",
      });
    },
  });

  /* ------------------------------------------------------------
     TYPING HANDLER
     Prevents input from exceeding 1000 words.
     ------------------------------------------------------------ */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;

    if (countWords(next) > MAX_WORDS) {
      setToast({
        msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
        sev: "warning",
      });
      return;
    }

    setText(next);
    resizeTextarea(e.target);
  };

  /* ------------------------------------------------------------
     KEYBOARD HANDLER
     Enter = send
     Shift+Enter = newline
     If streaming, Enter triggers stop
     ------------------------------------------------------------ */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isStreaming && onStop) {
        onStop();
        return;
      }

      handleSend();
    }
  };

  /* ------------------------------------------------------------
     PASTE HANDLER
     1) pasted image -> attachment
     2) pasted text >= 500 words -> .txt attachment
     3) pasted text < 500 words -> inline text, if total <= 1000 words
     ------------------------------------------------------------ */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    // STEP 1: pasted image support
    const imageFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();

        if (file) {
          const ext = file.type.split("/")[1] || "png";

          const namedImage = new File(
            [file],
            file.name && file.name !== "image.png"
              ? file.name
              : `pasted-${Date.now()}.${ext}`,
            { type: file.type },
          );

          imageFiles.push(namedImage);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      onDrop(imageFiles);

      setToast({
        msg: `Pasted ${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} from clipboard.`,
        sev: "success",
      });

      return;
    }

    // STEP 2: pasted text support
    const pasted = e.clipboardData.getData("text");

    if (!pasted) return;

    const pastedWordCount = countWords(pasted);

    // Large pasted text becomes a .txt attachment
    if (pastedWordCount >= PASTE_TO_FILE_WORD_THRESHOLD) {
      e.preventDefault();

      const fileName = getNextPastedFileName();
      const blob = new Blob([pasted], { type: "text/plain" });

      if (totalSize + blob.size > MAX_TOTAL_SIZE) {
        setToast({
          msg: `Cannot add ${fileName}. Combined upload limit is 10 MB.`,
          sev: "error",
        });
        return;
      }

      const objectUrl = URL.createObjectURL(blob);

      setAttachments((prev) => [
        ...prev,
        {
          name: fileName,
          size: blob.size,
          type: "text/plain",
          _size: blob.size,
          objectUrl,
          rawText: pasted,
          textPreview: pasted.slice(0, 400),
        },
      ]);

      setToast({
        msg: `${fileName} created from pasted text.`,
        sev: "success",
      });

      return;
    }

    // Small pasted text stays inline if total remains within 1000 words
    const textarea = e.currentTarget;
    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const projectedText = text.slice(0, start) + pasted + text.slice(end);

    if (countWords(projectedText) > MAX_WORDS) {
      e.preventDefault();

      setToast({
        msg: `Only ${MAX_WORDS} words are allowed in the text field.`,
        sev: "warning",
      });
    }
  };

  /* ------------------------------------------------------------
     SEND HANDLER
     IMPORTANT FIX:
     We keep preview/objectUrl/rawText when sending.
     We only remove _size because that is local UI-only data.
     Also we DO NOT revoke object URLs immediately after send,
     because MessageBubble still needs them for preview.
     ------------------------------------------------------------ */
  const handleSend = () => {
    if (!canSend) return;

    onSend(
      text.trim(),
      attachments.map(({ _size, ...rest }) => rest),
    );

    // Reset input state after send
    setText("");
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  /* ------------------------------------------------------------
     REMOVE ATTACHMENT
     Safe to revoke object URL here because the user removed it
     before sending.
     ------------------------------------------------------------ */
  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index];

      if (removed?.objectUrl) {
        URL.revokeObjectURL(removed.objectUrl);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  /* ------------------------------------------------------------
     VISUAL HELPERS
     Keeps your existing UI style.
     ------------------------------------------------------------ */
  const inputShellBg = isHero
    ? mode === "dark"
      ? alpha("#fff", 0.04)
      : "#ffffff"
    : palette.bgInput;

  const focusRing =
    mode === "dark" && isHero
      ? `0 0 0 1px ${alpha(palette.primary, 0.45)}, 0 0 0 2px ${alpha(
          palette.primary,
          0.18,
        )}, 0 1px 10px ${alpha("#000", 0.25)}`
      : `0 0 0 2px ${palette.primarySoft}`;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Box
      {...getRootProps()}
      sx={{
        px: isHero ? 0 : 3,
        py: isHero ? 0 : 2,
        borderTop: isHero ? "none" : "1px solid",
        borderColor: palette.border,
        bgcolor: isDragActive ? palette.primarySoft : isHero ? "transparent" : palette.bgChat,
        transition: "background-color 0.2s",
      }}
    >
      {/* Hidden file input */}
      <input {...getInputProps()} />

      {/* Drag-drop helper */}
      {isDragActive && (
        <Box
          sx={{
            p: 2,
            mb: 1.5,
            border: "2px dashed",
            borderColor: palette.primary,
            borderRadius: "8px",
            textAlign: "center",
            bgcolor: palette.primarySoft,
          }}
        >
          <Typography sx={{ color: palette.primary, fontSize: 13 }}>
            Drop files here…
          </Typography>
        </Box>
      )}

      {/* ========================================================
          ATTACHMENTS STRIP
          Scrolls horizontally if many attachments are present.
         ======================================================== */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 1.25 }}>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "nowrap",
              overflowX: "auto",
              overflowY: "hidden",
              pb: 0.5,
              justifyContent: "flex-start",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-thumb": {
                background: palette.scrollbarThumb,
                borderRadius: 999,
              },
            }}
          >
            {attachments.map((file, index) => (
              <Box
                key={`${file.name}-${index}`}
                onClick={() => {
                  // Image preview before send
                  if (file.preview) {
                    setFilePreview({
                      url: file.preview,
                      type: file.type || "",
                      name: file.name,
                    });
                    return;
                  }

                  // Text preview before send
                  if (file.rawText) {
                    setFilePreview({
                      type: "text/plain",
                      name: file.name,
                      rawText: file.rawText,
                    });
                    return;
                  }

                  // PDF or generic file preview before send
                  if (file.objectUrl) {
                    setFilePreview({
                      url: file.objectUrl,
                      type: file.type || "",
                      name: file.name,
                    });
                  }
                }}
                sx={{
                  position: "relative",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: palette.border,
                  bgcolor: palette.bgInput,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  flexShrink: 0,
                  ...(file.preview
                    ? {
                        width: 80,
                        height: 80,
                      }
                    : {
                        px: 1.5,
                        py: 0.75,
                        minWidth: 180,
                      }),
                }}
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <>
                    <InsertDriveFileIcon
                      sx={{
                        fontSize: 16,
                        color: palette.textMuted,
                      }}
                    />

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: palette.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 140,
                        }}
                      >
                        {file.name}
                      </Typography>

                      <Typography sx={{ fontSize: 10, color: palette.textMuted }}>
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Remove attachment before send */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAttachment(index);
                  }}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    bgcolor: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.75)",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* Combined attachment usage */}
          <Typography
            sx={{
              fontSize: 10.5,
              color: palette.textMuted,
              mt: 0.5,
              textAlign: isHero ? "center" : "left",
            }}
          >
            {formatFileSize(totalSize)} / 10 MB used
          </Typography>
        </Box>
      )}

      {/* ========================================================
          MAIN INPUT SHELL
         ======================================================== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          bgcolor: inputShellBg,
          borderRadius: isHero ? "16px" : "14px",
          border: "1px solid",
          borderColor: palette.border,
          px: isHero ? 2 : 1.5,
          py: isHero ? 1.5 : 1,
          minHeight: isHero ? 120 : undefined,
          transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
          ...(isHero && mode === "dark"
            ? {
                boxShadow: `0 0 0 1px ${alpha(
                  palette.border,
                  0.9,
                )}, 0 1px 8px ${alpha("#000", 0.28)}, inset 0 1px 0 ${alpha(
                  palette.primary,
                  0.14,
                )}`,
              }
            : isHero && mode === "light"
              ? {
                  boxShadow: `0 1px 3px ${alpha("#000", 0.06)}, inset 0 1px 0 ${alpha(
                    palette.primary,
                    0.12,
                  )}`,
                }
              : {}),
          "&:focus-within": {
            borderColor: palette.primary,
            boxShadow: focusRing,
          },
        }}
      >
        {/* Attach file button */}
        <Tooltip title="Attach file (10 MB total max)">
          <IconButton
            size="small"
            onClick={open}
            sx={{
              color: palette.textMuted,
              "&:hover": {
                color: palette.primary,
              },
            }}
          >
            <AttachFileIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={resolvedPlaceholder}
          disabled={disabled && !isStreaming}
          rows={isHero ? 4 : MIN_ROWS}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: palette.textPrimary,
            fontSize: isHero ? "0.9375rem" : "0.9rem",
            fontFamily: '"Inter", -apple-system, sans-serif',
            lineHeight: 1.55,
            maxHeight: maxTextHeight,
            minHeight: isHero ? 88 : undefined,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        />

        {/* Send or Stop button */}
        <Tooltip title={isStreaming ? "Stop generation" : "Send (Enter)"}>
          <span>
            {isStreaming ? (
              <IconButton
                onClick={onStop}
                disabled={!onStop}
                sx={{
                  bgcolor: palette.error,
                  color: "#fff",
                  width: isHero ? 40 : 34,
                  height: isHero ? 40 : 34,
                  borderRadius: "10px",
                  "&:hover": {
                    bgcolor: palette.error,
                    opacity: 0.92,
                  },
                  "&.Mui-disabled": {
                    bgcolor: palette.border,
                    color: palette.textMuted,
                  },
                }}
              >
                <StopCircleOutlinedIcon sx={{ fontSize: isHero ? 18 : 16 }} />
              </IconButton>
            ) : (
              <IconButton
                onClick={handleSend}
                disabled={disabled || !canSend}
                sx={{
                  bgcolor: palette.primary,
                  color: palette.textOnPrimary,
                  width: isHero ? 40 : 34,
                  height: isHero ? 40 : 34,
                  borderRadius: "10px",
                  "&:hover": {
                    bgcolor: palette.primaryHover,
                  },
                  "&.Mui-disabled": {
                    bgcolor: palette.border,
                    color: palette.textMuted,
                  },
                }}
              >
                <SendIcon sx={{ fontSize: isHero ? 18 : 16 }} />
              </IconButton>
            )}
          </span>
        </Tooltip>
      </Box>

      {/* Word counter */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            color:
              currentWordCount > MAX_WORDS * 0.9
                ? palette.warning
                : palette.textMuted,
          }}
        >
          {currentWordCount} / {MAX_WORDS} words
        </Typography>
      </Box>

      {/* Hero helper text */}
      {isHero && (
        <Typography
          sx={{
            fontSize: 11,
            color: palette.textMuted,
            textAlign: "center",
            mt: 1.5,
          }}
        >
          Shift+Enter for a new line · Enter to send
        </Typography>
      )}

      {/* ========================================================
          PREVIEW DIALOG
         ======================================================== */}
      <Dialog
        open={Boolean(filePreview)}
        onClose={() => setFilePreview(null)}
        maxWidth="md"
        fullWidth
      >
        {filePreview && (
          <DialogTitle sx={{ fontSize: 15 }}>
            {filePreview.name}
          </DialogTitle>
        )}

        <DialogContent sx={{ p: 1, pt: 0, bgcolor: palette.bgChat }}>
          {filePreview?.type === "application/pdf" && filePreview.url ? (
            <Box
              component="iframe"
              title={filePreview.name}
              src={filePreview.url}
              sx={{
                width: "100%",
                height: { xs: "60vh", sm: "72vh" },
                border: "none",
                borderRadius: 1,
              }}
            />
          ) : filePreview?.type === "text/plain" && filePreview.rawText ? (
            <Box
              sx={{
                maxHeight: "72vh",
                overflow: "auto",
                border: "1px solid",
                borderColor: palette.border,
                borderRadius: 1.5,
                bgcolor: palette.bgInput,
                p: 2,
              }}
            >
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: palette.textPrimary,
                }}
              >
                {filePreview.rawText}
              </Typography>
            </Box>
          ) : filePreview?.url ? (
            <img
              src={filePreview.url}
              alt={filePreview.name}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.sev}
            onClose={() => setToast(null)}
            sx={{ fontSize: 12 }}
          >
            {toast.msg}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </Box>
  );
};

export default ChatInput;