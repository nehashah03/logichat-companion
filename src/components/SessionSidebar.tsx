// // import React, { useCallback, useMemo, useState } from 'react';
// // import {
// //   Box, List, ListItemButton, ListItemText, Typography, IconButton,
// //   Button, Divider, Dialog, DialogTitle, DialogContent,
// //   DialogContentText, DialogActions, TextField, InputAdornment, Menu, MenuItem,
// //   ListItemIcon, Tooltip, Collapse,
// // } from '@mui/material';
// // import AddIcon from '@mui/icons-material/Add';
// // import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
// // import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
// // import MoreVertIcon from '@mui/icons-material/MoreVert';
// // import SearchIcon from '@mui/icons-material/Search';
// // import StarIcon from '@mui/icons-material/Star';
// // import StarBorderIcon from '@mui/icons-material/StarBorder';
// // import EditIcon from '@mui/icons-material/Edit';
// // import DownloadIcon from '@mui/icons-material/Download';
// // import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
// // import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
// // import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// // import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// // import { useAppDispatch, useAppSelector } from '../store/hooks';
// // import {
// //   createSession, setActiveSession, deleteSession,
// //   renameSession, toggleFavorite,
// // } from '../features/session/sessionSlice';
// // import { loadMessages, clearMessages } from '../features/chat/chatSlice';
// // import { generateId, formatTimestamp } from '../utils/helpers';
// // import { exportSession, searchSessions, ExportFormat } from '../utils/sessionExport';
// // import { useThemeMode } from '../contexts/ThemeModeContext';
// // import type { Session } from '../features/session/sessionSlice';

// // const SessionSidebar: React.FC = () => {
// //   const dispatch = useAppDispatch();
// //   const { sessions, activeSessionId } = useAppSelector(s => s.session);
// //   const { palette, mode, toggle } = useThemeMode();

// //   const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
// //   const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
// //   const [exportAnchor, setExportAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
// //   const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
// //   const [search, setSearch] = useState('');
// //   const [favOpen, setFavOpen] = useState(true);
// //   const [allOpen, setAllOpen] = useState(true);

// //   const filtered = useMemo(() => searchSessions(sessions, search), [sessions, search]);
// //   const favorites = useMemo(() => filtered.filter(s => s.favorite), [filtered]);
// //   const others = useMemo(() => filtered.filter(s => !s.favorite), [filtered]);

// //   const handleNewChat = useCallback(() => {
// //     const session: Session = {
// //       id: generateId(),
// //       title: 'New Conversation',
// //       createdAt: Date.now(),
// //       updatedAt: Date.now(),
// //       messages: [],
// //     };
// //     dispatch(createSession(session));
// //     dispatch(clearMessages());
// //   }, [dispatch]);

// //   const handleSelectSession = useCallback((id: string) => {
// //     const session = sessions.find(s => s.id === id);
// //     if (session) {
// //       dispatch(setActiveSession(id));
// //       dispatch(loadMessages(session.messages));
// //     }
// //   }, [dispatch, sessions]);

// //   const handleConfirmDelete = useCallback(() => {
// //     if (deleteTarget) {
// //       dispatch(deleteSession(deleteTarget));
// //       if (deleteTarget === activeSessionId) dispatch(clearMessages());
// //       setDeleteTarget(null);
// //     }
// //   }, [deleteTarget, activeSessionId, dispatch]);

// //   const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
// //     e.stopPropagation();
// //     setMenuAnchor({ el: e.currentTarget, id });
// //   };
// //   const closeMenu = () => setMenuAnchor(null);

// //   const handleRenameClick = () => {
// //     if (!menuAnchor) return;
// //     const s = sessions.find(x => x.id === menuAnchor.id);
// //     if (s) setRenameTarget({ id: s.id, title: s.title });
// //     closeMenu();
// //   };
// //   const handleRenameSave = () => {
// //     if (renameTarget) dispatch(renameSession({ id: renameTarget.id, title: renameTarget.title }));
// //     setRenameTarget(null);
// //   };

// //   const handleFavoriteClick = () => {
// //     if (menuAnchor) dispatch(toggleFavorite(menuAnchor.id));
// //     closeMenu();
// //   };
// //   const handleDeleteClick = () => {
// //     if (menuAnchor) setDeleteTarget(menuAnchor.id);
// //     closeMenu();
// //   };
// //   const handleExportClick = (e: React.MouseEvent<HTMLElement>) => {
// //     if (menuAnchor) setExportAnchor({ el: e.currentTarget, id: menuAnchor.id });
// //     closeMenu();
// //   };
// //   const handleExportFormat = (fmt: ExportFormat) => {
// //     if (exportAnchor) {
// //       const s = sessions.find(x => x.id === exportAnchor.id);
// //       if (s) exportSession(s, fmt);
// //     }
// //     setExportAnchor(null);
// //   };

// //   const renderItem = (session: Session) => (
// //     <ListItemButton
// //       key={session.id}
// //       selected={session.id === activeSessionId}
// //       onClick={() => handleSelectSession(session.id)}
// //       sx={{
// //         borderRadius: '6px', mb: 0.25, px: 1.25, py: 0.75, minHeight: 44,
// //         '&.Mui-selected': { bgcolor: palette.bgSelected },
// //         '&.Mui-selected:hover': { bgcolor: palette.bgSelected },
// //         '&:hover': { bgcolor: palette.bgHover },
// //         '& .row-actions': { opacity: 0 },
// //         '&:hover .row-actions': { opacity: 1 },
// //       }}
// //     >
// //       {session.favorite
// //         ? <StarIcon sx={{ fontSize: 14, mr: 1.25, color: palette.warning }} />
// //         : <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 1.25, color: palette.textMuted }} />}
// //       <ListItemText
// //         primary={session.title}
// //         secondary={formatTimestamp(session.updatedAt)}
// //         primaryTypographyProps={{ noWrap: true, fontSize: 12.5, fontWeight: 500, color: palette.textPrimary }}
// //         secondaryTypographyProps={{ fontSize: 10.5, color: palette.textMuted }}
// //       />
// //       <IconButton
// //         className="row-actions" size="small"
// //         onClick={(e) => openMenu(e, session.id)}
// //         sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}
// //       >
// //         <MoreVertIcon sx={{ fontSize: 16 }} />
// //       </IconButton>
// //     </ListItemButton>
// //   );

// //   return (
// //     <Box sx={{
// //       width: 280, height: '100vh', display: 'flex', flexDirection: 'column',
// //       bgcolor: palette.bgSidebar, borderRight: '1px solid', borderColor: palette.border,
// //     }}>
// //       {/* Header */}
// //       <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
// //         <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textSecondary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
// //           Chats
// //         </Typography>
// //         <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'Light'} theme`}>
// //           <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
// //             {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
// //           </IconButton>
// //         </Tooltip>
// //       </Box>

// //       {/* New Chat */}
// //       <Box sx={{ px: 1.5, pb: 1 }}>
// //         <Button
// //           fullWidth variant="contained" disableElevation
// //           startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
// //           onClick={handleNewChat}
// //           sx={{
// //             justifyContent: 'center', fontSize: 13, py: 0.85,
// //             bgcolor: palette.primary, color: palette.textOnPrimary,
// //             '&:hover': { bgcolor: palette.primaryHover },
// //           }}
// //         >
// //           New Chat
// //         </Button>
// //       </Box>

// //       {/* Search */}
// //       <Box sx={{ px: 1.5, pb: 1 }}>
// //         <TextField
// //           fullWidth size="small" placeholder="Search chats…"
// //           value={search} onChange={(e) => setSearch(e.target.value)}
// //           InputProps={{
// //             startAdornment: (
// //               <InputAdornment position="start">
// //                 <SearchIcon sx={{ fontSize: 16, color: palette.textMuted }} />
// //               </InputAdornment>
// //             ),
// //             sx: {
// //               fontSize: 12.5, bgcolor: palette.bgInput, color: palette.textPrimary,
// //               '& fieldset': { borderColor: palette.border },
// //               '&:hover fieldset': { borderColor: palette.borderStrong },
// //             },
// //           }}
// //         />
// //       </Box>

// //       <Divider sx={{ borderColor: palette.border }} />

// //       {/* Lists */}
// //       <Box sx={{ flex: 1, overflow: 'auto', px: 0.75, py: 0.75 }}>
// //         {favorites.length > 0 && (
// //           <>
// //             <Box
// //               onClick={() => setFavOpen(o => !o)}
// //               sx={{
// //                 display: 'flex', alignItems: 'center', px: 1.25, py: 0.5, cursor: 'pointer',
// //                 color: palette.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
// //                 letterSpacing: '0.5px', userSelect: 'none',
// //               }}
// //             >
// //               {favOpen ? <ExpandLessIcon sx={{ fontSize: 14, mr: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 14, mr: 0.5 }} />}
// //               Favorites ({favorites.length})
// //             </Box>
// //             <Collapse in={favOpen}>
// //               <List dense disablePadding>{favorites.map(renderItem)}</List>
// //             </Collapse>
// //           </>
// //         )}

// //         <Box
// //           onClick={() => setAllOpen(o => !o)}
// //           sx={{
// //             display: 'flex', alignItems: 'center', px: 1.25, py: 0.5, mt: favorites.length ? 1 : 0,
// //             cursor: 'pointer', color: palette.textMuted, fontSize: 11, fontWeight: 600,
// //             textTransform: 'uppercase', letterSpacing: '0.5px', userSelect: 'none',
// //           }}
// //         >
// //           {allOpen ? <ExpandLessIcon sx={{ fontSize: 14, mr: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 14, mr: 0.5 }} />}
// //           Recent ({others.length})
// //         </Box>
// //         <Collapse in={allOpen}>
// //           <List dense disablePadding>{others.map(renderItem)}</List>
// //         </Collapse>

// //         {filtered.length === 0 && (
// //           <Box sx={{ p: 3, textAlign: 'center' }}>
// //             <Typography sx={{ color: palette.textMuted, fontSize: 12 }}>
// //               {search ? 'No matches' : 'No conversations yet'}
// //             </Typography>
// //           </Box>
// //         )}
// //       </Box>

// //       {/* Per-chat menu */}
// //       <Menu
// //         anchorEl={menuAnchor?.el ?? null}
// //         open={!!menuAnchor}
// //         onClose={closeMenu}
// //         PaperProps={{ sx: { minWidth: 170 } }}
// //       >
// //         <MenuItem onClick={handleRenameClick} sx={{ fontSize: 13 }}>
// //           <ListItemIcon><EditIcon sx={{ fontSize: 16 }} /></ListItemIcon>
// //           Rename
// //         </MenuItem>
// //         <MenuItem onClick={handleFavoriteClick} sx={{ fontSize: 13 }}>
// //           <ListItemIcon>
// //             {sessions.find(s => s.id === menuAnchor?.id)?.favorite
// //               ? <StarIcon sx={{ fontSize: 16, color: palette.warning }} />
// //               : <StarBorderIcon sx={{ fontSize: 16 }} />}
// //           </ListItemIcon>
// //           {sessions.find(s => s.id === menuAnchor?.id)?.favorite ? 'Remove favorite' : 'Add to favorites'}
// //         </MenuItem>
// //         <MenuItem onClick={handleExportClick} sx={{ fontSize: 13 }}>
// //           <ListItemIcon><DownloadIcon sx={{ fontSize: 16 }} /></ListItemIcon>
// //           Export…
// //         </MenuItem>
// //         <Divider />
// //         <MenuItem onClick={handleDeleteClick} sx={{ fontSize: 13, color: palette.error }}>
// //           <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16, color: palette.error }} /></ListItemIcon>
// //           Delete
// //         </MenuItem>
// //       </Menu>

// //       {/* Export submenu */}
// //       <Menu
// //         anchorEl={exportAnchor?.el ?? null}
// //         open={!!exportAnchor}
// //         onClose={() => setExportAnchor(null)}
// //       >
// //         <MenuItem sx={{ fontSize: 13 }} onClick={() => handleExportFormat('md')}>Markdown (.md)</MenuItem>
// //         <MenuItem sx={{ fontSize: 13 }} onClick={() => handleExportFormat('txt')}>Plain text (.txt)</MenuItem>
// //         <MenuItem sx={{ fontSize: 13 }} onClick={() => handleExportFormat('json')}>JSON (.json)</MenuItem>
// //       </Menu>

// //       {/* Rename dialog */}
// //       <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
// //         <DialogTitle sx={{ fontSize: 15 }}>Rename conversation</DialogTitle>
// //         <DialogContent>
// //           <TextField
// //             autoFocus fullWidth size="small" value={renameTarget?.title || ''}
// //             onChange={(e) => setRenameTarget(t => t ? { ...t, title: e.target.value } : t)}
// //             onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); }}
// //           />
// //         </DialogContent>
// //         <DialogActions>
// //           <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
// //           <Button onClick={handleRenameSave} variant="contained">Save</Button>
// //         </DialogActions>
// //       </Dialog>

// //       {/* Delete confirmation */}
// //       <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
// //         <DialogTitle sx={{ fontSize: 15 }}>Delete conversation?</DialogTitle>
// //         <DialogContent>
// //           <DialogContentText sx={{ fontSize: 13 }}>
// //             This will permanently delete this conversation. This action cannot be undone.
// //           </DialogContentText>
// //         </DialogContent>
// //         <DialogActions>
// //           <Button onClick={() => setDeleteTarget(null)} sx={{ color: palette.textSecondary }}>No</Button>
// //           <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small">Yes, Delete</Button>
// //         </DialogActions>
// //       </Dialog>
// //     </Box>
// //   );
// // };

// // export default SessionSidebar;

// import React, { useCallback, useMemo, useState, useRef, useEffect, memo } from "react";
// import {
//   Box,
//   List,
//   ListItemButton,
//   Typography,
//   IconButton,
//   Button,
//   Divider,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
//   TextField,
//   InputAdornment,
//   Tooltip,
//   Menu,
//   MenuItem,
//   ListItemText,
//   Collapse,
//   Chip,
//   ListItemIcon,
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
// import SearchIcon from "@mui/icons-material/Search";
// import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
// import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import EditIcon from "@mui/icons-material/Edit";
// import DownloadIcon from "@mui/icons-material/Download";
// import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
// import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import ExpandLessIcon from "@mui/icons-material/ExpandLess";
// import StarBorderIcon from "@mui/icons-material/StarBorder";
// import StarIcon from "@mui/icons-material/Star";
// import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// import { alpha } from "@mui/material/styles";

// import { useAppDispatch, useAppSelector } from "../store/hooks";
// import {
//   createSession,
//   setActiveSession,
//   deleteSession,
//   renameSession,
//   toggleFavorite,
// } from "../features/session/sessionSlice";
// import { loadMessages, clearMessages } from "../features/chat/chatSlice";
// import { generateId, formatTimestamp } from "../utils/helpers";
// import { exportSession, searchSessions, ExportFormat } from "../utils/sessionExport";
// import { useThemeMode } from "../contexts/ThemeModeContext";
// import type { Session } from "../features/session/sessionSlice";

// const EXPANDED_W = 300;
// const COLLAPSED_W = 72;

// function Kbd({ children }: { children: React.ReactNode }) {
//   return (
//     <Chip
//       label={children}
//       size="small"
//       sx={{
//         height: 22,
//         fontSize: 10,
//         fontFamily: "ui-monospace, monospace",
//         bgcolor: (t) => alpha(t.palette.text.primary, 0.08),
//         color: "text.secondary",
//         border: "1px solid",
//         borderColor: "divider",
//         "& .MuiChip-label": { px: 0.75 },
//       }}
//     />
//   );
// }

// function ChatRowInner({
//   session,
//   activeSessionId,
//   expanded,
//   onSelect,
//   onMenu,
//   palette,
// }: {
//   session: Session;
//   activeSessionId: string | null;
//   expanded: boolean;
//   onSelect: (id: string) => void;
//   onMenu: (e: React.MouseEvent<HTMLElement>, id: string) => void;
//   palette: any;
// }) {
//   return (
//     <ListItemButton
//       selected={session.id === activeSessionId}
//       onClick={() => onSelect(session.id)}
//       sx={{
//         borderRadius: 1.5,
//         py: 0.85,
//         px: 1,
//         mb: 0.25,
//         alignItems: "flex-start",
//         "&.Mui-selected": {
//           bgcolor: palette.bgSelected,
//         },
//         "&.Mui-selected:hover": {
//           bgcolor: palette.bgSelected,
//         },
//         "&:hover": { bgcolor: palette.bgHover },
//       }}
//     >
//       <ListItemText
//         primary={
//           <Typography
//             noWrap
//             sx={{
//               fontSize: 13,
//               fontWeight: 500,
//               color: palette.textPrimary,
//               lineHeight: 1.35,
//             }}
//           >
//             {session.title}
//           </Typography>
//         }
//         secondary={formatTimestamp(session.updatedAt)}
//         primaryTypographyProps={{ component: "div" }}
//         secondaryTypographyProps={{
//           fontSize: 10.5,
//           color: palette.textMuted,
//           sx: { mt: 0.25 },
//         }}
//         sx={{ mr: 0.5, minWidth: 0, my: 0 }}
//       />
//       {expanded && (
//         <IconButton
//           size="small"
//           onClick={(e) => {
//             e.stopPropagation();
//             onMenu(e, session.id);
//           }}
//           sx={{ color: palette.textMuted, mt: -0.25 }}
//         >
//           <MoreVertIcon sx={{ fontSize: 18 }} />
//         </IconButton>
//       )}
//     </ListItemButton>
//   );
// }

// const ChatRow = memo(ChatRowInner, (prev, next) => {
//   return (
//     prev.session.id === next.session.id &&
//     prev.session.title === next.session.title &&
//     prev.session.favorite === next.session.favorite &&
//     prev.session.updatedAt === next.session.updatedAt &&
//     prev.activeSessionId === next.activeSessionId &&
//     prev.expanded === next.expanded &&
//     prev.palette === next.palette
//   );
// });

// function SectionHeader({
//   title,
//   open,
//   onToggle,
//   palette,
// }: {
//   title: string;
//   open: boolean;
//   onToggle: () => void;
//   palette: any;
// }) {
//   return (
//     <ListItemButton
//       onClick={onToggle}
//       sx={{
//         py: 0.5,
//         px: 1,
//         borderRadius: 1,
//         minHeight: 36,
//         "&:hover": { bgcolor: alpha(palette.textPrimary, 0.04) },
//       }}
//     >
//       {open ? (
//         <ExpandLessIcon sx={{ fontSize: 18, color: palette.textSecondary, mr: 0.75 }} />
//       ) : (
//         <ExpandMoreIcon sx={{ fontSize: 18, color: palette.textSecondary, mr: 0.75 }} />
//       )}
//       <Typography
//         sx={{
//           fontSize: 11.5,
//           fontWeight: 700,
//           letterSpacing: 0.6,
//           color: palette.textSecondary,
//           textTransform: "uppercase",
//         }}
//       >
//         {title}
//       </Typography>
//     </ListItemButton>
//   );
// }

// const SessionSidebar: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const { sessions, activeSessionId } = useAppSelector((s) => s.session);
//   const { palette, mode, toggle } = useThemeMode();

//   const [expanded, setExpanded] = useState(true);
//   const [search, setSearch] = useState("");
//   const [favOpen, setFavOpen] = useState(true);
//   const [recentOpen, setRecentOpen] = useState(true);
//   const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
//   const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
//   const [exportAnchor, setExportAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
//   const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);

//   const searchInputRef = useRef<HTMLInputElement | null>(null);

//   const filtered = useMemo(() => searchSessions(sessions, search), [sessions, search]);
//   const favorites = useMemo(() => filtered.filter((s) => s.favorite), [filtered]);
//   const recents = useMemo(() => filtered.filter((s) => !s.favorite), [filtered]);

//   const expandAndFocusSearch = useCallback(() => {
//     setExpanded(true);
//     requestAnimationFrame(() => searchInputRef.current?.focus());
//   }, []);

//   const handleNewChat = useCallback(() => {
//     const session: Session = {
//       id: generateId(),
//       title: "New Conversation",
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//       messages: [],
//     };
//     dispatch(createSession(session));
//     dispatch(clearMessages());
//   }, [dispatch]);

//   const handleSelectSession = useCallback(
//     (id: string) => {
//       const session = sessions.find((s) => s.id === id);
//       if (!session) return;
//       dispatch(setActiveSession(id));
//       dispatch(loadMessages(session.messages));
//     },
//     [dispatch, sessions],
//   );

//   const handleConfirmDelete = useCallback(() => {
//     if (!deleteTarget) return;
//     dispatch(deleteSession(deleteTarget));
//     if (deleteTarget === activeSessionId) {
//       dispatch(clearMessages());
//     }
//     setDeleteTarget(null);
//   }, [deleteTarget, activeSessionId, dispatch]);

//   const openMenu = useCallback((e: React.MouseEvent<HTMLElement>, id: string) => {
//     setMenuAnchor({ el: e.currentTarget, id });
//   }, []);

//   const closeMenu = () => setMenuAnchor(null);

//   const handleRenameClick = () => {
//     if (!menuAnchor) return;
//     const s = sessions.find((x) => x.id === menuAnchor.id);
//     if (s) setRenameTarget({ id: s.id, title: s.title });
//     closeMenu();
//   };

//   const handleRenameSave = () => {
//     if (renameTarget) {
//       dispatch(renameSession({ id: renameTarget.id, title: renameTarget.title.trim() || "Untitled chat" }));
//     }
//     setRenameTarget(null);
//   };

//   const handleFavoriteClick = () => {
//     if (menuAnchor) dispatch(toggleFavorite(menuAnchor.id));
//     closeMenu();
//   };

//   const handleDeleteClick = () => {
//     if (menuAnchor) setDeleteTarget(menuAnchor.id);
//     closeMenu();
//   };

//   const handleExportClick = (e: React.MouseEvent<HTMLElement>) => {
//     if (menuAnchor) setExportAnchor({ el: e.currentTarget, id: menuAnchor.id });
//     closeMenu();
//   };

//   const handleExportFormat = (fmt: ExportFormat) => {
//     if (exportAnchor) {
//       const s = sessions.find((x) => x.id === exportAnchor.id);
//       if (s) exportSession(s, fmt);
//     }
//     setExportAnchor(null);
//   };

//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.defaultPrevented) return;
//       const mod = e.ctrlKey || e.metaKey;
//       if (mod && e.key.toLowerCase() === "n") {
//         e.preventDefault();
//         handleNewChat();
//       }
//       if (mod && e.key.toLowerCase() === "o") {
//         e.preventDefault();
//         expandAndFocusSearch();
//       }
//     };

//     window.addEventListener("keydown", onKey, true);
//     return () => window.removeEventListener("keydown", onKey, true);
//   }, [handleNewChat, expandAndFocusSearch]);

//   const w = expanded ? EXPANDED_W : COLLAPSED_W;
//   const isDark = mode === "dark";
//   const accentIcon = isDark ? "#fb923c" : palette.primary;
//   const brandLogoBg = isDark
//     ? `linear-gradient(145deg, ${palette.primary} 0%, ${palette.userAvatar || palette.primary} 100%)`
//     : palette.primary;

//   const actionRowSx = {
//     display: "flex",
//     alignItems: "center",
//     gap: 1,
//     px: 1.5,
//     py: 0.85,
//     borderRadius: 1.5,
//     cursor: "pointer",
//     color: palette.textPrimary,
//     "&:hover": { bgcolor: alpha(palette.textPrimary, 0.06) },
//   };

//   return (
//     <Box
//       sx={{
//         position: "relative",
//         flexShrink: 0,
//         height: "100%",
//         minHeight: 0,
//         width: w,
//         transition: "width 220ms ease-out",
//         bgcolor: palette.bgSidebar,
//         borderRight: "1px solid",
//         borderColor: palette.border,
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {expanded ? (
//         <Box
//           sx={{
//             px: 1.5,
//             py: 1.25,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 1,
//             minHeight: 52,
//           }}
//         >
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
//             <Box
//               sx={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: "8px",
//                 background: brandLogoBg,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 flexShrink: 0,
//               }}
//             >
//               <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 20 }} />
//             </Box>
//             <Typography
//               sx={{
//                 fontWeight: 600,
//                 fontSize: 15,
//                 color: palette.textPrimary,
//                 letterSpacing: "-0.02em",
//               }}
//             >
//               Logic Chat
//             </Typography>
//           </Box>

//           <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
//             <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} theme`}>
//               <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
//                 {mode === "light" ? (
//                   <DarkModeOutlinedIcon fontSize="small" />
//                 ) : (
//                   <LightModeOutlinedIcon fontSize="small" />
//                 )}
//               </IconButton>
//             </Tooltip>

//             <Tooltip title="Collapse sidebar" placement="bottom">
//               <IconButton
//                 size="small"
//                 onClick={() => setExpanded(false)}
//                 sx={{ color: palette.textSecondary }}
//                 aria-label="Toggle sidebar"
//               >
//                 <ViewSidebarIcon fontSize="small" />
//               </IconButton>
//             </Tooltip>
//           </Box>
//         </Box>
//       ) : (
//         <Box
//           sx={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             gap: 0.75,
//             py: 1.25,
//             px: 0.5,
//           }}
//         >
//           <Tooltip title="Logic Chat" placement="right">
//             <Box
//               sx={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: "8px",
//                 background: brandLogoBg,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 flexShrink: 0,
//               }}
//             >
//               <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 20 }} />
//             </Box>
//           </Tooltip>

//           <Tooltip title="New chat" placement="right">
//             <IconButton onClick={handleNewChat} size="small" sx={{ color: accentIcon }}>
//               <AddIcon />
//             </IconButton>
//           </Tooltip>

//           <Tooltip title="Search chats (Ctrl+O)" placement="right">
//             <IconButton onClick={expandAndFocusSearch} size="small" sx={{ color: palette.textSecondary }}>
//               <SearchIcon />
//             </IconButton>
//           </Tooltip>

//           <Tooltip title="Open chat list" placement="right">
//             <IconButton
//               onClick={() => setExpanded(true)}
//               sx={{
//                 width: 44,
//                 height: 44,
//                 borderRadius: "50%",
//                 background: brandLogoBg,
//                 color: "#fff",
//                 "&:hover": { opacity: 0.95 },
//               }}
//             >
//               <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       )}

//       <Divider sx={{ borderColor: palette.border }} />

//       {expanded && (
//         <>
//           <Box sx={{ px: 1, pt: 1, pb: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
//             <Box
//               component="button"
//               type="button"
//               sx={{ ...actionRowSx, border: "none", background: "none", width: "100%", textAlign: "left" }}
//               onClick={handleNewChat}
//             >
//               <AddIcon sx={{ fontSize: 20, color: accentIcon }} />
//               <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>New chat</Typography>
//             </Box>

//             <Box
//               component="button"
//               type="button"
//               sx={{ ...actionRowSx, border: "none", background: "none", width: "100%", textAlign: "left" }}
//               onClick={expandAndFocusSearch}
//             >
//               <SearchIcon sx={{ fontSize: 20, color: palette.textSecondary }} />
//               <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Search chats</Typography>
//               <Kbd>Ctrl+O</Kbd>
//             </Box>

//             <Tooltip title="Coming soon">
//               <Box sx={{ ...actionRowSx, opacity: 0.55, cursor: "default" }}>
//                 <PhotoLibraryOutlinedIcon sx={{ fontSize: 20, color: palette.textSecondary }} />
//                 <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Library</Typography>
//               </Box>
//             </Tooltip>
//           </Box>

//           <Box sx={{ px: 1.5, pb: 1 }}>
//             <TextField
//               inputRef={searchInputRef}
//               size="small"
//               fullWidth
//               placeholder="Filter chats…"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon sx={{ fontSize: 18, color: palette.textSecondary }} />
//                   </InputAdornment>
//                 ),
//                 sx: {
//                   fontSize: 13,
//                   bgcolor: palette.bgInput,
//                   color: palette.textPrimary,
//                   borderRadius: 2,
//                   "& fieldset": { borderColor: palette.border },
//                   "&:hover fieldset": { borderColor: palette.borderStrong },
//                 },
//               }}
//             />
//           </Box>

//           <Divider sx={{ borderColor: palette.border, my: 0.5 }} />
//         </>
//       )}

//       <Box
//         sx={{
//           flex: 1,
//           minHeight: 0,
//           overflowY: "auto",
//           overflowX: "hidden",
//           px: expanded ? 0.75 : 0.25,
//           py: 0.5,
//           scrollbarWidth: "thin",
//           "&::-webkit-scrollbar": { width: 6 },
//           "&::-webkit-scrollbar-thumb": {
//             background: alpha(palette.textPrimary, 0.15),
//             borderRadius: 3,
//           },
//         }}
//       >
//         {expanded ? (
//           <>
//             <SectionHeader title="Favorites" open={favOpen} onToggle={() => setFavOpen((o) => !o)} palette={palette} />
//             <Collapse in={favOpen}>
//               <List dense disablePadding sx={{ px: 0.5, pb: 1 }}>
//                 {favorites.length === 0 ? (
//                   <Typography sx={{ fontSize: 11.5, px: 1, py: 0.75, color: palette.textSecondary }}>
//                     Star a chat from the menu to pin it here.
//                   </Typography>
//                 ) : (
//                   favorites.map((session) => (
//                     <ChatRow
//                       key={session.id}
//                       session={session}
//                       activeSessionId={activeSessionId}
//                       expanded
//                       onSelect={handleSelectSession}
//                       onMenu={openMenu}
//                       palette={palette}
//                     />
//                   ))
//                 )}
//               </List>
//             </Collapse>

//             <SectionHeader title="Recent chats" open={recentOpen} onToggle={() => setRecentOpen((o) => !o)} palette={palette} />
//             <Collapse in={recentOpen}>
//               <List dense disablePadding sx={{ px: 0.5, pb: 1 }}>
//                 {recents.length === 0 && filtered.length === 0 ? (
//                   <Typography sx={{ fontSize: 11.5, px: 1, py: 0.75, color: palette.textSecondary }}>
//                     {search.trim() ? "No matches found." : "No chats yet — start with New chat."}
//                   </Typography>
//                 ) : recents.length === 0 ? (
//                   <Typography sx={{ fontSize: 11.5, px: 1, py: 0.75, color: palette.textSecondary }}>
//                     {search.trim() ? "No matches in recent chats." : "All chats are in Favorites."}
//                   </Typography>
//                 ) : (
//                   recents.map((session) => (
//                     <ChatRow
//                       key={session.id}
//                       session={session}
//                       activeSessionId={activeSessionId}
//                       expanded
//                       onSelect={handleSelectSession}
//                       onMenu={openMenu}
//                       palette={palette}
//                     />
//                   ))
//                 )}
//               </List>
//             </Collapse>
//           </>
//         ) : (
//           <Box sx={{ flex: 1, minHeight: 48 }} aria-hidden />
//         )}
//       </Box>

//       <Divider sx={{ borderColor: palette.border }} />

//       <Box sx={{ p: expanded ? 1.5 : 1, display: "flex", justifyContent: expanded ? "stretch" : "center" }}>
//         {expanded ? (
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<SettingsOutlinedIcon />}
//             sx={{
//               justifyContent: "flex-start",
//               borderColor: palette.border,
//               color: palette.textPrimary,
//               textTransform: "none",
//               fontSize: 13,
//               py: 1,
//             }}
//           >
//             Settings
//           </Button>
//         ) : (
//           <Tooltip title="Settings" placement="right">
//             <IconButton sx={{ color: palette.primary }} aria-label="Settings">
//               <SettingsOutlinedIcon />
//             </IconButton>
//           </Tooltip>
//         )}
//       </Box>

//       <Menu
//         anchorEl={menuAnchor?.el ?? null}
//         open={!!menuAnchor}
//         onClose={closeMenu}
//         anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
//         transformOrigin={{ vertical: "top", horizontal: "right" }}
//         PaperProps={{ sx: { minWidth: 190, borderRadius: 2 } }}
//       >
//         <MenuItem onClick={handleFavoriteClick}>
//           <ListItemIcon>
//             {sessions.find((s) => s.id === menuAnchor?.id)?.favorite ? (
//               <StarIcon sx={{ fontSize: 18, color: palette.warning }} />
//             ) : (
//               <StarBorderIcon sx={{ fontSize: 18 }} />
//             )}
//           </ListItemIcon>
//           {sessions.find((s) => s.id === menuAnchor?.id)?.favorite ? "Remove from Favorites" : "Add to Favorites"}
//         </MenuItem>

//         <MenuItem onClick={handleRenameClick}>
//           <ListItemIcon>
//             <EditIcon sx={{ fontSize: 18 }} />
//           </ListItemIcon>
//           Rename
//         </MenuItem>

//         <MenuItem onClick={handleExportClick}>
//           <ListItemIcon>
//             <DownloadIcon sx={{ fontSize: 18 }} />
//           </ListItemIcon>
//           Export
//         </MenuItem>

//         <MenuItem onClick={handleDeleteClick} sx={{ color: palette.error }}>
//           <ListItemIcon>
//             <DeleteOutlineIcon sx={{ fontSize: 18, color: palette.error }} />
//           </ListItemIcon>
//           Delete
//         </MenuItem>
//       </Menu>

//       <Menu
//         anchorEl={exportAnchor?.el ?? null}
//         open={!!exportAnchor}
//         onClose={() => setExportAnchor(null)}
//       >
//         <MenuItem onClick={() => handleExportFormat("md")}>Markdown (.md)</MenuItem>
//         <MenuItem onClick={() => handleExportFormat("txt")}>Plain text (.txt)</MenuItem>
//         <MenuItem onClick={() => handleExportFormat("json")}>JSON (.json)</MenuItem>
//       </Menu>

//       <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
//         <DialogTitle>Rename conversation</DialogTitle>
//         <DialogContent>
//           <TextField
//             autoFocus
//             margin="dense"
//             fullWidth
//             label="Title"
//             value={renameTarget?.title || ""}
//             onChange={(e) =>
//               setRenameTarget((prev) => (prev ? { ...prev, title: e.target.value } : prev))
//             }
//             onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
//           <Button variant="contained" onClick={handleRenameSave}>
//             Save
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
//         <DialogTitle sx={{ fontSize: 16 }}>Delete this conversation?</DialogTitle>
//         <DialogContent>
//           <DialogContentText sx={{ fontSize: 13 }}>
//             This chat will be removed permanently. Do you confirm?
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ px: 3, pb: 2 }}>
//           <Button onClick={() => setDeleteTarget(null)} variant="outlined" size="small">
//             No
//           </Button>
//           <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small">
//             Yes
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default SessionSidebar;
import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  memo,
} from "react";

import {
  Box,
  List,
  ListItemButton,
  Typography,
  IconButton,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  Collapse,
  Chip,
  ListItemIcon,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SearchIcon from "@mui/icons-material/Search";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

import { alpha } from "@mui/material/styles";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import {
  createSession,
  setActiveSession,
  deleteSession,
  renameSession,
  toggleFavorite,
} from "../features/session/sessionSlice";

import { loadMessages, clearMessages } from "../features/chat/chatSlice";

import { generateId, formatTimestamp } from "../utils/helpers";
import {
  exportSession,
  searchSessions,
  ExportFormat,
} from "../utils/sessionExport";

import { useThemeMode } from "../contexts/ThemeModeContext";
import { useSettingsUi } from "../contexts/SettingsUiContext";

import type { Session } from "../features/session/sessionSlice";

/* ---------------------------------- */
/* Sidebar widths                      */
/* ---------------------------------- */

// Width when sidebar is fully open
const EXPANDED_W = 300;

// Width when sidebar is collapsed
const COLLAPSED_W = 72;

/* ---------------------------------- */
/* Small utility: escape regex chars   */
/* ---------------------------------- */

// This keeps search text safe inside RegExp
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ---------------------------------- */
/* Small keyboard shortcut chip        */
/* ---------------------------------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <Chip
      label={children}
      size="small"
      sx={{
        height: 22,
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
        bgcolor: (t) => alpha(t.palette.text.primary, 0.08),
        color: "text.secondary",
        border: "1px solid",
        borderColor: "divider",
        "& .MuiChip-label": {
          px: 0.75,
        },
      }}
    />
  );
}

/* ---------------------------------- */
/* Search highlight component          */
/* ---------------------------------- */

// This highlights the matching search text inside chat titles
function HighlightText({
  text,
  query,
  palette,
  mode,
}: {
  text: string;
  query: string;
  palette: any;
  mode: "light" | "dark";
}) {
  // Remove extra spaces from query
  const q = query.trim();

  // If no search query, just show original text
  if (!q) return <>{text}</>;

  // Split text using search query while keeping matched parts
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <Box
            component="span"
            key={index}
            sx={{
              display: "inline",
              px: 0.4,
              py: 0.05,
              borderRadius: "4px",
              fontWeight: 700,
              transition: "all 0.2s ease",
              bgcolor:
                mode === "dark"
                  ? "rgb(18, 14, 29)"
                  : palette.primarySoft || "rgba(37, 99, 235, 0.14)",
              color: mode === "dark" ? "#fff" : palette.primary,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {part}
          </Box>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

/* ---------------------------------- */
/* Single chat row                     */
/* ---------------------------------- */

function ChatRowInner({
  session,
  activeSessionId,
  search,
  expanded,
  onSelect,
  onMenu,
  palette,
  mode,
}: {
  session: Session;
  activeSessionId: string | null;
  search: string;
  expanded: boolean;
  onSelect: (id: string) => void;
  onMenu: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  palette: any;
  mode: "light" | "dark";
}) {
  return (
    <ListItemButton
      selected={session.id === activeSessionId}
      onClick={() => onSelect(session.id)}
      sx={{
        borderRadius: 1.5,
        py: 0.85,
        px: 1,
        mb: 0.35,
        alignItems: "flex-start",
        transition: "all 0.18s ease",
        "&.Mui-selected": {
          bgcolor: palette.bgSelected,
        },
        "&.Mui-selected:hover": {
          bgcolor: palette.bgSelected,
        },
        "&:hover": {
          bgcolor: palette.bgHover,
        },
      }}
    >
      <ListItemText
        primary={
          <Typography
            component="div"
            noWrap
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: palette.textPrimary,
              lineHeight: 1.35,
            }}
          >
            <HighlightText
              text={session.title}
              query={search}
              palette={palette}
              mode={mode}
            />
          </Typography>
        }
        secondary={formatTimestamp(session.updatedAt)}
        secondaryTypographyProps={{
          fontSize: 10.5,
          color: palette.textMuted,
          sx: {
            mt: 0.25,
          },
        }}
        sx={{
          mr: 0.5,
          minWidth: 0,
          my: 0,
        }}
      />

      {/* Show menu button only in expanded mode */}
      {expanded && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onMenu(e, session.id);
          }}
          sx={{
            color: palette.textMuted,
            mt: -0.25,
            "&:hover": {
              color: palette.textPrimary,
            },
          }}
        >
          <MoreVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </ListItemButton>
  );
}

/* ---------------------------------- */
/* Memoized row for performance        */
/* ---------------------------------- */

const ChatRow = memo(ChatRowInner, (prev, next) => {
  return (
    prev.session.id === next.session.id &&
    prev.session.title === next.session.title &&
    prev.session.favorite === next.session.favorite &&
    prev.session.updatedAt === next.session.updatedAt &&
    prev.activeSessionId === next.activeSessionId &&
    prev.search === next.search &&
    prev.expanded === next.expanded &&
    prev.palette === next.palette &&
    prev.mode === next.mode
  );
});

/* ---------------------------------- */
/* Section header                      */
/* ---------------------------------- */

function SectionHeader({
  title,
  open,
  onToggle,
  palette,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  palette: any;
}) {
  return (
    <ListItemButton
      onClick={onToggle}
      sx={{
        py: 0.5,
        px: 1,
        borderRadius: 1,
        minHeight: 36,
        "&:hover": {
          bgcolor: alpha(palette.textPrimary, 0.04),
        },
      }}
    >
      {open ? (
        <ExpandLessIcon
          sx={{
            fontSize: 18,
            color: palette.textSecondary,
            mr: 0.75,
          }}
        />
      ) : (
        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            color: palette.textSecondary,
            mr: 0.75,
          }}
        />
      )}

      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.6,
          color: palette.textSecondary,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
    </ListItemButton>
  );
}

/* ---------------------------------- */
/* Main sidebar                        */
/* ---------------------------------- */

const SessionSidebar: React.FC = () => {
  // Redux dispatch
  const dispatch = useAppDispatch();

  // Open settings drawer function
  const { openSettings } = useSettingsUi();

  // Theme + palette from your custom theme context
  const { palette, mode, toggle } = useThemeMode();

  // Read sessions and active session from Redux
  const { sessions, activeSessionId } = useAppSelector((s) => s.session);

  /* ------------------------------ */
  /* Local UI state                  */
  /* ------------------------------ */

  // Sidebar open / close state
  const [expanded, setExpanded] = useState(true);

  // Search text
  const [search, setSearch] = useState("");

  // Favorites section open / close
  const [favOpen, setFavOpen] = useState(true);

  // Recent chats section open / close
  const [recentOpen, setRecentOpen] = useState(true);

  // Delete dialog target chat id
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Main row menu anchor + session id
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    id: string;
  } | null>(null);

  // Export menu uses screen position so submenu opens properly to the right
  const [exportMenuState, setExportMenuState] = useState<{
    top: number;
    left: number;
    id: string;
  } | null>(null);

  // Rename dialog target
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Search input reference for auto-focus
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /* ------------------------------ */
  /* Derived data                    */
  /* ------------------------------ */

  // Filter sessions based on search text
  const filtered = useMemo(() => searchSessions(sessions, search), [sessions, search]);

  // Favorites list
  const favorites = useMemo(
    () => filtered.filter((s) => s.favorite),
    [filtered],
  );

  // Non-favorite recent chats
  const recents = useMemo(
    () => filtered.filter((s) => !s.favorite),
    [filtered],
  );

  /* ------------------------------ */
  /* Event handlers                  */
  /* ------------------------------ */

  // Expand sidebar and focus search input
  const expandAndFocusSearch = useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, []);

  // Create a new local chat session
  const handleNewChat = useCallback(() => {
    const session: Session = {
      id: generateId(),
      title: "New Conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    dispatch(createSession(session));
    dispatch(clearMessages());
  }, [dispatch]);

  // Select a session and load its messages into chat panel
  const handleSelectSession = useCallback(
    (id: string) => {
      const session = sessions.find((s) => s.id === id);

      if (!session) return;

      dispatch(setActiveSession(id));
      dispatch(loadMessages(session.messages));
    },
    [dispatch, sessions],
  );

  // Confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    dispatch(deleteSession(deleteTarget));

    // If deleted chat is active, clear chat messages
    if (deleteTarget === activeSessionId) {
      dispatch(clearMessages());
    }

    setDeleteTarget(null);
  }, [deleteTarget, activeSessionId, dispatch]);

  // Open the row menu
  const openMenu = useCallback((e: React.MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor({
      el: e.currentTarget,
      id,
    });
  }, []);

  // Close the row menu
  const closeMenu = () => {
    setMenuAnchor(null);
  };

  // Open rename dialog from menu
  const handleRenameClick = () => {
    if (!menuAnchor) return;

    const session = sessions.find((x) => x.id === menuAnchor.id);

    if (session) {
      setRenameTarget({
        id: session.id,
        title: session.title,
      });
    }

    closeMenu();
  };

  // Save renamed title
  const handleRenameSave = () => {
    if (renameTarget) {
      dispatch(
        renameSession({
          id: renameTarget.id,
          title: renameTarget.title.trim() || "Untitled chat",
        }),
      );
    }

    setRenameTarget(null);
  };

  // Toggle favorite
  const handleFavoriteClick = () => {
    if (menuAnchor) {
      dispatch(toggleFavorite(menuAnchor.id));
    }

    closeMenu();
  };

  // Open delete confirmation
  const handleDeleteClick = () => {
    if (menuAnchor) {
      setDeleteTarget(menuAnchor.id);
    }

    closeMenu();
  };

  // Open export menu to the RIGHT side of clicked menu item
  const handleExportClick = (e: React.MouseEvent<HTMLElement>) => {
    // Read clicked element position
    const rect = e.currentTarget.getBoundingClientRect();

    // Create export menu state using screen position
    setExportMenuState({
      top: rect.top,
      left: rect.right + 6,
      id: menuAnchor?.id || "",
    });

    // Close main menu after opening export position
    closeMenu();
  };

  // Export selected session
  const handleExportFormat = (fmt: ExportFormat) => {
    if (!exportMenuState) return;

    const session = sessions.find((x) => x.id === exportMenuState.id);

    if (session) {
      exportSession(session, fmt);
    }

    setExportMenuState(null);
  };

  /* ------------------------------ */
  /* Keyboard shortcuts              */
  /* ------------------------------ */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore already handled keys
      if (e.defaultPrevented) return;

      // Ctrl / Cmd pressed
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+N => new chat
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewChat();
      }

      // Ctrl+O => open sidebar + focus search
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        expandAndFocusSearch();
      }
    };

    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [handleNewChat, expandAndFocusSearch]);

  /* ------------------------------ */
  /* Styling helpers                 */
  /* ------------------------------ */

  // Current width based on expanded state
  const width = expanded ? EXPANDED_W : COLLAPSED_W;

  // Dark mode flag
  const isDark = mode === "dark";

  // Accent icon color
  const accentIcon = isDark ? "#523cfb" : palette.primary;

  // Logo background style
  const brandLogoBg = isDark
    ? `linear-gradient(145deg, ${palette.primary} 0%, ${
        palette.userAccent || palette.primary
      } 100%)`
    : palette.primary;

  // Shared action row styling
  const actionRowSx = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.5,
    py: 0.9,
    borderRadius: 1.5,
    cursor: "pointer",
    color: palette.textPrimary,
    transition: "all 0.18s ease",
    "&:hover": {
      bgcolor: alpha(palette.textPrimary, 0.06),
    },
  };

  /* ------------------------------ */
  /* Render                          */
  /* ------------------------------ */

  return (
    <Box
      sx={{
        position: "relative",
        flexShrink: 0,
        height: "100%",
        minHeight: 0,
        width,
        transition: "width 220ms ease-out",
        bgcolor: palette.bgSidebar,
        borderRight: "1px solid",
        borderColor: palette.border,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===================================== */}
      {/* Header                                */}
      {/* ===================================== */}

      {expanded ? (
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            minHeight: 56,
          }}
        >
          {/* Left side: logo + title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 0,
              flex: 1,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: brandLogoBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: isDark
                  ? `0 6px 18px ${alpha(palette.primary, 0.22)}`
                  : "none",
              }}
            >
              <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>

            <Typography
              sx={{
                fontWeight: 700,
                fontSize: 15,
                color: palette.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              Logic Chat
            </Typography>
          </Box>

          {/* Right side: theme toggle + collapse */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} theme`}>
              <IconButton
                size="small"
                onClick={toggle}
                sx={{ color: palette.textSecondary }}
              >
                {mode === "light" ? (
                  <DarkModeOutlinedIcon fontSize="small" />
                ) : (
                  <LightModeOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title="Collapse sidebar" placement="bottom">
              <IconButton
                size="small"
                onClick={() => setExpanded(false)}
                sx={{ color: palette.textSecondary }}
                aria-label="Collapse sidebar"
              >
                <ViewSidebarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.85,
            py: 1.25,
            px: 0.5,
          }}
        >
          {/* Clickable logo in collapsed mode -> expands sidebar */}
          <Tooltip title="Open Logic Chat" placement="right">
            <Box
              onClick={() => setExpanded(true)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: brandLogoBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                transition: "transform 0.18s ease",
                "&:hover": {
                  transform: "scale(1.04)",
                },
              }}
            >
              <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
          </Tooltip>

          {/* New chat */}
          <Tooltip title="New chat" placement="right">
            <IconButton onClick={handleNewChat} size="small" sx={{ color: accentIcon }}>
              <AddIcon />
            </IconButton>
          </Tooltip>

          {/* Search */}
          <Tooltip title="Search chats (Ctrl+O)" placement="right">
            <IconButton
              onClick={expandAndFocusSearch}
              size="small"
              sx={{ color: palette.textSecondary }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {/* Neutral open list icon — not highlighted */}
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton
              onClick={() => setExpanded(true)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                color: palette.textSecondary,
                bgcolor: "transparent",
                border: "1px solid",
                borderColor: palette.border,
                "&:hover": {
                  bgcolor: palette.bgHover,
                  borderColor: palette.borderStrong,
                },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Divider sx={{ borderColor: palette.border }} />

      {/* ===================================== */}
      {/* Quick actions + search                 */}
      {/* ===================================== */}

      {expanded && (
        <>
          <Box
            sx={{
              px: 1,
              pt: 1,
              pb: 0.5,
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
            }}
          >
            {/* New chat */}
            <Box
              component="button"
              type="button"
              sx={{
                ...actionRowSx,
                border: "none",
                background: "none",
                width: "100%",
                textAlign: "left",
              }}
              onClick={handleNewChat}
            >
              <AddIcon sx={{ fontSize: 20, color: accentIcon }} />
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
                New chat
              </Typography>
            </Box>

            {/* Search chats */}
            <Box
              component="button"
              type="button"
              sx={{
                ...actionRowSx,
                border: "none",
                background: "none",
                width: "100%",
                textAlign: "left",
              }}
              onClick={expandAndFocusSearch}
            >
              <SearchIcon sx={{ fontSize: 20, color: palette.textSecondary }} />
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
                Search chats
              </Typography>
              <Kbd>Ctrl+O</Kbd>
            </Box>

            {/* Placeholder library */}
            <Tooltip title="Coming soon">
              <Box sx={{ ...actionRowSx, opacity: 0.55, cursor: "default" }}>
                <PhotoLibraryOutlinedIcon
                  sx={{ fontSize: 20, color: palette.textSecondary }}
                />
                <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
                  Library
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          {/* Search input */}
          <Box sx={{ px: 1.5, pb: 1 }}>
            <TextField
              inputRef={searchInputRef}
              size="small"
              fullWidth
              placeholder="Filter chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        fontSize: 18,
                        color: palette.textSecondary,
                      }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: 13,
                  bgcolor: palette.bgInput,
                  color: palette.textPrimary,
                  borderRadius: 2,
                  "& fieldset": {
                    borderColor: palette.border,
                  },
                  "&:hover fieldset": {
                    borderColor: palette.borderStrong,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: palette.primary,
                  },
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: palette.border, my: 0.5 }} />
        </>
      )}

      {/* ===================================== */}
      {/* Chat lists                            */}
      {/* ===================================== */}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          px: expanded ? 0.75 : 0.25,
          py: 0.5,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(palette.textPrimary, 0.15),
            borderRadius: 3,
          },
        }}
      >
        {expanded ? (
          <>
            {/* Favorites */}
            <SectionHeader
              title="Favorites"
              open={favOpen}
              onToggle={() => setFavOpen((prev) => !prev)}
              palette={palette}
            />

            <Collapse in={favOpen}>
              <List dense disablePadding sx={{ px: 0.5, pb: 1 }}>
                {favorites.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      px: 1,
                      py: 0.75,
                      color: palette.textSecondary,
                    }}
                  >
                    Star a chat from the menu to pin it here.
                  </Typography>
                ) : (
                  favorites.map((session) => (
                    <ChatRow
                      key={session.id}
                      session={session}
                      activeSessionId={activeSessionId}
                      search={search}
                      expanded
                      onSelect={handleSelectSession}
                      onMenu={openMenu}
                      palette={palette}
                      mode={mode}
                    />
                  ))
                )}
              </List>
            </Collapse>

            {/* Recent chats */}
            <SectionHeader
              title="Recent chats"
              open={recentOpen}
              onToggle={() => setRecentOpen((prev) => !prev)}
              palette={palette}
            />

            <Collapse in={recentOpen}>
              <List dense disablePadding sx={{ px: 0.5, pb: 1 }}>
                {recents.length === 0 && filtered.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      px: 1,
                      py: 0.75,
                      color: palette.textSecondary,
                    }}
                  >
                    {search.trim()
                      ? "No matches found."
                      : "No chats yet — start with New chat."}
                  </Typography>
                ) : recents.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      px: 1,
                      py: 0.75,
                      color: palette.textSecondary,
                    }}
                  >
                    {search.trim()
                      ? "No matches in recent chats."
                      : "All chats are in Favorites."}
                  </Typography>
                ) : (
                  recents.map((session) => (
                    <ChatRow
                      key={session.id}
                      session={session}
                      activeSessionId={activeSessionId}
                      search={search}
                      expanded
                      onSelect={handleSelectSession}
                      onMenu={openMenu}
                      palette={palette}
                      mode={mode}
                    />
                  ))
                )}
              </List>
            </Collapse>
          </>
        ) : (
          <Box sx={{ flex: 1, minHeight: 48 }} aria-hidden />
        )}
      </Box>

      <Divider sx={{ borderColor: palette.border }} />

      {/* ===================================== */}
      {/* Settings button                       */}
      {/* ===================================== */}

      <Box
        sx={{
          p: expanded ? 1.5 : 1,
          display: "flex",
          justifyContent: expanded ? "stretch" : "center",
        }}
      >
        {expanded ? (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SettingsOutlinedIcon />}
            onClick={openSettings}
            sx={{
              justifyContent: "flex-start",
              borderColor: palette.border,
              color: palette.textPrimary,
              textTransform: "none",
              fontSize: 13,
              py: 1,
            }}
          >
            Settings
          </Button>
        ) : (
          <Tooltip title="Settings" placement="right">
            <IconButton
              onClick={openSettings}
              sx={{ color: palette.primary }}
              aria-label="Settings"
            >
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ===================================== */}
      {/* Main row menu                         */}
      {/* ===================================== */}

      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={!!menuAnchor}
        onClose={closeMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            minWidth: 190,
            borderRadius: 2,
          },
        }}
      >
        {/* Favorite toggle */}
        <MenuItem onClick={handleFavoriteClick}>
          <ListItemIcon>
            {sessions.find((s) => s.id === menuAnchor?.id)?.favorite ? (
              <StarIcon sx={{ fontSize: 18, color: palette.warning }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 18 }} />
            )}
          </ListItemIcon>

          {sessions.find((s) => s.id === menuAnchor?.id)?.favorite
            ? "Remove from Favorites"
            : "Add to Favorites"}
        </MenuItem>

        {/* Rename */}
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <EditIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Rename
        </MenuItem>

        {/* Export */}
        <MenuItem onClick={handleExportClick}>
          <ListItemIcon>
            <DownloadIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Export
        </MenuItem>

        {/* Delete */}
        <MenuItem onClick={handleDeleteClick} sx={{ color: palette.error }}>
          <ListItemIcon>
            <DeleteOutlineIcon sx={{ fontSize: 18, color: palette.error }} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* ===================================== */}
      {/* Export submenu                        */}
      {/* Opens to the right side               */}
      {/* ===================================== */}

      <Menu
        open={!!exportMenuState}
        onClose={() => setExportMenuState(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          exportMenuState
            ? {
                top: exportMenuState.top,
                left: exportMenuState.left,
              }
            : undefined
        }
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem onClick={() => handleExportFormat("md")}>
          Markdown (.md)
        </MenuItem>

        <MenuItem onClick={() => handleExportFormat("txt")}>
          Plain text (.txt)
        </MenuItem>

        <MenuItem onClick={() => handleExportFormat("json")}>
          JSON (.json)
        </MenuItem>
      </Menu>

      {/* ===================================== */}
      {/* Rename dialog                         */}
      {/* ===================================== */}

      <Dialog
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Rename conversation</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="Title"
            value={renameTarget?.title || ""}
            onChange={(e) =>
              setRenameTarget((prev) =>
                prev
                  ? {
                      ...prev,
                      title: e.target.value,
                    }
                  : prev,
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRenameSave();
              }
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRenameSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================================== */}
      {/* Delete dialog                         */}
      {/* ===================================== */}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontSize: 16 }}>
          Delete this conversation?
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            This chat will be removed permanently. Do you confirm?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
            size="small"
          >
            No
          </Button>

          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            size="small"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionSidebar;