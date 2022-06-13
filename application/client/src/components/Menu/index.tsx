import classes from "@components/Menu/style.module.css";
import { MenuActions } from "@components/MenuActions";
import { useMenuOverlay } from "@contexts/menuOverlay";
import { IsochroneForm } from "@forms/RouteForm";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export const MenuCard = () => {
  const isMenuVisible = useMenuOverlay((state) => state.visible);

  return (
    <Box
      className={`${classes.container} ${
        !isMenuVisible && classes.containerHidden
      }`}
    >
      <Card variant="outlined">
        <MenuActions />
        <CardContent className={classes.content}>
          <IsochroneForm />
        </CardContent>
      </Card>
    </Box>
  );
};
