// import { establishWSConnect } from '../services/odasServices';
import { api } from '@/utils/config';


const rgbValueStrings = ['rgb(75,192,192)', 'rgb(192,75,192)', 'rgb(192,192,30)', 'rgb(0,200,40)'];

const createSource = (url) => {

  const source = new WebSocket(url);
  let deferred;

  source.onmessage = event => {
    if (deferred) {
      try {
        deferred.resolve(JSON.parse(event.data));
      } catch (e) {
        console.log(e, event.data);
        deferred.resolve({});
      } finally {
        deferred = null;
      }
    }
  };

  source.onopen = (event) => {
    // source.send('start');
  };

  source.onclose = (event) => {
    source.send('close');
  };

  return {
    nextMessage() {
      if (!deferred) {
        deferred = {};
        deferred.promise = new Promise((resolve) => {
          deferred.resolve = resolve;
        });
      }
      return deferred.promise;
    },

    sendMessage(msg) {
      source.send(msg);
    },
  };
};

// Single source data
// class TrackingSource {
//   constructor(index = 0, id = 0, active = false, x = 0, y = 0, z = 0) {
//
//     // Web UI info
//     this.rgbValueString = rgbValueStrings[index];
//     this.selected = true;
//
//     // Source info
//     this.id = null;
//     this.active = false;
//     this.x = null;
//     this.y = null;
//     this.z = null;
//   }
// }

// Single potential source data
// class LocalizationSource {
//   constructor(x = 0, y = 0, z = 0, e = 0) {
//     this.x = x;
//     this.y = y;
//     this.z = z;
//     this.e = e;
//   }
// }

// Single data frame
// class DataFrame {
//   constructor() {
//
//     this.localizationTimestamp = null;
//     this.trackingTimestamp = null;
//
//     this.localizationSources = [];
//     this.trackingSources = [];

// rgbValueStrings.forEach((color, i) => {
//   this.trackingSources.push(new TrackingSource(i));
// });
//   }
// }

export default {
  namespace: 'odasModel',
  state: {
    localizationTimestamp: 0,
    localizationSources: [],
    trackingTimestamp: 0,
    trackingSources: [],

    // currentFrame: new DataFrame(),
    isTracking: false,
  },

  subscriptions: {
    setup({ history, dispatch }) {
      return history.listen(({ pathname }) => {
        if (pathname === '/odas/' || pathname === '/odas') {
          dispatch({ type: 'startTracking', payload: api.odas.wsSSTUrl });
          dispatch({ type: 'startLocalization', payload: api.odas.wsSSLUrl });
        }
      });
    },
  },

  effects: {
    * startTracking({ payload }, { put, call, fork }) {
      function* watchMessages(msgSource) {
        let txs = yield call(msgSource.nextMessage);
        while (txs) {
          // yield put(transactions(txs));
          if (txs) {
            yield put({ type: 'updateTrackingFrame', payload: txs });
            msgSource.sendMessage('received');
          }
          txs = yield call(msgSource.nextMessage);
        }
      }

      const msgSource = yield call(createSource, payload);
      yield fork(watchMessages, msgSource);
    },

    * startLocalization({ payload }, { put, call, fork }) {
      function* watchMessages(msgSource) {
        let txs = yield call(msgSource.nextMessage);
        while (txs) {
          // yield put(transactions(txs));
          if (txs) {
            yield put({ type: 'updateLocalizationFrame', payload: txs });
            msgSource.sendMessage('received');
          }
          txs = yield call(msgSource.nextMessage);
        }
      }

      const msgSource = yield call(createSource, payload);
      yield fork(watchMessages, msgSource);
    },
  },

  reducers: {
    updateTrackingFrame(state, { payload }) {
      let trackingSources = [];
      if (payload.src) {    // If frame contains sources
        payload.src.forEach(function(source) {
          trackingSources.push({
            id: source.id,
            tag: source.tag,
            x: source.x,
            y: source.y,
            z: source.z,
            activity: source.activity,
          });
        });
      }

      return {
        ...state,
        trackingTimestamp: payload.timeStamp,
        trackingSources: trackingSources,

      };
    },

    updateLocalizationFrame(state, { payload }) {
      let localizationSources = [];
      if (payload.src) {    // If frame contains sources
        payload.src.forEach(function(source) {
          localizationSources.push({ x: source.x, y: source.y, z: source.z, e: source.E });
        });
      }

      return {
        ...state,
        localizationTimestamp: payload.timeStamp,
        localizationSources: localizationSources,
      };
    },
  },
};
