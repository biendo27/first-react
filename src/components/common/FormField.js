import React from 'react';
import { TextField, MenuItem, FormHelperText, FormControl, InputLabel, Select } from '@mui/material';
import { useField } from 'formik';

const FormField = ({ label, type = 'text', options, ...props }) => {
  const [field, meta] = useField(props);
  const errorText = meta.error && meta.touched ? meta.error : '';
  
  if (type === 'select') {
    return (
      <FormControl 
        fullWidth 
        error={!!errorText} 
        variant="outlined" 
        margin="normal"
        size="small"
      >
        <InputLabel id={`${props.name}-label`}>{label}</InputLabel>
        <Select
          labelId={`${props.name}-label`}
          label={label}
          {...field}
          {...props}
        >
          {options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {errorText && <FormHelperText>{errorText}</FormHelperText>}
      </FormControl>
    );
  }
  
  return (
    <TextField
      fullWidth
      label={label}
      type={type}
      error={!!errorText}
      helperText={errorText}
      {...field}
      {...props}
      margin="normal"
      size="small"
      variant="outlined"
    />
  );
};

export default FormField; 