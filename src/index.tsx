/* @refresh reload */
import { render } from "solid-js/web";

import "./styles.css";
import App from "./App";

console.log('is this thing going')
render(() => <App />, document.getElementById("root") as HTMLElement);
