import React, { useState } from 'react';
import { Popover, Box, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useThemeMode } from '../contexts/ThemeModeContext';
import type { SourceDoc } from '../features/chat/chatSlice';

interface Props {
  index: number;
  source?: SourceDoc;
}

/** Inline [N] citation chip with hover-popover preview, like in the reference UI. */
const CitationChip: React.FC<Props> = ({ index, source }) => {
  const { palette } = useThemeMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Box
        component="sup"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 16, height: 16, px: 0.5, mx: 0.25, borderRadius: '4px',
          bgcolor: palette.primarySoft, color: palette.primary,
          fontSize: 10, fontWeight: 700, cursor: 'pointer', verticalAlign: 'middle',
          '&:hover': { bgcolor: palette.primary, color: palette.textOnPrimary },
        }}
      >
        {index}
      </Box>
      <Popover
        open={!!anchor && !!source}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { maxWidth: 360, borderRadius: '10px', border: '1px solid', borderColor: palette.border, bgcolor: palette.bgAssistantBubble } } }}
      >
        {source && (
          <Box sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <DescriptionOutlinedIcon sx={{ fontSize: 15, color: palette.primary }} />
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: palette.primary }}>
                {source.name}
              </Typography>
              {source.page && (
                <Typography sx={{ fontSize: 10.5, color: palette.textMuted }}>p. {source.page}</Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: 11.5, color: palette.textSecondary, lineHeight: 1.5 }}>
              {source.snippet}
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default CitationChip;
