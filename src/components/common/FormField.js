import React, { useState, useEffect } from 'react';
import { TextField, FormHelperText, FormControl, CircularProgress, Autocomplete } from '@mui/material';
import { useField } from 'formik';

const FormField = ({ label, type = 'text', options, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const [inputValue, setInputValue] = useState('');
  const [previousOptions, setPreviousOptions] = useState([]);
  const errorText = meta.error && meta.touched ? meta.error : '';
  
  // Use effect to cache options for future reference
  useEffect(() => {
    if (options && options.length > 0) {
      setPreviousOptions(prevOpts => {
        // Merge new options with previous ones to build a comprehensive cache
        const optionMap = new Map([
          ...prevOpts.map(opt => [opt.value, opt]),
          ...options.map(opt => [opt.value, opt])
        ]);
        return Array.from(optionMap.values());
      });
    }
  }, [options]);
  
  if (type === 'select') {
    // Find the selected option object
    // First check in current options, then in previously cached options
    const selectedOption = 
      options?.find(option => option.value === field.value) || 
      previousOptions.find(option => option.value === field.value) || 
      null;
    
    return (
      <FormControl 
        fullWidth 
        error={!!errorText} 
        variant="outlined" 
        margin="normal"
        size="small"
      >
        <Autocomplete
          id={props.name}
          options={options || []}
          getOptionLabel={(option) => option.label || ''}
          value={selectedOption}
          inputValue={inputValue}
          onChange={(_, newValue) => {
            helpers.setValue(newValue ? newValue.value : '');
          }}
          onInputChange={(_, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onBlur={() => helpers.setTouched(true)}
          disableClearable={!!props.required}
          disabled={props.disabled}
          loading={props.loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!errorText}
              required={props.required}
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {props.loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
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