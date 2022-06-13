import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders isochrone form", () => {
  render(<App />);
  const submit = screen.getByText(/submit/i);
  expect(submit).toBeInTheDocument();
});
