import { chainCommands, exitCode } from "prosemirror-commands"
import { Command, TextSelection, Transaction } from "prosemirror-state";
import { pmVimPluginKey } from "../plugins/vim/init";

export const softBreak = chainCommands(exitCode, (state, dispatch) => {
  let br = state.schema.nodes.hard_break;
  if (dispatch)
    dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
  return true
})

export const dispatchLateralMove: (move: number) => Command = (move: number) => (state, dispatch) => {
  if (!dispatch) return true;

  const { from, to, $anchor } = state.selection;

  if ((move >= 0 && $anchor.nodeAfter === null || move < 0 && $anchor.nodeBefore == null)) return true;

  const [$from, $to] = [state.doc.resolve(from + move), state.doc.resolve(to + move)]

  const selection = new TextSelection($from, $to);
  dispatch(state.tr.setSelection(selection))

  return true;
}

export const dispatchVerticalPosition: (move: number) => Command = (move) => (state, dispatch, view) => {
  if (!dispatch || !view) return true;

  const { from } = state.selection;
  const startCoords = view.coordsAtPos(from);

  // const start = move >= 0 ? from : 0;
  // const end = move >= 0 ? state.doc.content.size : from;

  let newPosses: number[] = [];
  // state.doc.nodesBetween(start, end, (node, pos) => {
  //   const coords = view.coordsAtPos(pos);
  //   const { top } = coords;

  //   const newCoords = {left: startCoords.left, top};

  //   if ((top * move) > (startCoords.top * move) && node.type.isInline) {
  //     const newPos = view.posAtCoords(newCoords)?.pos;
  //     if (newPos) newPosses.push(newPos);
  //   }

  //   return true;
  // })

  if (newPosses.length == 0) {
    const possibleNewPos = { left: startCoords.left, top: startCoords.top + (24 * move) };
    console.log(possibleNewPos)
    const possibleAlternative = view.posAtCoords(possibleNewPos)?.pos; 
    possibleAlternative && view.coordsAtPos(possibleAlternative).left && startCoords.left && newPosses.push(possibleAlternative)
  }

  console.log(newPosses)
  const newPos = move >= 0 ? newPosses[0] : newPosses.pop();
  let resolvedStart = state.doc.resolve(newPos ?? from);
  const newSelection = new TextSelection(resolvedStart, resolvedStart);

  dispatch(state.tr.setSelection(newSelection));
  return true;
}

export const dispatchParagraphBoundary: (side: number) => Command = (side) => (state, dispatch) => {
  if(!dispatch) return true;

  let foundPos: undefined | number;
  
  const start = side >= 0 ? state.selection.head : state.selection.head - state.selection.$head.parentOffset;

  state.doc.nodesBetween(start, state.selection.head, (node, pos) => {
    const resolvedPos = side >= 0 ? ((pos + node.content.size) + (pos + node.nodeSize)) / 2 : pos + 1;
    if ((side >= 0 ? resolvedPos < state.selection.head : resolvedPos > state.selection.head) || foundPos) return false;
    if (node.type.name === "paragraph") {
      foundPos = resolvedPos;
    }

    return true;
  });

  const newSelection = new TextSelection(state.doc.resolve(foundPos ?? 0) , state.doc.resolve(foundPos ?? 0))

  dispatch(state.tr.setSelection(newSelection))

  return true;
};

export const clearContent: () => Command = () => (state, dispatch): boolean => {
  if (!dispatch) return true;

  const tr = state.tr.delete(0, state.doc.content.size);
  tr.setMeta("clear", true);
  dispatch(tr)

  return true;
};

export const insertContent: (content: string) => Command = (content) => (_state, _dispatch, view) => {
  view?.pasteHTML(content);

  return true;
};


export const wrapForVimChange: (command: Command) => Command = (command: Command) => (state, ogDispatch, view): boolean => {
  if (!ogDispatch) return false;

  const dispatch = (transaction: Transaction) => {
    transaction.setMeta(pmVimPluginKey, { triggeredByVimKey: true })
    ogDispatch(transaction);
  }
  command(state, dispatch, view)
  return true;
}
