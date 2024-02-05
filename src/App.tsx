import { EditorView } from "prosemirror-view";
import "./App.css";
import { EditorState } from "prosemirror-state";
import { defaultMarkdownParser } from "prosemirror-markdown";
import { onMount } from "solid-js";

function App() {

  onMount(() => {
    let place = document.querySelector("#text-editor-content");
    let view = new EditorView(place, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse("some markdown **content**")!
      })
    });
  })

  return (
    <div class="container">
      <div id="text-editor-content"></div>
    </div>
  );
}

export default App;
