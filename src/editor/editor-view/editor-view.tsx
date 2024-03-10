import { invoke } from "@tauri-apps/api";
import { onMount } from "solid-js";
import { Vim } from "../../plugins/vim/init";
import { type } from "@tauri-apps/api/os";
import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import History from "@tiptap/extension-history";
import Heading from "@tiptap/extension-heading";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";

let mac = true;
if (window.__TAURI__) {
  mac = (await type()) === "Darwin" ;
}

function EditorView() {
  let editorContainer!: HTMLDivElement;

  onMount(async () => {
    const fileContents = await invoke<string>("open_file", {
      path: "/Users/pepijnhillemans/some-markdown.md"
    });

    new Editor({
      element: editorContainer,
      content: fileContents,
      extensions: [
        ...[
          Document,
          Paragraph,
          Heading,
          Text,
          OrderedList,
          BulletList,
          ListItem
        ],
        ...[
          Vim,
          History
        ]
      ]
    })
  })

  return (
    <div class="container">
      <div id="text-editor-content" ref={editorContainer}></div>
    </div>
  );
}

export default EditorView;
