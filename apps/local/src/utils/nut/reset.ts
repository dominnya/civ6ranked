import { Key, keyboard } from '@nut-tree-fork/nut-js';

export async function resetState() {
  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Escape);
  await keyboard.type(Key.Escape);
}
