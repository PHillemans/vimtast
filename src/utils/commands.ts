import { chainCommands, exitCode } from "prosemirror-commands"
import { Command, TextSelection } from "prosemirror-state";

export const softBreak = chainCommands(exitCode, (state, dispatch) => {
  let br = state.schema.nodes.hard_break;
  if (dispatch)
    dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
  return true
})

export const dispatchLateralMove: (move: number) => Command = (move: number) => (state, dispatch) => {
  if (!dispatch) return false;

  const { from, to } = state.selection;

  const [$from, $to] = [state.doc.resolve(from + move), state.doc.resolve(to + move)]

  const selection = new TextSelection($from, $to);
  dispatch(state.tr.setSelection(selection))

  return true;
}

export const dispatchVerticalPosition: (move: number) => Command = (move) => (state, dispatch, view) => {
  if (!dispatch || !view) return false;

  const { from } = state.selection;
  const startCoords = view.coordsAtPos(from);

  const start = move >= 0 ? from : 0;
  const end = move >= 0 ? state.doc.content.size : from;

  let newPosses: number[] = [];
  state.doc.nodesBetween(start, end, (node, pos) => {
    const coords = view.coordsAtPos(pos);
    const { top } = coords;

    const newCoords = {left: startCoords.left, top};

    if ((top * move) > (startCoords.top * move) && node.type.isInline) {
      const newPos = view.posAtCoords(newCoords)?.pos;
      if (newPos) newPosses.push(newPos);
    }

    return true;
  })

  const newPos = move >= 0 ? newPosses[0] : newPosses.pop();
  let resolvedStart = state.doc.resolve(newPos ?? from);
  const newSelection = new TextSelection(resolvedStart, resolvedStart);

  dispatch(state.tr.setSelection(newSelection));
  return true;
}

export const dispatchParagraphBoundary: (side: number) => Command = (side) => (state, dispatch) => {
  if(!dispatch) return false;

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

  console.log('dispatch')
  dispatch(state.tr.setSelection(newSelection))

  return true;
}
