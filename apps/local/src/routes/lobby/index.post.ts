import { Button, keyboard, mouse, Point } from '@nut-tree-fork/nut-js';
import { type } from 'arktype';

import { LobbyMessage } from '~/types/response';
import { define } from '~/utils/define';
import { serviceAuth } from '~/utils/guards/auth';
import { validate } from '~/utils/guards/validate';
import { goToUPCPLobby } from '~/utils/nut/goToUPCPLobby';
import { isInLobby } from '~/utils/nut/isInLobby';
import { resetState } from '~/utils/nut/reset';
import { setSpectator } from '~/utils/nut/setSpectator';
import { waitForLobby } from '~/utils/nut/waitForLobby';
import { send } from '~/utils/response';
import { wait } from '~/utils/wait';

const JoinRequestBody = type({
  code: '/^[A-Za-z0-9]{3}-[A-Za-z0-9]{3,4}$/',
});

const JoinReply = type({
  message: "'JOINED'",
});

const JoinError = type({
  message: "'UNKNOWN_LOBBY_ERROR' | 'LOBBY_NOT_FOUND' | 'LOBBY_WAIT_TOO_LONG' | 'ALREADY_IN_LOBBY'",
});

export default define()
  .meta({
    path: '/lobby',
    method: 'post',
    summary: 'Join a lobby',
    description: 'Joins a lobby with the given code',
    tags: ['Lobby'],
    security: [{ serviceAuth: [] }],
    requestBody: {
      description: 'The code of the lobby to join',
      required: true,
      schema: JoinRequestBody,
    },
    responses: {
      200: {
        description: 'Successfully joined the lobby',
        schema: JoinReply,
      },
      400: {
        description: 'Bad request',
        schema: JoinError,
      },
    },
  })
  .guard([serviceAuth, validate({ body: JoinRequestBody })])
  .handle<{
    Body: typeof JoinRequestBody.infer;
    Reply: typeof JoinReply.infer;
  }>(async (request, reply) => {
    try {
      const inLobby = await isInLobby();
      if (inLobby) return send(reply).badRequest(LobbyMessage.ALREADY_IN_LOBBY);

      const destinationResult = await goToUPCPLobby();
      if (!(destinationResult instanceof Point)) return send(reply).badRequest(destinationResult);

      // Click "Use Join Code"
      await mouse.setPosition(destinationResult);
      await mouse.click(Button.LEFT);
      await wait(500);

      // Move mouse to center of the screen (join code input)
      await mouse.setPosition(new Point(960, 540 + 25));
      await mouse.click(Button.LEFT);

      // Type join code
      await keyboard.type(request.body.code);

      // Move mouse to Join button
      await mouse.setPosition(new Point(960 + 50, 540 + 80));
      await mouse.click(Button.LEFT);

      const waitLobbyResult = await waitForLobby();
      if (waitLobbyResult !== LobbyMessage.JOINED) return send(reply).badRequest(waitLobbyResult);

      const setSpectatorResult = await setSpectator();
      if (setSpectatorResult !== LobbyMessage.READY) {
        resetState();
        return send(reply).badRequest(setSpectatorResult);
      }

      return send(reply).ok(LobbyMessage.JOINED);
    } catch {
      return send(reply).badRequest(LobbyMessage.UNKNOWN_LOBBY_ERROR);
    }
  });
