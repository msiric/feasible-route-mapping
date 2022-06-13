// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
// @ts-nocheck

import "@testing-library/jest-dom";

const createElementNSOrig = global.document.createElementNS;
global.document.createElementNS = (namespaceURI, qualifiedName) => {
  if (
    namespaceURI === "http://www.w3.org/2000/svg" &&
    qualifiedName === "svg"
  ) {
    const element = createElementNSOrig.apply(this, arguments);
    element.createSVGRect = () => {};
    return element;
  }
  return createElementNSOrig.apply(this, arguments);
};
