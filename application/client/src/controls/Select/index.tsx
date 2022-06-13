import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { Control, Controller } from "react-hook-form";
import classes from "@controls/Select/style.module.css";

interface SelectInputProps {
  control: Control;
  label: string;
  name: string;
  options: { value: number | string; label: string }[];
  disabled: boolean;
  error: boolean;
  helperText: string;
}

export const SelectInput = ({
  control,
  label,
  name,
  options,
  disabled,
  error,
  helperText,
}: SelectInputProps) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <FormControl className={classes.selectInput} fullWidth>
        <InputLabel id="select-input">{label}</InputLabel>
        <Select
          {...field}
          MenuProps={{ PaperProps: { sx: { maxHeight: 350 } } }}
          label={label}
          labelId="select-input"
          size="small"
          disabled={disabled}
          onChange={(event) => {
            field.onChange(event?.target.value);
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
          <FormHelperText error={error}>{helperText}</FormHelperText>
        </Select>
      </FormControl>
    )}
  />
);
