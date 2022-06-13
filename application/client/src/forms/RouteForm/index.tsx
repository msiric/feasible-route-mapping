import { fetchAddress } from "@api/endpoints";
import { useIsochroneIntersections } from "@contexts/isochroneIntersections";
import { AUTO_HIDE_MENU_WIDTH, useMenuOverlay } from "@contexts/menuOverlay";
import { usePreviousCalculation } from "@contexts/previousCalculation";
import { Option, useShortestPath } from "@contexts/shortestPath";
import { AutocompleteInput } from "@controls/Autocomplete";
import { SelectInput } from "@controls/Select";
import classes from "@forms/RouteForm/style.module.css";
import useWindowDimensions from "@hooks/useWindowDimensions";
import {
  AddLocationAlt as AddLocationIcon,
  ArrowDropDown as ArrowDown,
  ArrowDropUp as ArrowUp,
  Autorenew as RefetchIcon,
  Delete as DeleteIcon,
  HourglassEmpty as CalculateIcon,
  Refresh as RecalculateIcon,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  Typography,
} from "@mui/material";
import { TIME_RANGE_OPTIONS, TRANSPORTATION_MODE_OPTIONS } from "@util/options";
import { FieldError, useFieldArray, useFormContext } from "react-hook-form";
import { DEFAULT_LOCATION_OPTIONS } from "../../App";

const MINIMUM_NUMBER_OF_WAYPOINTS = 2;

const TIME_RANGES = Array.from(
  { length: TIME_RANGE_OPTIONS.max - TIME_RANGE_OPTIONS.min + 1 / 1 },
  (_, i) => ({
    value: (TIME_RANGE_OPTIONS.min + i) * 60,
    label: `${TIME_RANGE_OPTIONS.min + i} ${
      TIME_RANGE_OPTIONS.min + i !== 1 ? "minutes" : "minute"
    }`,
  })
);

const TRANSPORTATION_MODES = Object.values(TRANSPORTATION_MODE_OPTIONS).map(
  (mode) => ({
    value: mode.costing,
    label: mode.label,
  })
);

export const IsochroneForm = () => {
  const shortestPath = useShortestPath((state) => state.data.path);
  const shortestPathError = useShortestPath((state) => state.error);
  const shortestPathLoading = useShortestPath((state) => state.loading);
  const breakPathIntoSegments = useShortestPath(
    (state) => state.breakPathIntoSegments
  );
  const findShortestPath = useShortestPath((state) => state.findShortestPath);

  const isochroneIntersectionsError = useIsochroneIntersections(
    (state) => state.error
  );
  const isochroneIntersectionsLoading = useIsochroneIntersections(
    (state) => state.loading
  );
  const resetIsochroneIntersections = useIsochroneIntersections(
    (state) => state.resetIsochroneIntersections
  );
  const findIsochroneIntersections = useIsochroneIntersections(
    (state) => state.findIsochroneIntersections
  );

  const hideMenuOverlay = useMenuOverlay((state) => state.hideMenuOverlay);

  const setPreviousCalculation = usePreviousCalculation(
    (state) => state.setPreviousCalculation
  );

  const { width } = useWindowDimensions();

  const {
    watch,
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    trigger: triggerValidation,
  } = useFormContext();

  const { append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const values = watch();

  const containsWaypoints = values.options.length > MINIMUM_NUMBER_OF_WAYPOINTS;

  const isDisabled = shortestPathLoading || isochroneIntersectionsLoading;

  const formatSegmentDuration = (duration: number, fixedDigits = 0) =>
    !!fixedDigits
      ? parseFloat((duration / 60).toFixed(fixedDigits))
      : duration / 60;

  const handlePathRefetch = async () => {
    const { params, hash } = breakPathIntoSegments(values);
    await findShortestPath(params, hash);
  };

  const handleFormSubmit = async () => {
    setPreviousCalculation(shortestPath, values);
    resetIsochroneIntersections();
    await findIsochroneIntersections(shortestPath);
    if (width <= AUTO_HIDE_MENU_WIDTH) {
      hideMenuOverlay();
    }
  };

  const handleLocationSwap = async (origin: number, destination: number) => {
    if (origin >= 0 && origin < values.options.length) {
      if (destination >= 0 && destination < values.options.length) {
        if (origin !== destination) {
          setValue(
            "options",
            values.options.map((item: Option, index: number) =>
              origin === index
                ? {
                    ...item,
                    location: !!values.options[destination].location
                      ? {
                          ...values.options[destination].location,
                        }
                      : null,
                  }
                : destination === index
                ? {
                    ...item,
                    location: !!values.options[origin].location
                      ? {
                          ...values.options[origin].location,
                        }
                      : null,
                  }
                : item
            )
          );
          await triggerValidation();
        }
      }
    }
    return;
  };

  const renderDurationLabel = (index?: number) => {
    if (shortestPathLoading) {
      return <CircularProgress size={15} />;
    }
    const pathDuration: string | number = shortestPathError.retry
      ? "N/A"
      : formatSegmentDuration(
          index
            ? shortestPath[index - 1]?.duration ?? 0
            : shortestPath.reduce(
                (total, segment) => total + (segment?.duration ?? 0),
                0
              ),
          2
        );
    const availableTime: string | number = shortestPathError.retry
      ? "N/A"
      : formatSegmentDuration(
          index
            ? (shortestPath[index - 1]?.duration ?? 0) +
                values.options[index].timeRange
            : values.options.reduce(
                (total: number, option: Option) =>
                  total + (option?.timeRange ?? 0),
                0
              ) +
                shortestPath.reduce(
                  (total, segment) => total + (segment?.duration ?? 0),
                  0
                ),
          2
        );
    return (
      <>
        <Typography className={classes.durationLabel}>
          {index
            ? `PD ${pathDuration} min`
            : `Total PD (path duration) ${pathDuration} min`}
        </Typography>
        <Divider
          className={index ? classes.spacer : classes.partition}
          orientation={index ? "horizontal" : "vertical"}
        />
        <Typography className={classes.durationLabel}>
          {index
            ? `AT ${availableTime} min`
            : `Total AT (available time) ${availableTime} min`}
        </Typography>
      </>
    );
  };

  return (
    <Box className={classes.container}>
      <form
        noValidate
        autoComplete="off"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <List className={classes.list}>
          {values.options.map((item: Option, index: number) => (
            <Box
              key={`${item.location?.lat}.${item.location?.lon}.${index}`}
              className={classes.listWrapper}
            >
              {index !== 0 && (
                <Box className={classes.options}>
                  <Divider className={classes.divider} orientation="vertical" />
                  <Box className={classes.itemOptions}>
                    <SelectInput
                      {...register(`options.${index}.timeRange` as const, {
                        required: true,
                      })}
                      control={control}
                      label="Time range"
                      options={TIME_RANGES}
                      disabled={isDisabled}
                      error={!!errors.options?.[index]?.timeRange?.message}
                      helperText={errors.options?.[index]?.timeRange?.message}
                    />
                    <Box className={classes.duration}>
                      {renderDurationLabel(index)}
                    </Box>
                    <SelectInput
                      {...register(
                        `options.${index}.transportationMode` as const,
                        { required: true }
                      )}
                      control={control}
                      label="Transport mode"
                      options={TRANSPORTATION_MODES}
                      disabled={isDisabled}
                      error={
                        !!errors.options?.[index]?.transportationMode?.message
                      }
                      helperText={
                        errors.options?.[index]?.transportationMode?.message
                      }
                    />
                  </Box>
                  <Divider className={classes.divider} orientation="vertical" />
                </Box>
              )}
              <ListItem
                className={`${classes.listItem} ${
                  containsWaypoints && classes.listItemPadding
                }`}
                disableGutters
              >
                <Box className={classes.controlContainer}>
                  <ListItemAvatar className={classes.controlWrapper}>
                    <IconButton
                      className={classes.swapIcon}
                      aria-label="Move up"
                      onClick={() => handleLocationSwap(index, index - 1)}
                    >
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      className={classes.swapIcon}
                      aria-label="Move down"
                      onClick={() => handleLocationSwap(index, index + 1)}
                    >
                      <ArrowDown />
                    </IconButton>
                  </ListItemAvatar>
                  <AutocompleteInput
                    {...register(`options.${index}.location` as const, {
                      required: true,
                    })}
                    label={`Location ${index + 1}`}
                    fetchData={fetchAddress}
                    identifier="display_name"
                    control={control}
                    disabled={isDisabled}
                    error={
                      !!(errors.options?.[index]?.location as FieldError)
                        ?.message
                    }
                    helperText={
                      (errors.options?.[index]?.location as FieldError)
                        ?.message ?? ""
                    }
                  />
                </Box>
                {containsWaypoints && (
                  <ListItemSecondaryAction className={classes.deleteAction}>
                    <IconButton
                      className={classes.deleteIcon}
                      aria-label="Delete"
                      onClick={() => remove(index)}
                      disabled={isDisabled}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </Box>
          ))}
          <Divider className={classes.divider} />
          <Box className={classes.totalDuration}>{renderDurationLabel()}</Box>
          <Box className={classes.excludeLocations}>
            <AutocompleteInput
              {...register(`excludeLocations` as const, {})}
              multiple
              label="Exclude locations"
              fetchData={fetchAddress}
              identifier="display_name"
              control={control}
              disabled={isDisabled}
              error={!!errors.excludeLocations?.message}
              helperText={errors.excludeLocations?.message}
            />
          </Box>
        </List>
        <Box className={classes.actions}>
          <Button
            color="primary"
            type="button"
            variant="outlined"
            size="small"
            startIcon={<AddLocationIcon />}
            onClick={() =>
              append({
                ...DEFAULT_LOCATION_OPTIONS,
              })
            }
            disabled={isDisabled}
          >
            Add waypoint
          </Button>
          {shortestPathError.retry ? (
            <LoadingButton
              color="primary"
              type="button"
              size="small"
              disabled={isDisabled}
              loading={shortestPathLoading}
              loadingPosition="start"
              startIcon={<RefetchIcon />}
              variant="outlined"
              onClick={handlePathRefetch}
            >
              Refetch path
            </LoadingButton>
          ) : isochroneIntersectionsError.retry ? (
            <LoadingButton
              color="primary"
              type="button"
              size="small"
              disabled={isDisabled}
              loading={isochroneIntersectionsLoading}
              loadingPosition="start"
              startIcon={<RecalculateIcon />}
              variant="outlined"
              onClick={handleFormSubmit}
            >
              Recalculate
            </LoadingButton>
          ) : (
            <LoadingButton
              color="primary"
              type="submit"
              size="small"
              disabled={isDisabled}
              loading={isochroneIntersectionsLoading}
              loadingPosition="start"
              startIcon={<CalculateIcon />}
              variant="outlined"
            >
              Run calculation
            </LoadingButton>
          )}
        </Box>
      </form>
    </Box>
  );
};
