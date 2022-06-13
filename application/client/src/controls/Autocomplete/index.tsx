import { useMemo, useState, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import {
  Control,
  Controller,
  ControllerRenderProps,
  FieldValues,
} from "react-hook-form";
import {
  Box,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { LocationOn as LocationOnIcon } from "@mui/icons-material";
import throttle from "lodash.throttle";
import classes from "@controls/Autocomplete/style.module.css";
import { Address } from "@api/endpoints";

interface AutocompleteInputProps {
  control: Control;
  name: string;
  label: string;
  identifier: string;
  disabled: boolean;
  error: boolean;
  helperText: string;
  fetchingLabel?: string;
  placeholderLabel?: string;
  emptyLabel?: string;
  multiple?: boolean;
  fetchData: (location: string) => Promise<Address[]>;
}

export const AutocompleteInput = ({
  control,
  name,
  identifier,
  label,
  error,
  helperText,
  multiple = false,
  disabled = false,
  fetchingLabel = "Fetching results...",
  placeholderLabel = "Start typing to fetch results",
  emptyLabel = "No results found",
  fetchData,
}: AutocompleteInputProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [options, setOptions] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const setStateInBatch = (isLoading = loading, newOptions = options) => {
    setLoading(isLoading);
    setOptions(newOptions);
  };

  const renderNoOptionsText = () => {
    if (loading) {
      return fetchingLabel;
    }
    if (inputValue && !options.length) {
      return emptyLabel;
    }
    return placeholderLabel;
  };

  const determineClassName = (
    field: ControllerRenderProps<FieldValues, string>
  ) => {
    if (multiple && !field.value.length) {
      return classes.loadingSpinner;
    } else if (!multiple && !field.value) {
      return classes.loadingSpinner;
    }
    return "";
  };

  const throttleFetch = useMemo(
    () =>
      throttle(
        async (request) => {
          const data = await fetchData(request?.input);
          setStateInBatch(false, data);
          return data;
        },
        500,
        { leading: false, trailing: true }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (isOpen) {
      if (inputValue === "") {
        setStateInBatch(false, []);
        return;
      }

      setStateInBatch(true, []);
      throttleFetch({ input: inputValue });
      return;
    }
    setStateInBatch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, isOpen]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          {...field}
          disableClearable={!field.value}
          className={classes.autocompleteInput}
          multiple={multiple}
          filterOptions={(x) => x}
          options={options}
          autoComplete
          includeInputInList
          filterSelectedOptions
          value={field.value}
          autoHighlight={true}
          noOptionsText={renderNoOptionsText()}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option[identifier]
          }
          onChange={(_event, newValue) => {
            setOptions(options);
            field.onChange(newValue);
          }}
          onInputChange={(_event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          renderInput={(params) => (
            <TextField
              {...params}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && (
                      <CircularProgress
                        className={determineClassName(field)}
                        color="inherit"
                        size={20}
                      />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              variant="outlined"
              size="small"
              label={label}
              error={error}
              helperText={helperText}
              disabled={disabled}
              fullWidth
            />
          )}
          renderOption={(props, option) => {
            return (
              <li {...props}>
                <Grid container alignItems="center">
                  <Grid item>
                    <Box
                      component={LocationOnIcon}
                      className={classes.locationIcon}
                    />
                  </Grid>
                  <Grid item xs>
                    <Typography>{option[identifier]}</Typography>
                  </Grid>
                </Grid>
              </li>
            );
          }}
        />
      )}
    />
  );
};
