import { GRANT_PATH } from './index';

export const grantConfig = {
  server: {
    protocol: 'http',
    host: 'localhost:3000',
    path: GRANT_PATH,
  },
  facebook: { // https://graph.facebook.com/me?fields=name&access_token=
    key: '353692268378789',
    secret: '30fa7be4ee732b4cc28c6d8acab54263',
    callback: `${GRANT_PATH}/handle_facebook_callback`,
    scope: [],
  },
  google: { // https://www.googleapis.com/plus/v1/people/me?access_token=
    key: '822500959137-ktt8mfq95vlvq8ogcbu4gg3paear7174.apps.googleusercontent.com',
    secret: 'PBMWy2O-739OyqTItjXP3Dzq',
    callback: `${GRANT_PATH}/handle_google_callback`,
    scope: ['openid email'],
  },
};
