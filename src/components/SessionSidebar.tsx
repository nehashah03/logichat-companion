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
  Skeleton,
  Snackbar,
  Alert,
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
  setFavorite,
  setSessions,
  setFullSession,
  setSessionsLoading,
  setActiveSessionLoading,
  setSessionError,
} from "../features/session/sessionSlice";

import { loadMessages, clearMessages } from "../features/chat/chatSlice";

import { formatTimestamp } from "../utils/helpers";
import { searchSessions, ExportFormat } from "../utils/sessionExport";
import { api } from "../services/api";

import { useThemeMode } from "../contexts/ThemeModeContext";
import { useSettingsUi } from "../contexts/SettingsUiContext";

import type { Session } from "../features/session/sessionSlice";

import {
  GROUP_LABELS,
  groupForTimestamp,
  type GroupKey,
} from "../utils/grouping";

const EXPANDED_W = 300;
const COLLAPSED_W = 72;

function toSecondsTimestamp(value: number) {
  return value > 10_000_000_000 ? value / 1000 : value;
}

function toComparableTimestamp(value: number) {
  return value > 10_000_000_000 ? value : value * 1000;
}

function normalizeSession(session: Session): Session {
  return {
    ...session,
    title: session.title || "New Conversation",
    favorite: Boolean(session.favorite),
    messages: session.messages || [],
  };
}

function normalizeSessions(sessions: Session[]): Session[] {
  return sessions.map(normalizeSession);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <Chip
      label={children}
      size="small"
      sx={{
        height: 22,
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
        bgcolor: (theme) => alpha(theme.palette.text.primary, 0.08),
        color: "text.secondary",
        border: "1px solid",
        borderColor: "divider",
        "& .MuiChip-label": { px: 0.75 },
      }}
    />
  );
}

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
  const q = query.trim();

  if (!q) return <>{text}</>;

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

function ChatRowInner({
  session,
  activeSessionId,
  search,
  expanded,
  onSelect,
  onMenu,
  palette,
  mode,
  disabled,
}: {
  session: Session;
  activeSessionId: string | null;
  search: string;
  expanded: boolean;
  onSelect: (id: string) => void;
  onMenu: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  palette: any;
  mode: "light" | "dark";
  disabled?: boolean;
}) {
  return (
    <ListItemButton
      selected={session.id === activeSessionId}
      disabled={disabled}
      onClick={() => onSelect(session.id)}
      sx={{
        borderRadius: 1.5,
        py: 0.85,
        px: 1,
        mb: 0.35,
        alignItems: "flex-start",
        transition: "all 0.18s ease",
        "&.Mui-selected": { bgcolor: palette.bgSelected },
        "&.Mui-selected:hover": { bgcolor: palette.bgSelected },
        "&:hover": { bgcolor: palette.bgHover },
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
              text={session.title || "New Conversation"}
              query={search}
              palette={palette}
              mode={mode}
            />
          </Typography>
        }
        secondary={formatTimestamp(toComparableTimestamp(session.updatedAt))}
        secondaryTypographyProps={{
          fontSize: 10.5,
          color: palette.textMuted,
          sx: { mt: 0.25 },
        }}
        sx={{
          mr: 0.5,
          minWidth: 0,
          my: 0,
        }}
      />

      {expanded && (
        <IconButton
          size="small"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onMenu(event, session.id);
          }}
          sx={{
            color: palette.textMuted,
            mt: -0.25,
            "&:hover": { color: palette.textPrimary },
          }}
        >
          <MoreVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </ListItemButton>
  );
}

const ChatRow = memo(ChatRowInner, (prev, next) => {
  return (
    prev.session.id === next.session.id &&
    prev.session.title === next.session.title &&
    prev.session.favorite === next.session.favorite &&
    prev.session.updatedAt === next.session.updatedAt &&
    prev.activeSessionId === next.activeSessionId &&
    prev.search === next.search &&
    prev.expanded === next.expanded &&
    prev.disabled === next.disabled &&
    prev.palette === next.palette &&
    prev.mode === next.mode
  );
});

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
        <ExpandLessIcon sx={{ fontSize: 18, color: palette.textSecondary, mr: 0.75 }} />
      ) : (
        <ExpandMoreIcon sx={{ fontSize: 18, color: palette.textSecondary, mr: 0.75 }} />
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

function SidebarSkeleton({ palette }: { palette: any }) {
  return (
    <Box sx={{ px: 1, py: 1 }}>
      {Array.from({ length: 9 }).map((_, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Skeleton
            variant="rounded"
            height={38}
            sx={{
              bgcolor: alpha(palette.textPrimary, 0.08),
              borderRadius: 1.5,
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

const SessionSidebar: React.FC = () => {
  const dispatch = useAppDispatch();

  const { openSettings } = useSettingsUi();
  const { palette, mode, toggle } = useThemeMode();

  const {
    sessions,
    activeSessionId,
    isLoading,
    isLoadingActiveSession,
    error: sessionError,
  } = useAppSelector((state) => state.session);

  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [favOpen, setFavOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    id: string;
  } | null>(null);

  const [exportMenuState, setExportMenuState] = useState<{
    top: number;
    left: number;
    id: string;
  } | null>(null);

  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      dispatch(setSessionsLoading(true));
      dispatch(setSessionError(null));

      try {
        const serverSessions = await api.listSessions();

        if (!cancelled) {
          dispatch(setSessions(normalizeSessions(serverSessions as Session[])));
        }
      } catch {
        if (!cancelled) {
          dispatch(setSessionError("Unable to fetch previous chats."));
        }
      } finally {
        if (!cancelled) {
          dispatch(setSessionsLoading(false));
        }
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const filtered = useMemo(
    () => searchSessions(sessions, search),
    [sessions, search],
  );

  const favorites = useMemo(
    () => filtered.filter((session) => session.favorite),
    [filtered],
  );

  const GROUP_ORDER: GroupKey[] = [
    "today",
    "yesterday",
    "last7",
    "last30",
    "older",
  ];

  const recentGroups = useMemo(() => {
    const nonFavorite = filtered.filter((session) => !session.favorite);
    const buckets = new Map<GroupKey, Session[]>();

    for (const session of nonFavorite) {
      const groupKey = groupForTimestamp(toSecondsTimestamp(session.updatedAt));

      if (!buckets.has(groupKey)) {
        buckets.set(groupKey, []);
      }

      buckets.get(groupKey)!.push(session);
    }

    for (const list of buckets.values()) {
      list.sort(
        (a, b) =>
          toComparableTimestamp(b.updatedAt) -
          toComparableTimestamp(a.updatedAt),
      );
    }

    return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
      key,
      label: GROUP_LABELS[key],
      sessions: buckets.get(key)!,
    }));
  }, [filtered]);

  const recentsTotal = useMemo(
    () => recentGroups.reduce((sum, group) => sum + group.sessions.length, 0),
    [recentGroups],
  );

  const selectedMenuSession = useMemo(() => {
    if (!menuAnchor) return null;
    return sessions.find((session) => session.id === menuAnchor.id) || null;
  }, [menuAnchor, sessions]);

  const expandAndFocusSearch = useCallback(() => {
    setExpanded(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, []);

  const handleNewChat = useCallback(async () => {
    dispatch(setSessionError(null));

    try {
      const session = await api.createSession("New Conversation");

      dispatch(createSession(normalizeSession(session as Session)));
      dispatch(clearMessages());
    } catch {
      dispatch(setSessionError("Unable to create new chat."));
    }
  }, [dispatch]);

  const handleSelectSession = useCallback(
    async (id: string) => {
      if (id === activeSessionId && !isLoadingActiveSession) return;

      dispatch(setActiveSession(id));
      dispatch(setActiveSessionLoading(true));
      dispatch(setSessionError(null));

      try {
        const fullSession = normalizeSession((await api.getSession(id)) as Session);

        dispatch(setFullSession(fullSession));
        dispatch(loadMessages(fullSession.messages || []));
      } catch {
        dispatch(setSessionError("Unable to load selected chat."));
      } finally {
        dispatch(setActiveSessionLoading(false));
      }
    },
    [activeSessionId, isLoadingActiveSession, dispatch],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    const deletingActive = deleteTarget === activeSessionId;

    dispatch(deleteSession(deleteTarget));

    if (deletingActive) {
      dispatch(clearMessages());
    }

    setDeleteTarget(null);

    try {
      await api.deleteSession(deleteTarget);
    } catch {
      dispatch(setSessionError("Deleted locally, but backend delete failed."));
    }
  }, [deleteTarget, activeSessionId, dispatch]);

  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>, id: string) => {
      setMenuAnchor({
        el: event.currentTarget,
        id,
      });
    },
    [],
  );

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleRenameClick = () => {
    if (!selectedMenuSession) return;

    setRenameTarget({
      id: selectedMenuSession.id,
      title: selectedMenuSession.title,
    });

    closeMenu();
  };

  const handleRenameSave = async () => {
    if (!renameTarget) return;

    const cleanTitle = renameTarget.title.trim() || "Untitled chat";

    dispatch(renameSession({ id: renameTarget.id, title: cleanTitle }));
    setRenameTarget(null);

    try {
      const updated = normalizeSession(
        (await api.patchSession(renameTarget.id, { title: cleanTitle })) as Session,
      );

      dispatch(setFullSession(updated));
    } catch {
      dispatch(setSessionError("Rename saved locally, but backend update failed."));
    }
  };

  const handleFavoriteClick = async () => {
    if (!selectedMenuSession) return;

    const nextFavorite = !selectedMenuSession.favorite;

    dispatch(
      setFavorite({
        id: selectedMenuSession.id,
        favorite: nextFavorite,
      }),
    );

    closeMenu();

    try {
      const updated = normalizeSession(
        (await api.patchSession(selectedMenuSession.id, {
          favorite: nextFavorite,
        })) as Session,
      );

      dispatch(setFullSession(updated));
    } catch {
      dispatch(setSessionError("Favorite updated locally, but backend update failed."));
    }
  };

  const handleDeleteClick = () => {
    if (menuAnchor) {
      setDeleteTarget(menuAnchor.id);
    }

    closeMenu();
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setExportMenuState({
      top: rect.top,
      left: rect.right + 6,
      id: menuAnchor?.id || "",
    });

    closeMenu();
  };

  const handleExportFormat = (fmt: ExportFormat) => {
    if (!exportMenuState) return;

    window.open(
      api.exportUrl(exportMenuState.id, fmt),
      "_blank",
      "noopener,noreferrer",
    );

    setExportMenuState(null);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        handleNewChat();
      }

      if (mod && event.key.toLowerCase() === "o") {
        event.preventDefault();
        expandAndFocusSearch();
      }
    };

    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [handleNewChat, expandAndFocusSearch]);

  const width = expanded ? EXPANDED_W : COLLAPSED_W;
  const isDark = mode === "dark";
  const accentIcon = isDark ? "#523cfb" : palette.primary;

  const brandLogoBg = isDark
    ? `linear-gradient(145deg, ${palette.primary} 0%, ${
        palette.userAccent || palette.primary
      } 100%)`
    : palette.primary;

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
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

            <Typography sx={{ fontWeight: 700, fontSize: 15, color: palette.textPrimary, letterSpacing: "-0.02em" }}>
              Logic Chat
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} theme`}>
              <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
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
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.85, py: 1.25, px: 0.5 }}>
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
                "&:hover": { transform: "scale(1.04)" },
              }}
            >
              <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
          </Tooltip>

          <Tooltip title="New chat" placement="right">
            <IconButton onClick={handleNewChat} size="small" sx={{ color: accentIcon }}>
              <AddIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Search chats (Ctrl+O)" placement="right">
            <IconButton onClick={expandAndFocusSearch} size="small" sx={{ color: palette.textSecondary }}>
              <SearchIcon />
            </IconButton>
          </Tooltip>

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

      {expanded && (
        <>
          <Box sx={{ px: 1, pt: 1, pb: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
            <Box component="button" type="button" sx={{ ...actionRowSx, border: "none", background: "none", width: "100%", textAlign: "left" }} onClick={handleNewChat}>
              <AddIcon sx={{ fontSize: 20, color: accentIcon }} />
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
                New chat
              </Typography>
            </Box>

            <Box component="button" type="button" sx={{ ...actionRowSx, border: "none", background: "none", width: "100%", textAlign: "left" }} onClick={expandAndFocusSearch}>
              <SearchIcon sx={{ fontSize: 20, color: palette.textSecondary }} />
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
                Search chats
              </Typography>
              <Kbd>Ctrl+O</Kbd>
            </Box>

            <Tooltip title="Coming soon">
              <Box sx={{ ...actionRowSx, opacity: 0.55, cursor: "default" }}>
                <PhotoLibraryOutlinedIcon sx={{ fontSize: 20, color: palette.textSecondary }} />
                <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>
                  Library
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          <Box sx={{ px: 1.5, pb: 1 }}>
            <TextField
              inputRef={searchInputRef}
              size="small"
              fullWidth
              placeholder="Filter chats..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: palette.textSecondary }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: 13,
                  bgcolor: palette.bgInput,
                  color: palette.textPrimary,
                  borderRadius: 2,
                  "& fieldset": { borderColor: palette.border },
                  "&:hover fieldset": { borderColor: palette.borderStrong },
                  "&.Mui-focused fieldset": { borderColor: palette.primary },
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: palette.border, my: 0.5 }} />
        </>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          px: expanded ? 0.75 : 0.25,
          py: 0.5,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(palette.textPrimary, 0.15),
            borderRadius: 3,
          },
        }}
      >
        {!expanded ? (
          <Box sx={{ flex: 1, minHeight: 48 }} aria-hidden />
        ) : isLoading ? (
          <SidebarSkeleton palette={palette} />
        ) : (
          <>
            <SectionHeader
              title="Favorites"
              open={favOpen}
              onToggle={() => setFavOpen((prev) => !prev)}
              palette={palette}
            />

            <Collapse in={favOpen}>
              <List dense disablePadding sx={{ px: 0.5, pb: 1 }}>
                {favorites.length === 0 ? (
                  <Typography sx={{ fontSize: 11.5, px: 1, py: 0.75, color: palette.textSecondary }}>
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
                      disabled={isLoadingActiveSession}
                    />
                  ))
                )}
              </List>
            </Collapse>

            <SectionHeader
              title="Chats"
              open={recentOpen}
              onToggle={() => setRecentOpen((prev) => !prev)}
              palette={palette}
            />

            <Collapse in={recentOpen}>
              {recentsTotal === 0 ? (
                <Typography sx={{ fontSize: 11.5, px: 1.5, py: 0.75, color: palette.textSecondary }}>
                  {search.trim()
                    ? filtered.length === 0
                      ? "No matches found."
                      : "No matches in chats."
                    : favorites.length > 0
                      ? "All chats are in Favorites."
                      : "No chats yet — start with New chat."}
                </Typography>
              ) : (
                recentGroups.map((group) => (
                  <Box key={group.key} sx={{ mb: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        color: palette.textMuted,
                        px: 1.5,
                        pt: 0.75,
                        pb: 0.25,
                      }}
                    >
                      {group.label}
                    </Typography>

                    <List dense disablePadding sx={{ px: 0.5, pb: 0.5 }}>
                      {group.sessions.map((session) => (
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
                          disabled={isLoadingActiveSession}
                        />
                      ))}
                    </List>
                  </Box>
                ))
              )}
            </Collapse>
          </>
        )}
      </Box>

      <Divider sx={{ borderColor: palette.border }} />

      <Box sx={{ p: expanded ? 1.5 : 1, display: "flex", justifyContent: expanded ? "stretch" : "center" }}>
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
            <IconButton onClick={openSettings} sx={{ color: palette.primary }} aria-label="Settings">
              <SettingsOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 190, borderRadius: 2 } }}
      >
        <MenuItem onClick={handleFavoriteClick}>
          <ListItemIcon>
            {selectedMenuSession?.favorite ? (
              <StarIcon sx={{ fontSize: 18, color: palette.warning }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 18 }} />
            )}
          </ListItemIcon>

          {selectedMenuSession?.favorite
            ? "Remove from Favorites"
            : "Add to Favorites"}
        </MenuItem>

        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <EditIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Rename
        </MenuItem>

        <MenuItem onClick={handleExportClick}>
          <ListItemIcon>
            <DownloadIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          Export
        </MenuItem>

        <MenuItem onClick={handleDeleteClick} sx={{ color: palette.error }}>
          <ListItemIcon>
            <DeleteOutlineIcon sx={{ fontSize: 18, color: palette.error }} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Menu
        open={Boolean(exportMenuState)}
        onClose={() => setExportMenuState(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          exportMenuState
            ? { top: exportMenuState.top, left: exportMenuState.left }
            : undefined
        }
        PaperProps={{ sx: { minWidth: 180, borderRadius: 2 } }}
      >
        <MenuItem onClick={() => handleExportFormat("md")}>Markdown (.md)</MenuItem>
        <MenuItem onClick={() => handleExportFormat("txt")}>Plain text (.txt)</MenuItem>
        <MenuItem onClick={() => handleExportFormat("json")}>JSON (.json)</MenuItem>
      </Menu>

      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rename conversation</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="Title"
            value={renameTarget?.title || ""}
            onChange={(event) =>
              setRenameTarget((prev) =>
                prev ? { ...prev, title: event.target.value } : prev,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
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

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontSize: 16 }}>Delete this conversation?</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            This chat will be removed permanently. Do you confirm?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined" size="small">
            No
          </Button>

          <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(sessionError)}
        autoHideDuration={5000}
        onClose={() => dispatch(setSessionError(null))}
      >
        <Alert
          severity="error"
          onClose={() => dispatch(setSessionError(null))}
          sx={{ fontSize: 12 }}
        >
          {sessionError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionSidebar;