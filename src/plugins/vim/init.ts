import { Command, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { undo, redo } from "prosemirror-history";
import { dispatchLateralMove, dispatchParagraphBoundary, dispatchVerticalPosition, wrapForVimChange } from "../../utils/commands";
import { Extension } from "@tiptap/core";
import { pmPlugin } from "../../App";

export enum VimMode {
  Insert,
  Normal,
  Visual
}

type PmVimState = {
  mode: VimMode
}

export const pmVimPluginKey = new PluginKey("PMVim");
export const pmVim = () => {
  let plugin = new Plugin<PmVimState>({
    key: pmVimPluginKey,
    state: {
      init: () => {
        return {
          mode: VimMode.Normal
        };
      },
      apply: (transaction, state) => {
        if (transaction.getMeta(plugin)) {
          state.mode = transaction.getMeta(plugin)?.modeChange;
        }

        return state;
      }
    },
    filterTransaction: (transaction, state) => {
      const isValidTransaction = !transaction.docChanged || transaction.getMeta(pmVimPluginKey)?.triggeredByVimKey || transaction.getMeta("paste") || transaction.getMeta("clear");
      const isInsertMode = pmVimPluginKey.getState(state).mode === VimMode.Insert;
      if (!isValidTransaction && !isInsertMode) return false;
      return true;
    },
    props: {
      handleKeyDown(this, view, event) {
        const mode = this.getState(view.state)?.mode ?? VimMode.Normal;

        const modifierPrefix = event.shiftKey ? "Shift-" : event.altKey ? "Alt-" : event.ctrlKey ? "Ctrl-" : event.metaKey ? "Meta-" : '';
        const key = `${modifierPrefix}${event.key}`;

        const keyBinds: Record<VimMode, Record<string, Command>> = {
          [VimMode.Normal]: {
            "i": (state, dispatch) => {
              if (!dispatch) return false;

              dispatch(state.tr.setMeta(this, { modeChange: VimMode.Insert }))
              event.preventDefault();
              return true;
            },

            "u": wrapForVimChange(undo),

            "Ctrl-r": wrapForVimChange(redo),

            "h": dispatchLateralMove(-1),

            "j": dispatchVerticalPosition(1),

            "k": dispatchVerticalPosition(-1),

            "l": dispatchLateralMove(1),

            "Shift-$": dispatchParagraphBoundary(1),

            "Shift-^": dispatchParagraphBoundary(-1),

            "Shift-A": (state, ogDispatch) => {
              if (!ogDispatch) return false;
              const dispatch = (tr: Transaction) => {
                tr.setMeta(this, { modeChange: VimMode.Insert });
                ogDispatch(tr);
              }
              dispatchParagraphBoundary(1)(state, dispatch)

              return true;
            }
          },
          [VimMode.Insert]: {
            "Escape": ({}) => {
              view.dispatch(view.state.tr.setMeta(this, { modeChange: VimMode.Normal }))
              return true;
            }
          },
          [VimMode.Visual]: {}
        };

        if (keyBinds?.[mode] && Object.keys(keyBinds[mode]).includes(key)) {
          return keyBinds[mode][key](view.state, view.dispatch, view);
        } else {
          return false;
        }
      }
    }
  });
  return plugin;
}

export const Vim = Extension.create({
  addProseMirrorPlugins() {
      return [
        pmVim()
    ]
  },
});
