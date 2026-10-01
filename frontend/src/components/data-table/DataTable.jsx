import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  TablePagination,
  Box,
  CircularProgress,
  Typography,
  Stack,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Generic, reusable data table with server-side pagination/sorting.
 * Feature pages configure `columns` and pass paginated data + handlers -
 * no business logic lives here.
 *
 * columns: [{ field, headerName, sortable?, render?(row) }]
 *
 * On small screens each row is rendered as a stacked card instead of a
 * horizontally-scrolling table row. Columns with a blank `headerName`
 * (e.g. an actions column) are rendered without a label as a card footer.
 */
export default function DataTable({
  columns,
  rows,
  totalCount,
  page,
  pageSize,
  sortBy,
  sortOrder,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  getRowId = (row) => row.id,
  emptyMessage = 'No records found',
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const renderCell = (col, row) => (col.render ? col.render(row) : row[col.field]);

  const renderCards = () => {
    if (!isLoading && rows.length === 0) {
      return (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {emptyMessage}
        </Typography>
      );
    }

    return (
      <Stack spacing={1.5} sx={{ p: 1.5 }}>
        {rows.map((row) => {
          const labelled = columns.filter((c) => c.headerName);
          const unlabelled = columns.filter((c) => !c.headerName);
          return (
            <Paper key={getRowId(row)} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1} divider={<Divider flexItem />}>
                {labelled.map((col) => (
                  <Stack
                    key={col.field}
                    direction="row"
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', flexShrink: 0, pt: 0.25 }}
                    >
                      {col.headerName}
                    </Typography>
                    <Box sx={{ textAlign: 'right', minWidth: 0 }}>{renderCell(col, row)}</Box>
                  </Stack>
                ))}
              </Stack>
              {unlabelled.length > 0 && (
                <Box
                  sx={{
                    mt: 1.5,
                    pt: 1,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  {unlabelled.map((col) => (
                    <Box key={col.field}>{renderCell(col, row)}</Box>
                  ))}
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -18px rgba(37,99,235,0.35)',
      }}
    >
      <Box sx={{ position: 'relative', minHeight: 200 }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              opacity: 0.7,
              zIndex: 1,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {isMobile ? (
          renderCards()
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table
              size="medium"
              sx={{
                minWidth: 650,
                '& .MuiTableCell-root': { whiteSpace: 'nowrap' },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  background: (t) =>
                    t.palette.mode === 'dark' ? 'rgba(37,99,235,0.14)' : 'rgba(37,99,235,0.06)',
                  color: 'text.secondary',
                  fontWeight: 700,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': {
                  borderBottom: 'none',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.field}>
                      {col.sortable ? (
                        <TableSortLabel
                          active={sortBy === col.field}
                          direction={sortBy === col.field ? sortOrder.toLowerCase() : 'asc'}
                          onClick={() => onSortChange?.(col.field)}
                        >
                          {col.headerName}
                        </TableSortLabel>
                      ) : (
                        col.headerName
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        {emptyMessage}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={getRowId(row)} hover>
                    {columns.map((col) => (
                      <TableCell key={col.field}>{renderCell(col, row)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          '.MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'center' },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
        }}
      />
    </Paper>
  );
}
