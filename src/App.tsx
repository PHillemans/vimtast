import { EditorView } from "prosemirror-view";
import "./App.css";
import { Command, EditorState } from "prosemirror-state";
import { onMount } from "solid-js";
import { NodeSpec, Schema, SchemaSpec, DOMParser, MarkSpec } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap } from "prosemirror-commands";
import { history } from "prosemirror-history";
import { type } from '@tauri-apps/api/os'
import { pmVim } from "./plugins/vim/init";
import { softBreak } from "./utils/commands";

declare global {
  interface Window {
    __TAURI__: Record<string, unknown>;
  }
}

let mac = true;
if (window.__TAURI__) {
  await type();
}

function App() {
  onMount(() => {
    let place = document.querySelector("#text-editor-content");
    let schema = pmPlugin();

    let previousData = document.createElement('div');

    previousData.innerHTML = `
<p>some text <strong>bold</strong> <em>italic</em> <strong><em>bold italic</em></strong></p>
<ul>
<li>first point</li>
<li>second point</li>
</ul>
<ol>
<li>first point</li>
<li>second point</li>
</ol>
`;

    new EditorView(place, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(previousData)!,
        plugins: pmPlugins({ schema }),
      })
    });
  })

  return (
    <div class="container">
      <div id="text-editor-content">
      </div>
    </div>
  );
}

export default App;

function pmPlugin() {
  let nodes: Record<string, NodeSpec> = {
    doc: {
      content: "block+"
    },

    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{tag: "p"}],
      toDOM() { return ["p", 0]}
    },

    text: {
      group: "inline"
    },

    hard_break: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{tag: "br"}],
      toDOM() { return ["br"] }
    },

    bullet_list: {
      content: "list_item+",
      group: "block",
      attrs: {tight: {default: false}},
      parseDOM: [{tag: "ul", getAttrs: dom => ({tight: (dom as HTMLElement).hasAttribute("data-tight")})}],
      toDOM(node) {return ["ul", {"data-tight": node.attrs.tight ? "true" : null}, 0]}
    },

    numbered_list: {
      content: "list_item+",
      group: "block",
      attrs: {order: {default: 1}, tight: {default: false}},
      parseDOM: [{tag: "ol", getAttrs: dom => ({
        order: (dom as HTMLElement).hasAttribute("start") ? +(dom as HTMLElement).getAttribute("start")! : 1,
        tight: (dom as HTMLElement).hasAttribute("data-tight")
      })}],
      toDOM(node) {return ["ol", {"order": node.attrs.order == 1 ? null : node.attrs.order, "data-tight": node.attrs.tight ? "true" : null}, 0]}
    },

    list_item: {
      content: "block+",
      defining: true,
      parseDOM: [{tag: "li"}],
      toDOM() { return ["li", 0]}
    }
  };

  let marks: Record<string, MarkSpec> = {};

  ["em", "strong"].forEach((el) => {
    marks[el] = {
      parseDOM: [
        {tag: el}
      ],
      toDOM: () => {
        return [el]
      }
    }
  })

  let spec: SchemaSpec = {
    nodes,
    marks
  };
  return new Schema(spec)
}

function pmPlugins(options: {
  schema: Schema
}) {
  let plugins = [
    keymap(baseKeymap),
    keymap(defaultPlugin(options.schema)),
    pmVim(),
    history()
  ]

  return plugins;
}

function defaultPlugin(schema: Schema) {
  let keys: Record<string, Command> = {};

  if (schema.nodes.hard_break) {
    keys["Mod-Enter"] = softBreak;
    keys["Shift-Enter"] = softBreak;
    if (mac) keys["Ctrl-Enter"] = softBreak
  }

  return keys;
}

