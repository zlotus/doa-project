// import { request } from '../utils/request'
import { api } from '../utils/config';

export async function establishWSConnect(payload) {
  const put = payload.put;
  const ws = new WebSocket(api.odas.wsSSTUrl);
  ws.onopen = (event) => {
    ws.send('start');
  };
  ws.onmessage = (event) => {
    ws.send('received');
    put({ type: 'updateCurrentFrame', payload: event.data });
  };
  ws.onclose = (event) => {
    ws.send('close');
  };
}
