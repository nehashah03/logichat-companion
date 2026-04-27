// import React, { useState } from 'react';
// import { Box, Typography, Collapse, Link, Chip } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import ExpandLessIcon from '@mui/icons-material/ExpandLess';
// import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
// import { useThemeMode } from '../contexts/ThemeModeContext';
// import type { SourceDoc, Citation } from '../features/chat/chatSlice';

// interface Props {
//   sources?: SourceDoc[];
//   citations?: Citation[];
//   defaultOpen?: boolean;
// }

// const SourcesPanel: React.FC<Props> = ({ sources, citations, defaultOpen = false }) => {
//   const { palette } = useThemeMode();
//   const [open, setOpen] = useState(defaultOpen);

//   if (!sources?.length) return null;

//   return (
//     <Box sx={{
//       border: '1px solid', borderColor: palette.border, borderRadius: '10px',
//       overflow: 'hidden',
//     }}>
//       <Box
//         onClick={() => setOpen(o => !o)}
//         sx={{
//           display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.85, cursor: 'pointer',
//           '&:hover': { bgcolor: palette.bgHover },
//         }}
//       >
//         {open ? <ExpandLessIcon sx={{ fontSize: 16, color: palette.textMuted }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: palette.textMuted }} />}
//         <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: palette.textPrimary }}>Sources</Typography>
//         <Typography sx={{ fontSize: 11, color: palette.textMuted }}>· {sources.length}</Typography>
//       </Box>
//       <Collapse in={open}>
//         <Box sx={{ p: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
//           {sources.map(src => {
//             const citationsForSrc = citations?.filter(c => c.sourceId === src.id) || [];
//             return (
//               <Box key={src.id} sx={{
//                 display: 'flex', gap: 1, p: 1.25,
//                 border: '1px solid', borderColor: palette.border, borderRadius: '8px',
//                 bgcolor: palette.bgInput,
//               }}>
//                 <DescriptionOutlinedIcon sx={{ fontSize: 18, color: palette.primary, mt: 0.25 }} />
//                 <Box sx={{ flex: 1, minWidth: 0 }}>
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
//                     <Link href={src.url || '#'} underline="hover" sx={{ fontSize: 12.5, fontWeight: 600, color: palette.primary }}>
//                       {src.name}
//                     </Link>
//                     {src.page && (
//                       <Typography sx={{ fontSize: 10.5, color: palette.textMuted }}>p. {src.page}</Typography>
//                     )}
//                     {citationsForSrc.map(c => (
//                       <Chip
//                         key={c.index} label={c.index} size="small"
//                         sx={{
//                           height: 16, fontSize: 10, minWidth: 16,
//                           bgcolor: palette.primarySoft, color: palette.primary, fontWeight: 600,
//                         }}
//                       />
//                     ))}
//                   </Box>
//                   <Typography sx={{ fontSize: 11.5, color: palette.textSecondary, mt: 0.4, lineHeight: 1.45 }}>
//                     {src.snippet}
//                   </Typography>
//                 </Box>
//               </Box>
//             );
//           })}
//         </Box>
//       </Collapse>
//     </Box>
//   );
// };

// export default SourcesPanel;

import React, { useState } from "react";
import {
  Box,
  Typography,
  Collapse,
  Link,
  Chip,
  Tooltip,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import { useThemeMode } from "../contexts/ThemeModeContext";
import type { SourceDoc, Citation } from "../features/chat/chatSlice";

/* ============================================================
   SOURCES PANEL

   Used under assistant messages after backend sends:
   {
     type: "sources",
     sources: [...],
     citations: [...]
   }

   This component is display-only.
   It should not fetch anything and should not know about websocket/session.
   ============================================================ */

interface Props {
  sources?: SourceDoc[];
  citations?: Citation[];
  defaultOpen?: boolean;
}

const SourcesPanel: React.FC<Props> = ({
  sources,
  citations,
  defaultOpen = false,
}) => {
  const { palette } = useThemeMode();
  const [open, setOpen] = useState(defaultOpen);

  if (!sources?.length) return null;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: palette.border,
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((value) => !value)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.85,
          cursor: "pointer",
          "&:hover": {
            bgcolor: palette.bgHover,
          },
        }}
      >
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 16, color: palette.textMuted }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 16, color: palette.textMuted }} />
        )}

        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 600,
            color: palette.textPrimary,
          }}
        >
          Sources
        </Typography>

        <Typography sx={{ fontSize: 11, color: palette.textMuted }}>
          · {sources.length}
        </Typography>
      </Box>

      <Collapse in={open}>
        <Box
          sx={{
            p: 1.25,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {sources.map((source) => {
            const citationsForSource =
              citations?.filter((item) => item.sourceId === source.id) || [];

            const hasRealUrl =
              Boolean(source.url) &&
              source.url !== "#" &&
              source.url !== "about:blank";

            return (
              <Box
                key={source.id}
                sx={{
                  display: "flex",
                  gap: 1,
                  p: 1.25,
                  border: "1px solid",
                  borderColor: palette.border,
                  borderRadius: "8px",
                  bgcolor: palette.bgInput,
                }}
              >
                <DescriptionOutlinedIcon
                  sx={{
                    fontSize: 18,
                    color: palette.primary,
                    mt: 0.25,
                    flexShrink: 0,
                  }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      flexWrap: "wrap",
                    }}
                  >
                    {hasRealUrl ? (
                      <Tooltip title={source.name}>
                        <Link
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: palette.primary,
                            maxWidth: 260,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {source.name}
                        </Link>
                      </Tooltip>
                    ) : (
                      <Tooltip title={source.name}>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: palette.textPrimary,
                            maxWidth: 260,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {source.name}
                        </Typography>
                      </Tooltip>
                    )}

                    {source.page !== undefined && source.page !== null && (
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: palette.textMuted,
                        }}
                      >
                        p. {source.page}
                      </Typography>
                    )}

                    {citationsForSource.map((citation) => (
                      <Tooltip key={citation.index} title={citation.text}>
                        <Chip
                          label={citation.index}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 10,
                            minWidth: 16,
                            bgcolor: palette.primarySoft,
                            color: palette.primary,
                            fontWeight: 600,
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>

                  {source.snippet && (
                    <Typography
                      title={source.snippet}
                      sx={{
                        fontSize: 11.5,
                        color: palette.textSecondary,
                        mt: 0.4,
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {source.snippet}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SourcesPanel;