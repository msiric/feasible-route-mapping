import classes from "@components/MenuActions/style.module.css";
import { useIsochroneIntersections } from "@contexts/isochroneIntersections";
import { useMenuOverlay } from "@contexts/menuOverlay";
import { usePreviousCalculation } from "@contexts/previousCalculation";
import { useShortestPath } from "@contexts/shortestPath";
import {
  ArrowBackIos as ToggleIcon,
  RestartAlt as ResetIcon,
  History as RevertIcon,
} from "@mui/icons-material";
import { CardHeader, IconButton, Typography } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { DEFAULT_FORM_VALUES } from "../../App";

export const MenuActions = () => {
  const isMenuVisible = useMenuOverlay((state) => state.visible);
  const toggleMenuOverlay = useMenuOverlay((state) => state.toggleMenuOverlay);

  const shortestPathLoading = useShortestPath((state) => state.loading);
  const setShortestPath = useShortestPath((state) => state.setShortestPath);
  const resetShortestPath = useShortestPath((state) => state.resetShortestPath);

  const isochroneIntersectionsLoading = useIsochroneIntersections(
    (state) => state.loading
  );
  const resetIsochroneIntersections = useIsochroneIntersections(
    (state) => state.resetIsochroneIntersections
  );

  const previousPath = usePreviousCalculation((state) => state.path);
  const previousHash = usePreviousCalculation((state) => state.hash);
  const previousValues = usePreviousCalculation((state) => state.values);
  const resetPreviousCalculation = usePreviousCalculation(
    (state) => state.resetPreviousCalculation
  );

  const { reset: resetValues } = useFormContext();

  const isDisabled = shortestPathLoading || isochroneIntersectionsLoading;

  const resetCurrentState = () => {
    resetValues({ ...DEFAULT_FORM_VALUES });
    resetShortestPath();
    resetIsochroneIntersections();
    resetPreviousCalculation();
  };

  const revertPreviousState = () => {
    if (!!previousPath.length) {
      resetValues({ ...previousValues });
      setShortestPath([...previousPath], previousHash);
    }
  };

  return (
    <CardHeader
      className={classes.header}
      title={
        <Typography className={classes.heading}>
          Feasible route mapping
        </Typography>
      }
      action={
        <>
          <IconButton
            className={classes.reset}
            disabled={isDisabled}
            disableRipple
            onClick={resetCurrentState}
          >
            <ResetIcon className={classes.icon} />
          </IconButton>
          <IconButton
            className={classes.revert}
            disabled={isDisabled || !previousPath.length}
            disableRipple
            onClick={revertPreviousState}
          >
            <RevertIcon className={classes.icon} />
          </IconButton>
          <IconButton
            className={`${classes.toggle} ${
              !isMenuVisible && classes.toggleHidden
            }`}
            disableRipple
            onClick={toggleMenuOverlay}
          >
            <ToggleIcon
              className={`${classes.icon} ${
                !isMenuVisible && classes.iconHidden
              }`}
            />
          </IconButton>
        </>
      }
    ></CardHeader>
  );
};
