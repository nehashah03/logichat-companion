/**
 * Markdown table → interactive table.
 *
 * Features per column header:
 *   • click header to sort asc / desc / none
 *   • per-column text filter input
 *
 * Lightweight (no external grid dep). Used by MessageBubble's
 * react-markdown `table` renderer.
 */
import React, { useMemo, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useThemeMode } from '../contexts/ThemeModeContext';

type SortDir = 'asc' | 'desc' | null;

function flattenText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (node.props?.children) return flattenText(node.props.children);
  return '';
}

/** Pull header strings + row data from react-markdown's <thead>/<tbody>. */
function parseTable(children: React.ReactNode): { headers: string[]; rows: React.ReactNode[][] } {
  const arr = React.Children.toArray(children) as any[];
  let headers: string[] = [];
  const rows: React.ReactNode[][] = [];
  for (const section of arr) {
    const tag = section.type;
    const sectionChildren = React.Children.toArray(section.props?.children) as any[];
    if (tag === 'thead') {
      for (const tr of sectionChildren) {
        const cells = React.Children.toArray(tr.props?.children) as any[];
        headers = cells.map(c => flattenText(c.props?.children).trim());
      }
    } else if (tag === 'tbody') {
      for (const tr of sectionChildren) {
        const cells = React.Children.toArray(tr.props?.children) as any[];
        rows.push(cells.map(c => c.props?.children));
      }
    }
  }
  return { headers, rows };
}

const InteractiveTable: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { palette } = useThemeMode();
  const { headers, rows } = useMemo(() => parseTable(children), [children]);
  const [filters, setFilters] = useState<string[]>(() => headers.map(() => ''));
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const filtered = useMemo(() => {
    let r = rows.filter(row =>
      row.every((cell, i) => {
        const f = (filters[i] || '').toLowerCase().trim();
        if (!f) return true;
        return flattenText(cell).toLowerCase().includes(f);
      }),
    );
    if (sortCol !== null && sortDir) {
      r = [...r].sort((a, b) => {
        const av = flattenText(a[sortCol]); const bv = flattenText(b[sortCol]);
        const an = parseFloat(av); const bn = parseFloat(bv);
        const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, filters, sortCol, sortDir]);

  const toggleSort = (i: number) => {
    if (sortCol !== i) { setSortCol(i); setSortDir('asc'); return; }
    setSortDir(d => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
  };

  if (!headers.length) return <table>{children}</table>;

  return (
    <Box sx={{ my: 1.5, overflowX: 'auto', border: '1px solid', borderColor: palette.border, borderRadius: '8px' }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                background: palette.bgCodeHeader, color: palette.textPrimary, fontWeight: 600,
                padding: '8px 10px', borderBottom: `1px solid ${palette.border}`,
                textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
              }} onClick={() => toggleSort(i)}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  {h}
                  {sortCol === i && sortDir === 'asc' && <ArrowUpwardIcon sx={{ fontSize: 12 }} />}
                  {sortCol === i && sortDir === 'desc' && <ArrowDownwardIcon sx={{ fontSize: 12 }} />}
                  {sortCol !== i && <UnfoldMoreIcon sx={{ fontSize: 12, opacity: 0.4 }} />}
                </Box>
              </th>
            ))}
          </tr>
          <tr>
            {headers.map((_, i) => (
              <th key={i} style={{ padding: '4px 6px', background: palette.bgCodeHeader, borderBottom: `1px solid ${palette.border}` }}>
                <TextField
                  size="small" variant="standard" placeholder="filter…"
                  value={filters[i] || ''}
                  onChange={(e) => setFilters(f => { const n = [...f]; n[i] = e.target.value; return n; })}
                  onClick={(e) => e.stopPropagation()}
                  InputProps={{ sx: { fontSize: 11, color: palette.textSecondary } }}
                  sx={{ width: '100%' }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '8px 10px', borderBottom: `1px solid ${palette.border}`,
                  color: palette.textSecondary,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={headers.length} style={{ padding: 14, textAlign: 'center', color: palette.textMuted }}>
              <Typography sx={{ fontSize: 12 }}>No rows match the filters</Typography>
            </td></tr>
          )}
        </tbody>
      </Box>
    </Box>
  );
};

export default InteractiveTable;