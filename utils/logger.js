import pino from 'pino'; // require වෙනුවට import

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProduction ? 'info' : 'debug',
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.creditCard', 'body.cvv'],
    censor: '[REDACTED]'
  },
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined
});

export default logger; // module.exports වෙනුවට export default