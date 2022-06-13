import { SplitButton, SplitButtonOption } from "@components/SplitButton";
import { Box, Button } from "@mui/material";
import { formatLocation } from "@util/geometry";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Popup, useMapEvents } from "react-leaflet";
import { DEFAULT_LOCATION_OPTIONS } from "../../App";
import classes from "./style.module.css";
import {
  TripOrigin as AddOriginIcon,
  Flag as AddDestinationIcon,
  EditLocationAlt as EditLocationIcon,
  RemoveCircleOutline as ExcludeLocationIcon,
} from "@mui/icons-material";
import { Option } from "@contexts/shortestPath";

interface PopupState {
  lat: number | null;
  lon: number | null;
}

const buttonStyles = { fontSize: 14 };

export const MapPopup = () => {
  const [position, setPosition] = useState<PopupState>({
    lat: null,
    lon: null,
  });

  const {
    getValues,
    setValue,
    trigger,
    watch,
    formState: { isSubmitted },
  } = useFormContext();

  const values = watch();

  useMapEvents({
    contextmenu(e) {
      const { lat, lon } = formatLocation(e.latlng);

      handlePositionChange({ lat, lon });
    },
  });

  const handlePositionChange = (location: PopupState) => {
    setPosition({ ...location });
    isSubmitted && trigger();
  };

  const handlePrependLocation = () => {
    const values = getValues();
    setValue("options", [
      {
        location: {
          lat: position.lat,
          lon: position.lon,
          display_name: `${position.lat},${position.lon}`,
        },
      },
      ...values.options.map((item: Option, id: number) =>
        id === 0
          ? {
              ...DEFAULT_LOCATION_OPTIONS,
              ...item,
            }
          : item
      ),
    ]);
    handlePositionChange({ lat: null, lon: null });
  };

  const handleEditLocation = ({ index }: SplitButtonOption) => {
    const values = getValues();
    setValue(
      "options",
      values.options.map((item: Option, id: number) =>
        id === index
          ? {
              ...item,
              location: {
                lat: position.lat,
                lon: position.lon,
                display_name: `${position.lat},${position.lon}`,
              },
            }
          : item
      )
    );
    handlePositionChange({ lat: null, lon: null });
  };

  const handleAppendLocation = () => {
    const values = getValues();
    setValue("options", [
      ...values.options,
      {
        ...DEFAULT_LOCATION_OPTIONS,
        location: {
          lat: position.lat,
          lon: position.lon,
          display_name: `${position.lat},${position.lon}`,
        },
      },
    ]);
    handlePositionChange({ lat: null, lon: null });
  };

  const handleExcludeLocation = () => {
    const values = getValues();
    setValue("excludeLocations", [
      ...values.excludeLocations,
      {
        lat: position.lat,
        lon: position.lon,
        display_name: `${position.lat},${position.lon}`,
      },
    ]);
    handlePositionChange({ lat: null, lon: null });
  };

  return position.lat !== null && position.lon !== null ? (
    <Popup
      className={classes.popupContainer}
      position={[position.lat, position.lon]}
      onClose={() => setPosition({ lat: null, lon: null })}
    >
      <Box className={classes.popupWrapper}>
        <SplitButton
          options={values.options.map((_item: Option, index: number) => ({
            index,
            label: `Location ${index + 1}`,
          }))}
          startIcon={<EditLocationIcon style={{ ...buttonStyles }} />}
          handleMenuClick={handleEditLocation}
        />
        <Button
          className={classes.button}
          variant="text"
          size="small"
          startIcon={<AddOriginIcon style={{ ...buttonStyles }} />}
          onClick={handlePrependLocation}
        >
          Prepend location
        </Button>
        <Button
          className={classes.button}
          variant="text"
          size="small"
          startIcon={<AddDestinationIcon style={{ ...buttonStyles }} />}
          onClick={handleAppendLocation}
        >
          Append location
        </Button>
        <Button
          className={classes.button}
          variant="text"
          size="small"
          startIcon={<ExcludeLocationIcon style={{ ...buttonStyles }} />}
          onClick={handleExcludeLocation}
        >
          Exclude location
        </Button>
      </Box>
    </Popup>
  ) : null;
};
