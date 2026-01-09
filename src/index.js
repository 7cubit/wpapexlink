import { render } from "@wordpress/element";
import './index.css';
import App from "./App";

const root = document.getElementById("wp-neurolink-admin-root");

if (root) {
  render(<App />, root);
}
