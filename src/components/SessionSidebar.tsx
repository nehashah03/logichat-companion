import React, { useCallback, useMemo, useState } from 'react';
import {
  Box, List, ListItemButton, ListItemText, Typography, IconButton,
  Button, Divider, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, InputAdornment, Menu, MenuItem,
  ListItemIcon, Tooltip, Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  createSession, setActiveSession, deleteSession,
  renameSession, toggleFavorite,
} from '../features/session/sessionSlice';
import { loadMessages, clearMessages } from '../features/chat/chatSlice';
import { generateId, formatTimestamp } from '../utils/helpers';
import { exportSession, searchSessions, ExportFormat } from '../utils/sessionExport';
import { useThemeMode } from '../contexts/ThemeModeContext';
import type { Session } from '../features/session/sessionSlice';

const SessionSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessions, activeSessionId } = useAppSelector(s => s.session);
  const { palette, mode, toggle } = useThemeMode();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [exportAnchor, setExportAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [search, setSearch] = useState('');
  const [favOpen, setFavOpen] = useState(true);
  const [allOpen, setAllOpen] = useState(true);

  const filtered = useMemo(() => searchSessions(sessions, search), [sessions, search]);
  const favorites = useMemo(() => filtered.filter(s => s.favorite), [filtered]);
  const others = useMemo(() => filtered.filter(s => !s.favorite), [filtered]);

  const handleNewChat = useCallback(() => {
    const session: Session = {
      id: generateId(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    dispatch(createSession(session));
    dispatch(clearMessages());
  }, [dispatch]);

  const handleSelectSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      dispatch(setActiveSession(id));
      dispatch(loadMessages(session.messages));
    }
  }, [dispatch, sessions]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      dispatch(deleteSession(deleteTarget));
      if (deleteTarget === activeSessionId) dispatch(clearMessages());
      setDeleteTarget(null);
    }
  }, [deleteTarget, activeSessionId, dispatch]);

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget, id });
  };
  const closeMenu = () => setMenuAnchor(null);

  const handleRenameClick = () => {
    if (!menuAnchor) return;
    const s = sessions.find(x => x.id === menuAnchor.id);
    if (s) setRenameTarget({ id: s.id, title: s.title });
    closeMenu();
  };
  const handleRenameSave = () => {
    if (renameTarget) dispatch(renameSession({ id: renameTarget.id, title: renameTarget.title }));
    setRenameTarget(null);
  };

  const handleFavoriteClick = () => {
    if (menuAnchor) dispatch(toggleFavorite(menuAnchor.id));
    closeMenu();
  };
  const handleDeleteClick = () => {
    if (menuAnchor) setDeleteTarget(menuAnchor.id);
    closeMenu();
  };
  const handleExportClick = (e: React.MouseEvent<HTMLElement>) => {
    if (menuAnchor) setExportAnchor({ el: e.currentTarget, id: menuAnchor.id });
    closeMenu();
  };
  const handleExportFormat = (fmt: ExportFormat) => {
    if (exportAnchor) {
      const s = sessions.find(x => x.id === exportAnchor.id);
      if (s) exportSession(s, fmt);
    }
    setExportAnchor(null);
  };

  const renderItem = (session: Session) => (
    <ListItemButton
      key={session.id}
      selected={session.id === activeSessionId}
      onClick={() => handleSelectSession(session.id)}
      sx={{
        borderRadius: '6px', mb: 0.25, px: 1.25, py: 0.75, minHeight: 44,
        '&.Mui-selected': { bgcolor: palette.bgSelected },
        '&.Mui-selected:hover': { bgcolor: palette.bgSelected },
        '&:hover': { bgcolor: palette.bgHover },
        '& .row-actions': { opacity: 0 },
        '&:hover .row-actions': { opacity: 1 },
      }}
    >
      {session.favorite
        ? <StarIcon sx={{ fontSize: 14, mr: 1.25, color: palette.warning }} />
        : <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 1.25, color: palette.textMuted }} />}
      <ListItemText
        primary={session.title}
        secondary={formatTimestamp(session.updatedAt)}
        primaryTypographyProps={{ noWrap: true, fontSize: 12.5, fontWeight: 500, color: palette.textPrimary }}
        secondaryTypographyProps={{ fontSize: 10.5, color: palette.textMuted }}
      />
      <IconButton
        className="row-actions" size="small"
        onClick={(e) => openMenu(e, session.id)}
        sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}
      >
        <MoreVertIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </ListItemButton>
  );

  return (
    <Box sx={{
      width: 280, height: '100vh', display: 'flex', flexDirection: 'column',
      bgcolor: palette.bgSidebar, borderRight: '1px solid', borderColor: palette.border,
    }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: palette.textSecondary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Chats
        </Typography>
        <Tooltip title={`Switch to ${mode === 'light' ? 'Midnight' : 'Light'} theme`}>
          <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
            {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* New Chat */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <Button
          fullWidth variant="contained" disableElevation
          startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={handleNewChat}
          sx={{
            justifyContent: 'center', fontSize: 13, py: 0.85,
            bgcolor: palette.primary, color: palette.textOnPrimary,
            '&:hover': { bgcolor: palette.primaryHover },
          }}
        >
          New Chat
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <TextField
          fullWidth size="small" placeholder="Search chats…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: palette.textMuted }} />
              </InputAdornment>
            ),
            sx: {
              fontSize: 12.5, bgcolor: palette.bgInput, color: palette.textPrimary,
              '& fieldset': { borderColor: palette.border },
              '&:hover fieldset': { borderColor: palette.borderStrong },
            },
          }}
        />
      </Box>

      <Divider sx={{ borderColor: palette.border }} />

      {/* Lists */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 0.75, py: 0.75 }}>
        {favorites.length > 0 && (
          <>
            <Box
              onClick={() => setFavOpen(o => !o)}
              sx={{
                display: 'flex', alignItems: 'center', px: 1.25, py: 0.5, cursor: 'pointer',
                color: palette.textMuted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.5px', userSelect: 'none',
              }}
            >
              {favOpen ? <ExpandLessIcon sx={{ fontSize: 14, mr: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 14, mr: 0.5 }} />}
              Favorites ({favorites.length})
            </Box>
            <Collapse in={favOpen}>
              <List dense disablePadding>{favorites.map(renderItem)}</List>
            </Collapse>
          </>
        )}

        <Box
          onClick={() => setAllOpen(o => !o)}
          sx={{
            display: 'flex', alignItems: 'center', px: 1.25, py: 0.5, mt: favorites.length ? 1 : 0,
            cursor: 'pointer', color: palette.textMuted, fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px', userSelect: 'none',
          }}
        >
          {allOpen ? <ExpandLessIcon sx={{ fontSize: 14, mr: 0.5 }} /> : <ExpandMoreIcon sx={{ fontSize: 14, mr: 0.5 }} />}
          Recent ({others.length})
        </Box>
        <Collapse in={allOpen}>
          <List dense disablePadding>{others.map(renderItem)}</List>
        </Collapse>

        {filtered.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: palette.textMuted, fontSize: 12 }}>
              {search ? 'No matches' : 'No conversations yet'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Per-chat menu */}
      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={!!menuAnchor}
        onClose={closeMenu}
        PaperProps={{ sx: { minWidth: 170 } }}
      >
        <MenuItem onClick={handleRenameClick} sx={{ fontSize: 13 }}>
          <ListItemIcon><EditIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={handleFavoriteClick} sx={{ fontSize: 13 }}>
          <ListItemIcon>
            {sessions.find(s => s.id === menuAnchor?.id)?.favorite
              ? <StarIcon sx={{ fontSize: 16, color: palette.warning }} />
              : <StarBorderIcon sx={{ fontSize: 16 }} />}
          </ListItemIcon>
          {sessions.find(s => s.id === menuAnchor?.id)?.favorite ? 'Remove favorite' : 'Add to favorites'}
        </MenuItem>
        <MenuItem onClick={handleExportClick} sx={{ fontSize: 13 }}>
          <ListItemIcon><DownloadIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          Export…
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ fontSize: 13, color: palette.error }}>
          <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16, color: palette.error }} /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Export submenu */}
      <Menu
        anchorEl={exportAnchor?.el ?? null}
        open={!!exportAnchor}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem sx={{ fontSize: 13 }} onClick={() => handleExportFormat('md')}>Markdown (.md)</MenuItem>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => handleExportFormat('txt')}>Plain text (.txt)</MenuItem>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => handleExportFormat('json')}>JSON (.json)</MenuItem>
      </Menu>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 15 }}>Rename conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth size="small" value={renameTarget?.title || ''}
            onChange={(e) => setRenameTarget(t => t ? { ...t, title: e.target.value } : t)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSave(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button onClick={handleRenameSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontSize: 15 }}>Delete conversation?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            This will permanently delete this conversation. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: palette.textSecondary }}>No</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small">Yes, Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionSidebar;
