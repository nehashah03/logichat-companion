import React, { useCallback } from 'react';
import {
  Box, List, ListItemButton, ListItemText, Typography, IconButton,
  Button, Divider, Tooltip, Dialog, DialogTitle, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createSession, setActiveSession, deleteSession, clearAllSessions } from '../../features/session/sessionSlice';
import { loadMessages, clearMessages } from '../../features/chat/chatSlice';
import { generateId, formatTimestamp } from '../../utils/helpers';

const SessionSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessions, activeSessionId } = useAppSelector(s => s.session);
  const [confirmClear, setConfirmClear] = React.useState(false);

  const handleNewChat = useCallback(() => {
    const session = {
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

  const handleDeleteSession = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(deleteSession(id));
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearAllSessions());
    dispatch(clearMessages());
    setConfirmClear(false);
  }, [dispatch]);

  return (
    <Box sx={{
      width: 280, height: '100vh', display: 'flex', flexDirection: 'column',
      bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider',
    }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '8px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #6C8EEF 0%, #2DD4A8 100%)',
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>AI</Typography>
        </Box>
        <Typography variant="h6" sx={{ fontSize: 16, flex: 1 }}>DevAssist</Typography>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <Button
          fullWidth variant="outlined" startIcon={<AddIcon />}
          onClick={handleNewChat}
          sx={{
            borderColor: 'divider', color: 'text.primary', justifyContent: 'flex-start',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(108,142,239,0.08)' },
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', px: 1, py: 1 }}>
        <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          History
        </Typography>
        <List dense disablePadding>
          {sessions.map(session => (
            <ListItemButton
              key={session.id}
              selected={session.id === activeSessionId}
              onClick={() => handleSelectSession(session.id)}
              sx={{
                borderRadius: '8px', mb: 0.5, px: 1.5, py: 1,
                '&.Mui-selected': { bgcolor: 'rgba(108,142,239,0.12)' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} />
              <ListItemText
                primary={session.title}
                secondary={formatTimestamp(session.updatedAt)}
                primaryTypographyProps={{ noWrap: true, fontSize: 13, fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: 11 }}
              />
              <Tooltip title="Delete">
                <IconButton size="small" onClick={(e) => handleDeleteSession(e, session.id)}
                  sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </ListItemButton>
          ))}
        </List>
        {sessions.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No conversations yet</Typography>
          </Box>
        )}
      </Box>

      {sessions.length > 0 && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth size="small" startIcon={<DeleteSweepIcon />}
            onClick={() => setConfirmClear(true)}
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
          >
            Clear History
          </Button>
        </Box>
      )}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogTitle>Clear all conversations?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button onClick={handleClearAll} color="error">Clear All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionSidebar;
