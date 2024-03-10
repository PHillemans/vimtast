import "./App.css";
import { NodeSpec, Schema, SchemaSpec, MarkSpec } from "prosemirror-model";
import EditorView from "./editor/editor-view/editor-view";

function App() {
  return (
    <div class="container">
      <EditorView />
    </div>
  );
}

export default App;
