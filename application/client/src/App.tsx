import { LegendCard } from "@components/Legend";
import { Map } from "@components/Map";
import { MenuCard } from "@components/Menu";
import { useIsochroneIntersections } from "@contexts/isochroneIntersections";
import { Option } from "@contexts/shortestPath";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Collapse, ThemeProvider } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";
import theme from "@styles/theme";
import { validationSchema } from "@util/validation";
import Leaflet from "leaflet";
import {
  OptionsObject,
  SnackbarKey,
  SnackbarMessage,
  useSnackbar,
} from "notistack";
import { useEffect, useRef } from "react";
import { FieldValues, FormProvider, useForm } from "react-hook-form";
import { useShortestPath } from "./contexts/shortestPath";

Leaflet.Icon.Default.imagePath = "img/";

export const DEFAULT_LOCATION_OPTIONS = {
  location: null,
  timeRange: 300,
  transportationMode: "auto",
};

export const DEFAULT_FORM_VALUES = {
  options: [{ location: null }, { ...DEFAULT_LOCATION_OPTIONS }],
  excludeLocations: [],
};
export interface FormValues {
  options: Option[];
  excludeLocations: Location[];
}

export type EnqueueSnackbar = (
  message: SnackbarMessage,
  options?: OptionsObject | undefined
) => SnackbarKey;

export const SNACKBAR_OPTIONS: OptionsObject = {
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "center",
  },
  variant: "error",
  TransitionComponent: Collapse,
};

export const App = () => {
  const shortestPathError = useShortestPath((state) => state.error);
  const findShortestPath = useShortestPath((state) => state.findShortestPath);
  const breakPathIntoSegments = useShortestPath(
    (state) => state.breakPathIntoSegments
  );

  const isochroneIntersectionsError = useIsochroneIntersections(
    (state) => state.error
  );

  const valuesHash = useRef("");

  const methods = useForm<FieldValues>({
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
    },
    mode: "onChange",
    resolver: yupResolver(validationSchema),
  });

  const values = methods.watch();

  const { enqueueSnackbar } = useSnackbar();

  const handleValuesChange = async () => {
    const { params, hash } = breakPathIntoSegments(values);
    if (hash !== valuesHash.current) {
      valuesHash.current = hash;
      await findShortestPath(params, hash);
    }
  };

  useEffect(() => {
    handleValuesChange();
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shortestPathError.retry) {
      enqueueSnackbar(shortestPathError.message, SNACKBAR_OPTIONS);
    }
    if (isochroneIntersectionsError.retry) {
      enqueueSnackbar(isochroneIntersectionsError.message, SNACKBAR_OPTIONS);
    }
  }, [shortestPathError.retry, isochroneIntersectionsError.retry]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <FormProvider {...methods}>
          <Box>
            <MenuCard />
            <LegendCard />
            <Map />
          </Box>
        </FormProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
