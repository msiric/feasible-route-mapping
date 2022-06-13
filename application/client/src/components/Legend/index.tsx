import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { TRANSPORTATION_MODE_PROPERTIES } from "@util/options";
import { Typography } from "@mui/material";
import classes from "@components/Legend/style.module.css";
import { CompareArrows as DirectionIcon } from "@mui/icons-material";
import { useMenuOverlay } from "@contexts/menuOverlay";

export const LegendCard = () => {
  const isMenuVisible = useMenuOverlay((state) => state.visible);

  return (
    <Box
      className={`${classes.container} ${
        !isMenuVisible && classes.containerHidden
      }`}
    >
      <Box>
        <Card className={classes.card} variant="outlined">
          <CardContent>
            <Box>
              {Object.values(TRANSPORTATION_MODE_PROPERTIES).map((item) => (
                <Box
                  key={`${item.color}.${item.label}`}
                  className={classes.content}
                >
                  {item.icon({ color: item.color })}
                  <Typography className={classes.label}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box>
        <Card className={classes.card} variant="outlined">
          <CardContent>
            <Box>
              <Box className={classes.content}>
                <Box className={classes.gradient} />
                <Box className={classes.annotation}>
                  <Typography className={classes.label}>
                    Largest interval step
                  </Typography>
                  <DirectionIcon className={classes.icon} />
                  <Typography className={classes.label}>
                    Smallest interval step
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
