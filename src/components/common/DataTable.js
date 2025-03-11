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
  renderActions,
}) => {
  const { t } = useTranslation('common');

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
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell>{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} align="center">
                  {t('noData')}
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
                      <TableCell key={column.id}>
                        {value}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    {renderActions ? (
                      renderActions(row)
                    ) : (
                      <Box>
                        {onEdit && (
                          <Tooltip title={t('edit')}>
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
                          <Tooltip title={t('delete')}>
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
                    )}
                  </TableCell>
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
  renderActions: PropTypes.func,
};

export default DataTable; 