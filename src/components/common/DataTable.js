import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  CircularProgress,
  Box,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

const DataTable = ({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  disableActions,
  emptyMessage,
}) => {
  const { t } = useTranslation('common');
  
  // Check if the columns array already includes an actions column
  const hasActionsColumn = columns.some(col => col.id === 'actions');
  
  // Only show the default actions column if there isn't already an actions column
  // and actions are needed (onEdit or onDelete provided and not disabled)
  const showDefaultActions = !hasActionsColumn && !disableActions && (onEdit || onDelete);
  
  // Total columns including potential default actions column
  const totalColumns = showDefaultActions ? columns.length + 1 : columns.length;

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth }}
                  align={column.align}
                >
                  {column.label}
                </TableCell>
              ))}
              {showDefaultActions && (
                <TableCell align="center">{t('actions')}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={totalColumns} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns} align="center">
                  {emptyMessage || t('noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                  {columns.map((column) => {
                    const value = column.render
                      ? column.render(row)
                      : row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {value}
                      </TableCell>
                    );
                  })}
                  {showDefaultActions && (
                    <TableCell align="center">
                      <Box>
                        {onEdit && (
                          <Tooltip title={t('edit', { resource: '' })}>
                            <IconButton
                              size="small"
                              onClick={() => onEdit(row)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title={t('delete', { resource: '' })}>
                            <IconButton
                              size="small"
                              onClick={() => onDelete(row)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalCount}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={(e) => onPageSizeChange(e.target.value)}
        labelRowsPerPage={t('rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) => 
          `${t('page')} ${page + 1} ${t('of')} ${Math.ceil(count / pageSize)}`
        }
      />
    </Paper>
  );
};

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  totalCount: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  disableActions: PropTypes.bool,
  emptyMessage: PropTypes.string,
};

export default DataTable; 