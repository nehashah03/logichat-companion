import React, { useState } from 'react';
import { Box, Typography, Button, Collapse, Chip, Link } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { ProcessingStep, SourceDoc, Citation } from '../features/chat/chatSlice';

interface EventsSourcesPanelProps {
  processingSteps?: ProcessingStep[];
  sources?: SourceDoc[];
  citations?: Citation[];
}

const EventsSourcesPanel: React.FC<EventsSourcesPanelProps> = ({ processingSteps, sources, citations }) => {
  const [eventsOpen, setEventsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const hasEvents = processingSteps && processingSteps.length > 0;
  const hasSources = sources && sources.length > 0;

  if (!hasEvents && !hasSources) return null;

  return (
    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {hasEvents && (
        <Box sx={{ flex: '1 1 auto' }}>
          <Button
            size="small"
            onClick={() => setEventsOpen(!eventsOpen)}
            startIcon={eventsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              fontSize: 12, color: '#1976d2', textTransform: 'none',
              border: '1px solid #E5E7EB', borderRadius: '20px', px: 2, py: 0.25,
              '&:hover': { bgcolor: '#F0F7FF' },
            }}
          >
            Events
          </Button>
          <Collapse in={eventsOpen}>
            <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid #E5E7EB' }}>
              {processingSteps!.map(step => (
                <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>✓</Typography>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{step.label}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#888' }}>{step.description}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      {hasSources && (
        <Box sx={{ flex: '1 1 auto' }}>
          <Button
            size="small"
            onClick={() => setSourcesOpen(!sourcesOpen)}
            startIcon={sourcesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              fontSize: 12, color: '#1976d2', textTransform: 'none',
              border: '1px solid #E5E7EB', borderRadius: '20px', px: 2, py: 0.25,
              '&:hover': { bgcolor: '#F0F7FF' },
            }}
          >
            Sources
          </Button>
          <Collapse in={sourcesOpen}>
            <Box sx={{ mt: 1 }}>
              {sources!.map((src, i) => (
                <Box key={i} sx={{
                  display: 'flex', gap: 1, p: 1.5, mb: 1,
                  border: '1px solid #E5E7EB', borderRadius: '8px', bgcolor: '#FAFAFA',
                }}>
                  <DescriptionOutlinedIcon sx={{ fontSize: 18, color: '#666', mt: 0.25 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link href={src.url || '#'} underline="hover" sx={{ fontSize: 12.5, fontWeight: 500, color: '#1976d2' }}>
                      {src.name}
                    </Link>
                    <Typography sx={{ fontSize: 11.5, color: '#666', mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {src.snippet}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {citations && citations.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#666', mb: 0.5 }}>Citations</Typography>
                  {citations.map(c => (
                    <Box key={c.index} sx={{ display: 'flex', gap: 0.75, mb: 0.5, alignItems: 'flex-start' }}>
                      <Chip label={c.index} size="small" sx={{ height: 18, fontSize: 10, minWidth: 18, bgcolor: '#E3F2FD', color: '#1976d2' }} />
                      <Typography sx={{ fontSize: 11.5, color: '#555' }}>
                        {c.text} — <em style={{ color: '#1976d2' }}>{c.source}</em>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default EventsSourcesPanel;
