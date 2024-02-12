import { Command, Plugin, PluginKey, TextSelection, Transaction } from "prosemirror-state";
import { undo, redo } from "prosemirror-history";
import { dispatchLateralMove, dispatchParagraphBoundary, dispatchVerticalPosition } from "../../utils/commands";

enum VimMode {
  Insert,
  Normal,
  Visual
}

type PmVimState = {
  mode: VimMode
}

export const pmVim = () => {
  let pluginKey = new PluginKey("PMVim");
  let plugin = new Plugin<PmVimState>({
    key: pluginKey,
    state: {
      init: () => {
        return {
          mode: VimMode.Normal
        };
      },
      apply: (transaction, state) => {
        if (transaction.getMeta(plugin))

          state.mode = transaction.getMeta(plugin)?.modeChange;

          return state;
      }
    },
    filterTransaction: (transaction, state) => {
      const isValidTransaction = !transaction.docChanged || transaction.getMeta(pluginKey)?.triggeredByVimKey;
      const isInsertMode = pluginKey.getState(state).mode === VimMode.Insert;
      if (!isValidTransaction && !isInsertMode) return false;
      return true;
    },
    props: {
      handleKeyDown(this, view, event) {
        const mode = this.getState(view.state)?.mode ?? VimMode.Normal;

        const modifierPrefix = event.shiftKey ? "Shift-" : event.altKey ? "Alt-" : event.ctrlKey ? "Ctrl-" : event.metaKey ? "Meta-" : '';
        const key = `${modifierPrefix}${event.key}`;

        const wrapForVimChange: (command: Command) => Command = (command: Command) => (state, ogDispatch): boolean => {
            if (!ogDispatch) return false;

            const dispatch = (transaction: Transaction) => {
              transaction.setMeta(pluginKey, { triggeredByVimKey: true })
              ogDispatch(transaction);
            }
            command(state, dispatch, view)
            return true;
        }

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

            "Shift-^": dispatchParagraphBoundary(-1)
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
