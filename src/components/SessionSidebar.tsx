/**
 * Sidebar — ChatGPT-style.
 *
 * Layout (top to bottom):
 *   • Logo + collapse toggle
 *   • New chat button
 *   • Search chats input (debounced → backend `/api/search`)
 *   • Favorites group (if any)
 *   • Recent groups: Today / Yesterday / Last 7 days / Last 30 days / Older
 *   • Settings row at the bottom
 *
 * Each row shows the title and the last-updated timestamp; the 3-dot
 * menu offers Rename / Favorite / Export (md/txt/json) / Delete.
 *
 * The sidebar is **resizable** (drag the right edge, min 240, max 460)
 * and can be **collapsed** to a narrow 60px icon strip.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, IconButton, Button, Tooltip, TextField, InputAdornment,
  List, ListItemButton, ListItemText, Menu, MenuItem, ListItemIcon, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchSessions, createSessionRemote, deleteSessionRemote,
  renameSessionRemote, toggleFavoriteRemote, setActiveSession,
  setSearchQuery, searchSessionsRemote,
} from '../features/session/sessionSlice';
import { dropSession } from '../features/chat/chatSlice';
import { useThemeMode } from '../contexts/ThemeModeContext';
import { groupSessions, relativeTime } from '../utils/grouping';
import { api, SessionMeta } from '../services/api';

const MIN_W = 240, MAX_W = 460, COLLAPSED_W = 60, DEFAULT_W = 280;

const SessionSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { palette, mode, toggle } = useThemeMode();
  const { sessions, activeSessionId, searchQuery, searchResults } = useAppSelector(s => s.session);

  const [width, setWidth] = useState<number>(DEFAULT_W);
  const [collapsed, setCollapsed] = useState(false);
  const dragging = useRef(false);

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [exportAnchor, setExportAnchor] = useState<{ el: HTMLElement; id: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Initial load
  useEffect(() => { dispatch(fetchSessions()); }, [dispatch]);

  // Debounced backend search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const t = setTimeout(() => { dispatch(searchSessionsRemote(searchQuery)); }, 200);
    return () => clearTimeout(t);
  }, [searchQuery, dispatch]);

  // Resize handle
  const onMouseDown = (e: React.MouseEvent) => {
    if (collapsed) return;
    dragging.current = true;
    e.preventDefault();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      setWidth(Math.max(MIN_W, Math.min(MAX_W, e.clientX)));
    };
    const up = () => { dragging.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  // ---- Lists ----
  const visible: SessionMeta[] = searchResults ?? sessions;
  const favorites = useMemo(() => visible.filter(s => s.favorite), [visible]);
  const others    = useMemo(() => visible.filter(s => !s.favorite), [visible]);
  const grouped   = useMemo(() => groupSessions(others), [others]);

  // ---- Actions ----
  const handleNewChat = useCallback(async () => {
    await dispatch(createSessionRemote(undefined));
  }, [dispatch]);

  const handleSelect = useCallback((id: string) => {
    dispatch(setActiveSession(id));
  }, [dispatch]);

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget, id });
  };
  const closeMenu = () => setMenuAnchor(null);

  const onRenameSave = async () => {
    if (renameTarget && renameTarget.title.trim()) {
      await dispatch(renameSessionRemote({ id: renameTarget.id, title: renameTarget.title.trim() }));
    }
    setRenameTarget(null);
  };

  const onConfirmDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteSessionRemote(deleteTarget));
      dispatch(dropSession(deleteTarget));
      setDeleteTarget(null);
    }
  };

  const onExport = (fmt: 'md' | 'txt' | 'json') => {
    if (exportAnchor) window.open(api.exportUrl(exportAnchor.id, fmt), '_blank');
    setExportAnchor(null);
  };

  // ---- Renderers ----
  const renderItem = (s: SessionMeta) => (
    <ListItemButton
      key={s.id}
      selected={s.id === activeSessionId}
      onClick={() => handleSelect(s.id)}
      sx={{
        borderRadius: '8px', mb: 0.25, px: 1.25, py: 0.75, minHeight: 44,
        '&.Mui-selected': { bgcolor: palette.bgSelected },
        '&.Mui-selected:hover': { bgcolor: palette.bgSelected },
        '&:hover': { bgcolor: palette.bgHover },
        '& .row-actions': { opacity: 0 },
        '&:hover .row-actions': { opacity: 1 },
      }}
    >
      {s.favorite
        ? <StarIcon sx={{ fontSize: 14, mr: 1.25, color: palette.warning }} />
        : <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 1.25, color: palette.textMuted }} />}
      <ListItemText
        primary={s.title}
        secondary={relativeTime(s.updatedAt)}
        primaryTypographyProps={{ noWrap: true, fontSize: 12.75, fontWeight: 500, color: palette.textPrimary }}
        secondaryTypographyProps={{ fontSize: 10.5, color: palette.textMuted }}
      />
      <IconButton
        className="row-actions" size="small"
        onClick={(e) => openMenu(e, s.id)}
        sx={{ color: palette.textMuted, '&:hover': { color: palette.textPrimary } }}
      >
        <MoreVertIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </ListItemButton>
  );

  // ---- Collapsed mode ----
  if (collapsed) {
    return (
      <Box sx={{
        width: COLLAPSED_W, height: '100vh', display: 'flex', flexDirection: 'column',
        bgcolor: palette.bgSidebar, borderRight: '1px solid', borderColor: palette.border,
        alignItems: 'center', py: 1, gap: 0.5,
      }}>
        <IconButton size="small" onClick={() => setCollapsed(false)} sx={{ color: palette.textPrimary }}>
          <MenuIcon />
        </IconButton>
        <Tooltip title="New chat" placement="right">
          <IconButton size="small" onClick={handleNewChat}
            sx={{ bgcolor: palette.primary, color: palette.textOnPrimary, '&:hover': { bgcolor: palette.primaryHover } }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={`Switch to ${mode === 'light' ? 'Midnight' : 'Light'}`} placement="right">
          <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
            {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{
      width, height: '100vh', flexShrink: 0, display: 'flex', flexDirection: 'column',
      bgcolor: palette.bgSidebar, borderRight: '1px solid', borderColor: palette.border,
      position: 'relative',
    }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 26, height: 26, borderRadius: '8px',
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryHover})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: palette.textOnPrimary, fontWeight: 800, fontSize: 13 }}>L</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: palette.textPrimary }}>
            LogicChat
          </Typography>
        </Box>
        <Tooltip title="Collapse">
          <IconButton size="small" onClick={() => setCollapsed(true)} sx={{ color: palette.textMuted }}>
            <MenuOpenIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* New chat */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <Button
          fullWidth variant="contained" disableElevation
          startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={handleNewChat}
          sx={{
            justifyContent: 'flex-start', fontSize: 13, py: 0.85,
            bgcolor: palette.primary, color: palette.textOnPrimary,
            '&:hover': { bgcolor: palette.primaryHover },
          }}
        >
          New chat
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <TextField
          fullWidth size="small" placeholder="Search chats…"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
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
      <Box sx={{ flex: 1, overflow: 'auto', px: 0.75, py: 1 }}>
        {favorites.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{
              px: 1.25, pb: 0.5, color: palette.textMuted, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Favorites
            </Box>
            <List dense disablePadding>{favorites.map(renderItem)}</List>
          </Box>
        )}

        {grouped.map(group => (
          <Box key={group.key} sx={{ mb: 1 }}>
            <Box sx={{
              px: 1.25, pb: 0.5, color: palette.textMuted, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              {group.label}
            </Box>
            <List dense disablePadding>{group.sessions.map(renderItem)}</List>
          </Box>
        ))}

        {visible.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: palette.textMuted, fontSize: 12 }}>
              {searchQuery ? 'No matches' : 'No conversations yet — click “New chat”.'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer: settings + theme */}
      <Divider sx={{ borderColor: palette.border }} />
      <Box sx={{ px: 1, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button startIcon={<SettingsOutlinedIcon sx={{ fontSize: '17px !important' }} />}
          sx={{ color: palette.textSecondary, fontSize: 12.5, textTransform: 'none' }}>
          Settings
        </Button>
        <Tooltip title={`Switch to ${mode === 'light' ? 'Midnight' : 'Light'}`}>
          <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
            {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Resize handle */}
      <Box
        onMouseDown={onMouseDown}
        sx={{
          position: 'absolute', top: 0, right: -3, width: 6, height: '100%',
          cursor: 'col-resize', zIndex: 10,
          '&:hover': { bgcolor: palette.primary, opacity: 0.4 },
        }}
      />

      {/* Per-chat menu */}
      <Menu anchorEl={menuAnchor?.el ?? null} open={!!menuAnchor} onClose={closeMenu} PaperProps={{ sx: { minWidth: 180 } }}>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => {
          if (!menuAnchor) return;
          const s = visible.find(x => x.id === menuAnchor.id);
          if (s) setRenameTarget({ id: s.id, title: s.title });
          closeMenu();
        }}>
          <ListItemIcon><EditIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => {
          if (!menuAnchor) return;
          const s = visible.find(x => x.id === menuAnchor.id);
          if (s) dispatch(toggleFavoriteRemote({ id: s.id, favorite: !s.favorite }));
          closeMenu();
        }}>
          <ListItemIcon>
            {visible.find(x => x.id === menuAnchor?.id)?.favorite
              ? <StarIcon sx={{ fontSize: 16, color: palette.warning }} />
              : <StarBorderIcon sx={{ fontSize: 16 }} />}
          </ListItemIcon>
          {visible.find(x => x.id === menuAnchor?.id)?.favorite ? 'Remove favorite' : 'Add to favorites'}
        </MenuItem>
        <MenuItem sx={{ fontSize: 13 }} onClick={(e) => {
          if (menuAnchor) setExportAnchor({ el: e.currentTarget as HTMLElement, id: menuAnchor.id });
          closeMenu();
        }}>
          <ListItemIcon><DownloadIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          Export…
        </MenuItem>
        <Divider />
        <MenuItem sx={{ fontSize: 13, color: palette.error }} onClick={() => {
          if (menuAnchor) setDeleteTarget(menuAnchor.id);
          closeMenu();
        }}>
          <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16, color: palette.error }} /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Menu anchorEl={exportAnchor?.el ?? null} open={!!exportAnchor} onClose={() => setExportAnchor(null)}>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => onExport('md')}>Markdown (.md)</MenuItem>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => onExport('txt')}>Plain text (.txt)</MenuItem>
        <MenuItem sx={{ fontSize: 13 }} onClick={() => onExport('json')}>JSON (.json)</MenuItem>
      </Menu>

      {/* Rename */}
      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 15 }}>Rename conversation</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth size="small"
            value={renameTarget?.title || ''}
            onChange={(e) => setRenameTarget(t => t ? { ...t, title: e.target.value } : t)}
            onKeyDown={(e) => { if (e.key === 'Enter') onRenameSave(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>Cancel</Button>
          <Button onClick={onRenameSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontSize: 15 }}>Delete conversation?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            This permanently deletes the chat and all its messages. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={onConfirmDelete} color="error" variant="contained" size="small">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionSidebar;