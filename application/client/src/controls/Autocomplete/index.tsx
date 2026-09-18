import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import {
  Control,
  Controller,
  ControllerRenderProps,
  useWatch,
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
  showFullValue?: boolean;
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
  showFullValue = false,
  disabled = false,
  fetchingLabel = "Fetching results...",
  placeholderLabel = "Search Adelaide landmarks, or right-click the map",
  emptyLabel = "No bundled landmark found. Right-click the map to choose a point.",
  fetchData,
}: AutocompleteInputProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [options, setOptions] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedValue = useWatch({ control, name });
  const selectedLabel = !multiple && selectedValue?.[identifier] || "";
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!showFullValue || !input) return;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const style = getComputedStyle(input);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const textWidth = context.measureText(selectedLabel).width +
        Math.max(0, selectedLabel.length - 1) * (parseFloat(style.letterSpacing) || 0);
      const availableWidth = input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      setIsTruncated(!!selectedLabel && textWidth > availableWidth);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(input);
    measure();
    void document.fonts.ready.then(measure);
    return () => { active = false; observer.disconnect(); };
  }, [selectedLabel, showFullValue]);

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
    <Box className={classes.autocompleteInput}>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          {...field}
          disableClearable={!field.value}
          className={classes.autocompleteInput}
          multiple={multiple}
          disabled={disabled}
          isOptionEqualToValue={(option, value) => option.lat === value.lat && option.lon === value.lon}
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
            field.onChange(multiple && Array.isArray(newValue) ? newValue.slice(0,8) : newValue);
          }}
          onInputChange={(_event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
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
    {showFullValue && isTruncated && !error && (
      <Typography className={classes.fullValue}>{selectedLabel}</Typography>
    )}
    </Box>
  );
};
