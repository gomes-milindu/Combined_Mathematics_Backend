import pino from 'pino';
import { Logtail } from '@logtail/node';


import pkg from '@logtail/pino';
const { LogtailStream } = pkg;

const isProduction = process.env.NODE_ENV === 'production';

let stream;

if (isProduction) {
  const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
  stream = new LogtailStream(logtail);
} else {
  stream = pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  });
}

const logger = pino({
  level: isProduction ? 'info' : 'debug',
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.creditCard', 'body.cvv'],
    censor: '[REDACTED]'
  }
}, stream);

export default logger;