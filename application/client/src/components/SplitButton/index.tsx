import {
  useState,
  useRef,
  MouseEvent as MouseEventGlobal,
  ReactElement,
} from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import classes from "./style.module.css";
import { Box } from "@mui/material";

export type SplitButtonOption = { index: number; label: string };

interface SplitButtonProps {
  options: SplitButtonOption[];
  startIcon?: ReactElement;
  handleMenuClick: (option: SplitButtonOption) => void;
}

export const SplitButton = ({
  options,
  startIcon,
  handleMenuClick,
}: SplitButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(options[0].index);

  const anchorRef = useRef<HTMLDivElement>(null);

  const handleMenuItemClick = (
    _event: MouseEventGlobal<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <ButtonGroup
        className={classes.buttonGroup}
        variant="text"
        ref={anchorRef}
      >
        <Button
          className={classes.button}
          startIcon={startIcon}
          size="small"
          onClick={() => handleMenuClick(options[selectedIndex])}
        >
          {`Edit ${options[selectedIndex].label}`}
        </Button>
        <Button
          className={classes.iconButton}
          size="small"
          variant="text"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        className={classes.popperContainer}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Box className={classes.popperWrapper}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList className={classes.popperList} autoFocusItem>
                  {options.map(({ index, label }) => (
                    <MenuItem
                      key={label}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Box>
          </Grow>
        )}
      </Popper>
    </>
  );
};
