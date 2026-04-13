import React, { useCallback, useState } from 'react';
import {
  Box, List, ListItemButton, ListItemText, Typography, IconButton,
  Button, Divider, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createSession, setActiveSession, deleteSession } from '../features/session/sessionSlice';
import { loadMessages, clearMessages } from '../features/chat/chatSlice';
import { generateId, formatTimestamp } from '../utils/helpers';

const SessionSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessions, activeSessionId } = useAppSelector(s => s.session);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      dispatch(deleteSession(deleteTarget));
      if (deleteTarget === activeSessionId) {
        dispatch(clearMessages());
      }
      setDeleteTarget(null);
    }
  }, [deleteTarget, activeSessionId, dispatch]);

  return (
    <Box sx={{
      width: 260, height: '100vh', display: 'flex', flexDirection: 'column',
      bgcolor: '#F9FAFB', borderRight: '1px solid', borderColor: '#E5E7EB',
    }}>
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#666', letterSpacing: '0.5px', textTransform: 'uppercase', flex: 1 }}>
          Chat History
        </Typography>
      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <Button
          fullWidth variant="text" startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={handleNewChat}
          sx={{
            color: '#333', justifyContent: 'flex-start', fontSize: 13, py: 0.75,
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider sx={{ borderColor: '#E5E7EB' }} />

      <Box sx={{ flex: 1, overflow: 'auto', px: 0.75, py: 0.75 }}>
        <List dense disablePadding>
          {sessions.map(session => (
            <ListItemButton
              key={session.id}
              selected={session.id === activeSessionId}
              onClick={() => handleSelectSession(session.id)}
              sx={{
                borderRadius: '6px', mb: 0.25, px: 1.5, py: 0.75, minHeight: 36,
                '&.Mui-selected': { bgcolor: 'rgba(25,118,210,0.08)' },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                '& .delete-btn': { opacity: 0 },
                '&:hover .delete-btn': { opacity: 1 },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 1.5, color: '#999' }} />
              <ListItemText
                primary={session.title}
                secondary={formatTimestamp(session.updatedAt)}
                primaryTypographyProps={{ noWrap: true, fontSize: 12.5, fontWeight: 400, color: '#333' }}
                secondaryTypographyProps={{ fontSize: 10, color: '#999' }}
              />
              <IconButton className="delete-btn" size="small"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(session.id); }}
                sx={{ color: '#999', '&:hover': { color: '#d32f2f' } }}>
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
        {sessions.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#999', fontSize: 12 }}>No conversations yet</Typography>
          </Box>
        )}
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontSize: 15 }}>Delete conversation?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            This will permanently delete this conversation. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#666' }}>No</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small">Yes, Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionSidebar;
