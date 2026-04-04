import React, { useCallback } from 'react';
import {
  Box, List, ListItemButton, ListItemText, Typography, IconButton,
  Button, Divider, Tooltip, Dialog, DialogTitle, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createSession, setActiveSession, deleteSession, clearAllSessions } from '../features/session/sessionSlice';
import { loadMessages, clearMessages } from '../features/chat/chatSlice';
import { generateId, formatTimestamp } from '../utils/helpers';

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
      width: 260, height: '100vh', display: 'flex', flexDirection: 'column',
      bgcolor: '#1E1E1E', borderRight: '1px solid', borderColor: '#2D2D2D',
    }}>
      {/* Header - clean, no icon */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#808080', letterSpacing: '0.5px', textTransform: 'uppercase', flex: 1 }}>
          Chat History
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <Button
          fullWidth variant="text" startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={handleNewChat}
          sx={{
            color: '#E8E8E8', justifyContent: 'flex-start', fontSize: 13, py: 0.75,
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider sx={{ borderColor: '#2D2D2D' }} />

      <Box sx={{ flex: 1, overflow: 'auto', px: 0.75, py: 0.75 }}>
        <List dense disablePadding>
          {sessions.map(session => (
            <ListItemButton
              key={session.id}
              selected={session.id === activeSessionId}
              onClick={() => handleSelectSession(session.id)}
              sx={{
                borderRadius: '6px', mb: 0.25, px: 1.5, py: 0.75, minHeight: 36,
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.08)' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                '& .delete-btn': { opacity: 0 },
                '&:hover .delete-btn': { opacity: 1 },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 1.5, color: '#666' }} />
              <ListItemText
                primary={session.title}
                secondary={formatTimestamp(session.updatedAt)}
                primaryTypographyProps={{ noWrap: true, fontSize: 12.5, fontWeight: 400, color: '#CCC' }}
                secondaryTypographyProps={{ fontSize: 10, color: '#666' }}
              />
              <IconButton className="delete-btn" size="small" onClick={(e) => handleDeleteSession(e, session.id)}
                sx={{ color: '#666', '&:hover': { color: '#FF6B6B' } }}>
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
        {sessions.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#555', fontSize: 12 }}>No conversations yet</Typography>
          </Box>
        )}
      </Box>

      {sessions.length > 0 && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: '#2D2D2D' }}>
          <Button
            fullWidth size="small" startIcon={<DeleteSweepIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => setConfirmClear(true)}
            sx={{ color: '#666', fontSize: 11, '&:hover': { color: '#FF6B6B' } }}
          >
            Clear History
          </Button>
        </Box>
      )}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}
        PaperProps={{ sx: { bgcolor: '#252525', border: '1px solid #333' } }}>
        <DialogTitle sx={{ fontSize: 14 }}>Clear all conversations?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)} sx={{ color: '#808080' }}>Cancel</Button>
          <Button onClick={handleClearAll} sx={{ color: '#FF6B6B' }}>Clear All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionSidebar;
