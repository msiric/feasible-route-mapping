import classes from "@components/Tooltip/style.module.css";
import { Box } from "@mui/material";
import { ReactElement } from "react";
import { Tooltip } from "react-leaflet";

export type MapTooltipOption = {
  icon: ReactElement;
  element: ReactElement;
};

interface MapTooltipProps {
  sticky: boolean;
  options: MapTooltipOption[];
}

export const MapTooltip = ({ sticky, options }: MapTooltipProps) => {
  return (
    <Tooltip sticky={sticky}>
      <Box className={classes.tooltipContainer}>
        {options.map((item, index) => (
          <Box key={index} className={classes.tooltipWrapper}>
            {item.icon}
            {item.element}
          </Box>
        ))}
      </Box>
    </Tooltip>
  );
};
