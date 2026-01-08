import { render } from "@wordpress/element";
import App from "./App";

const root = document.getElementById("wp-neurolink-admin-root");

if (root) {
  render(<App />, root);
}
