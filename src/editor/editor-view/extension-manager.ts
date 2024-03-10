import { NodeSpec, Schema } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

export class ExtensionManager {
  editor: EditorView;
  schema: Schema;

  extensions: Extensions
}

type Extensions = Extension[];

class Extension {
  constructor(config: ExtensionConfig) {
  }
}

type ExtensionConfig = {
  schema: NodeSpec;
}
