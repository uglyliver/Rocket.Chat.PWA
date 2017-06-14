import 'babel-polyfill';
import * as express from 'express';
import * as session from 'express-session';
import * as Grant from 'grant-express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as http from 'http';
import * as request from 'request';
import { graphiqlExpress, graphqlExpress } from 'graphql-server-express';
import { createSchemeWithAccounts } from './schema';
import { JSAccountsContext } from '@accounts/graphql-api';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { createServer } from 'http';
import { initAccounts } from './accounts';
import { grantConfig } from './grant-config';

const PORT = 3000;
const WS_GQL_PATH = '/subscriptions';
export const GRANT_PATH = '/auth';
const CLIENT_SERVER = 'http://localhost:4200';

async function main() {
  const app = express();
  app.use(cors());
  app.use(session({
    secret: 'grant',
    resave: true,
    saveUninitialized: true,
  }));

  const grant = new Grant({
    server: {
      protocol: 'http',
      host: 'localhost:3000',
      path: '/auth',
    },
    facebook: {
      key: '353692268378789',
      secret: '30fa7be4ee732b4cc28c6d8acab54263',
      callback: `${GRANT_PATH}/handle_facebook_callback`,
      scope: [],
    },
    google: {
      key: '822500959137-ktt8mfq95vlvq8ogcbu4gg3paear7174.apps.googleusercontent.com',
      secret: 'PBMWy2O-739OyqTItjXP3Dzq',
      callback: `${GRANT_PATH}/handle_google_callback`,
      scope: ['openid email'],
    },
  });

  app.use(GRANT_PATH, grant);

  app.get(`${GRANT_PATH}/handle_facebook_callback`, function (req, res) {
    const accessToken = req.query.access_token;
    let userData;
    request(`https://graph.facebook.com/me?fields=name&access_token==${accessToken}`, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        userData = JSON.parse(body);
      }
    });
    res.redirect(`${CLIENT_SERVER}/login`);
  });

  app.get(`${GRANT_PATH}/handle_google_callback`, function (req, res) {
    const accessToken = req.query.access_token;
    let userData;
    request(`https://www.googleapis.com/plus/v1/people/me?access_token=${accessToken}`, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        userData = JSON.parse(body);
      }
    });
    res.redirect(`${CLIENT_SERVER}/login`);
  });

  const accountsServer = await initAccounts();
  const schema = createSchemeWithAccounts(accountsServer);

  app.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
    schema,
    context: JSAccountsContext(request),
    debug: true,
  })));

  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
  }));

  const server = createServer(app);

  new SubscriptionServer(
    {
      schema,
      execute,
      subscribe,
    },
    {
      path: WS_GQL_PATH,
      server,
    }
  );

  server.listen(PORT, () => {
    console.log('Mock server running on: ' + PORT);
  });
}

main().catch((e) => console.log('Failed to start mock server', e));
